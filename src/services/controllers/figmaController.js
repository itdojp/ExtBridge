/**
 * ExtBridge - Figma連携コントローラー
 * Figma連携機能のエンドポイントを処理します
 */

const passport = require('passport');
const { Strategy: OAuth2Strategy } = require('passport-oauth2');
const config = require('../../../config/default');
const User = require('../../auth/models/user');
const FigmaClient = require('../figma/figmaClient');
const logger = require('../../utils/logger');

// Figma OAuth設定
// 注: Figmaは標準のOAuth2を使用
passport.use('figma', new OAuth2Strategy({
  authorizationURL: 'https://www.figma.com/oauth',
  tokenURL: 'https://www.figma.com/api/oauth/token',
  clientID: config.services.figma.clientId,
  clientSecret: config.services.figma.clientSecret,
  callbackURL: config.services.figma.callbackUrl,
  state: true
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Figma APIからユーザー情報を取得
    const figmaClient = new FigmaClient(accessToken);
    const figmaUser = await figmaClient.getUserInfo();
    
    logger.info(`Figma OAuth認証: ${figmaUser.email} (${figmaUser.id})`);
    
    // ユーザー検索（認証済みユーザーのみ）
    const user = await User.findOne({ email: figmaUser.email });
    
    if (!user) {
      logger.warn(`Figma連携エラー: ユーザーが見つかりません - ${figmaUser.email}`);
      return done(null, false, { message: 'ユーザーが見つかりません。先にログインしてください。' });
    }
    
    // Figmaサービス連携情報を更新
    const serviceIndex = user.connectedServices.findIndex(s => s.service === 'figma');
    
    if (serviceIndex >= 0) {
      // 既存の連携情報を更新
      user.connectedServices[serviceIndex] = {
        service: 'figma',
        serviceUserId: figmaUser.id,
        accessToken,
        refreshToken,
        tokenExpiry: new Date(Date.now() + 3600000), // 1時間の有効期限（Figmaの仕様に合わせて調整）
        scopes: ['file_read'],
        connectedAt: new Date()
      };
    } else {
      // 新規連携情報を追加
      user.connectedServices.push({
        service: 'figma',
        serviceUserId: figmaUser.id,
        accessToken,
        refreshToken,
        tokenExpiry: new Date(Date.now() + 3600000),
        scopes: ['file_read'],
        connectedAt: new Date()
      });
    }
    
    await user.save();
    logger.info(`Figma連携成功: ${user.email} - ${figmaUser.handle}`);
    
    return done(null, user);
  } catch (error) {
    logger.error(`Figma連携エラー: ${error.message}`);
    return done(error);
  }
}));

// コントローラーメソッド
module.exports = {
  // Figma認証開始
  connect: (req, res, next) => {
    passport.authenticate('figma', {
      session: false,
      scope: ['file_read'],
      state: req.user.id // ユーザーIDをstateパラメータとして渡す
    })(req, res, next);
  },
  
  // Figma認証コールバック
  handleCallback: (req, res, next) => {
    passport.authenticate('figma', { session: false }, (err, user) => {
      if (err) {
        logger.error(`Figma認証コールバックエラー: ${err.message}`);
        return res.redirect('/dashboard?error=figma_auth_failed');
      }
      
      if (!user) {
        logger.warn('Figma認証: ユーザー情報なし');
        return res.redirect('/dashboard?error=figma_no_user');
      }
      
      // 連携成功、ダッシュボードにリダイレクト
      res.redirect('/dashboard?message=figma_connected');
    })(req, res, next);
  },
  
  // Figma連携解除
  disconnect: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'ユーザーが見つかりません'
        });
      }
      
      // Figma連携情報を削除
      user.connectedServices = user.connectedServices.filter(s => s.service !== 'figma');
      await user.save();
      
      logger.info(`Figma連携解除: ${user.email}`);
      
      return res.json({
        status: 'success',
        message: 'Figma連携を解除しました'
      });
    } catch (error) {
      logger.error(`Figma連携解除エラー: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Figma連携解除に失敗しました',
        error: error.message
      });
    }
  },
  
  // ユーザーのFigmaプロジェクト一覧を取得
  getProjects: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'ユーザーが見つかりません'
        });
      }
      
      // Figma連携確認
      const figmaService = user.getServiceConnection('figma');
      if (!figmaService) {
        return res.status(403).json({
          status: 'error',
          message: 'Figmaと連携されていません'
        });
      }
      
      // アクセストークンの有効期限確認
      if (figmaService.tokenExpiry && new Date(figmaService.tokenExpiry) < new Date()) {
        return res.status(401).json({
          status: 'error',
          message: 'Figmaアクセストークンの有効期限が切れています。再連携してください。'
        });
      }
      
      // Figmaクライアント初期化
      const figmaClient = new FigmaClient(figmaService.accessToken);
      
      // ユーザー情報取得
      const figmaUser = await figmaClient.getUserInfo();
      
      // チームプロジェクト一覧取得
      const projects = [];
      for (const team of figmaUser.teams) {
        const teamProjects = await figmaClient.getTeamProjects(team.id);
        projects.push(...teamProjects.map(project => ({
          ...project,
          teamName: team.name
        })));
      }
      
      return res.json({
        status: 'success',
        data: {
          projects
        }
      });
    } catch (error) {
      logger.error(`Figmaプロジェクト取得エラー: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Figmaプロジェクト取得に失敗しました',
        error: error.message
      });
    }
  },
  
  // プロジェクトのファイル一覧を取得
  getProjectFiles: async (req, res) => {
    try {
      const { projectId } = req.params;
      
      if (!projectId) {
        return res.status(400).json({
          status: 'error',
          message: 'プロジェクトIDが必要です'
        });
      }
      
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'ユーザーが見つかりません'
        });
      }
      
      // Figma連携確認
      const figmaService = user.getServiceConnection('figma');
      if (!figmaService) {
        return res.status(403).json({
          status: 'error',
          message: 'Figmaと連携されていません'
        });
      }
      
      // Figmaクライアント初期化
      const figmaClient = new FigmaClient(figmaService.accessToken);
      
      // プロジェクトファイル一覧取得
      const files = await figmaClient.getProjectFiles(projectId);
      
      return res.json({
        status: 'success',
        data: {
          files
        }
      });
    } catch (error) {
      logger.error(`Figmaファイル一覧取得エラー: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Figmaファイル一覧取得に失敗しました',
        error: error.message
      });
    }
  },
  
  // ファイルの詳細情報を取得
  getFileDetails: async (req, res) => {
    try {
      const { fileKey } = req.params;
      
      if (!fileKey) {
        return res.status(400).json({
          status: 'error',
          message: 'ファイルキーが必要です'
        });
      }
      
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'ユーザーが見つかりません'
        });
      }
      
      // Figma連携確認
      const figmaService = user.getServiceConnection('figma');
      if (!figmaService) {
        return res.status(403).json({
          status: 'error',
          message: 'Figmaと連携されていません'
        });
      }
      
      // Figmaクライアント初期化
      const figmaClient = new FigmaClient(figmaService.accessToken);
      
      // ファイル詳細取得
      const file = await figmaClient.getFile(fileKey);
      
      // コメント一覧取得
      const comments = await figmaClient.getComments(fileKey);
      
      return res.json({
        status: 'success',
        data: {
          file,
          comments
        }
      });
    } catch (error) {
      logger.error(`Figmaファイル詳細取得エラー: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Figmaファイル詳細取得に失敗しました',
        error: error.message
      });
    }
  }
};
