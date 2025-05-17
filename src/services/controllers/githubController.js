/**
 * ExtBridge - GitHub連携コントローラー
 * GitHub連携機能のエンドポイントを処理します
 */

const passport = require('passport');
const { Strategy: GitHubStrategy } = require('passport-github2');
const config = require('../../../config/default');
const User = require('../../auth/models/user');
const GitHubClient = require('../github/githubClient');
const logger = require('../../utils/logger');

// GitHub OAuth設定
passport.use(new GitHubStrategy({
  clientID: config.services.github.clientId,
  clientSecret: config.services.github.clientSecret,
  callbackURL: config.services.github.callbackUrl,
  scope: ['user', 'repo', 'read:org']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    logger.info(`GitHub OAuth認証: ${profile.username} (${profile.id})`);
    
    // ユーザー検索（認証済みユーザーのみ）
    const user = await User.findOne({ email: profile.emails[0].value });
    
    if (!user) {
      logger.warn(`GitHub連携エラー: ユーザーが見つかりません - ${profile.emails[0].value}`);
      return done(null, false, { message: 'ユーザーが見つかりません。先にログインしてください。' });
    }
    
    // GitHubサービス連携情報を更新
    const serviceIndex = user.connectedServices.findIndex(s => s.service === 'github');
    
    if (serviceIndex >= 0) {
      // 既存の連携情報を更新
      user.connectedServices[serviceIndex] = {
        service: 'github',
        serviceUserId: profile.id,
        accessToken,
        refreshToken,
        tokenExpiry: null, // GitHubトークンは期限なし
        scopes: ['user', 'repo', 'read:org'],
        connectedAt: new Date()
      };
    } else {
      // 新規連携情報を追加
      user.connectedServices.push({
        service: 'github',
        serviceUserId: profile.id,
        accessToken,
        refreshToken,
        tokenExpiry: null,
        scopes: ['user', 'repo', 'read:org'],
        connectedAt: new Date()
      });
    }
    
    await user.save();
    logger.info(`GitHub連携成功: ${user.email} - ${profile.username}`);
    
    return done(null, user);
  } catch (error) {
    logger.error(`GitHub連携エラー: ${error.message}`);
    return done(error);
  }
}));

// コントローラーメソッド
module.exports = {
  // GitHub認証開始
  connect: (req, res, next) => {
    passport.authenticate('github', {
      session: false,
      state: req.user.id // ユーザーIDをstateパラメータとして渡す
    })(req, res, next);
  },
  
  // GitHub認証コールバック
  handleCallback: (req, res, next) => {
    passport.authenticate('github', { session: false }, (err, user) => {
      if (err) {
        logger.error(`GitHub認証コールバックエラー: ${err.message}`);
        return res.redirect('/dashboard?error=github_auth_failed');
      }
      
      if (!user) {
        logger.warn('GitHub認証: ユーザー情報なし');
        return res.redirect('/dashboard?error=github_no_user');
      }
      
      // 連携成功、ダッシュボードにリダイレクト
      res.redirect('/dashboard?message=github_connected');
    })(req, res, next);
  },
  
  // GitHub連携解除
  disconnect: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'ユーザーが見つかりません'
        });
      }
      
      // GitHub連携情報を削除
      user.connectedServices = user.connectedServices.filter(s => s.service !== 'github');
      await user.save();
      
      logger.info(`GitHub連携解除: ${user.email}`);
      
      return res.json({
        status: 'success',
        message: 'GitHub連携を解除しました'
      });
    } catch (error) {
      logger.error(`GitHub連携解除エラー: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'GitHub連携解除に失敗しました',
        error: error.message
      });
    }
  },
  
  // ユーザーのGitHubリポジトリ一覧を取得
  getRepositories: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'ユーザーが見つかりません'
        });
      }
      
      // GitHub連携確認
      const githubService = user.getServiceConnection('github');
      if (!githubService) {
        return res.status(403).json({
          status: 'error',
          message: 'GitHubと連携されていません'
        });
      }
      
      // GitHubクライアント初期化
      const githubClient = new GitHubClient(githubService.accessToken);
      
      // ユーザー情報取得
      const githubUser = await githubClient.getUserInfo();
      
      // リポジトリ一覧取得
      const repositories = await githubClient.getRepositories(githubUser.login, {
        sort: 'updated',
        per_page: 50
      });
      
      return res.json({
        status: 'success',
        data: {
          repositories
        }
      });
    } catch (error) {
      logger.error(`GitHubリポジトリ取得エラー: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'GitHubリポジトリ取得に失敗しました',
        error: error.message
      });
    }
  },
  
  // リポジトリの詳細情報を取得
  getRepositoryDetails: async (req, res) => {
    try {
      const { owner, repo } = req.params;
      
      if (!owner || !repo) {
        return res.status(400).json({
          status: 'error',
          message: 'オーナーとリポジトリ名が必要です'
        });
      }
      
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'ユーザーが見つかりません'
        });
      }
      
      // GitHub連携確認
      const githubService = user.getServiceConnection('github');
      if (!githubService) {
        return res.status(403).json({
          status: 'error',
          message: 'GitHubと連携されていません'
        });
      }
      
      // GitHubクライアント初期化
      const githubClient = new GitHubClient(githubService.accessToken);
      
      // リポジトリ詳細取得
      const repository = await githubClient.getRepository(owner, repo);
      
      // コミット履歴取得
      const commits = await githubClient.getCommits(owner, repo, {
        per_page: 10
      });
      
      // Issue一覧取得
      const issues = await githubClient.getIssues(owner, repo, {
        state: 'open',
        per_page: 10
      });
      
      return res.json({
        status: 'success',
        data: {
          repository,
          commits,
          issues
        }
      });
    } catch (error) {
      logger.error(`GitHubリポジトリ詳細取得エラー: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'GitHubリポジトリ詳細取得に失敗しました',
        error: error.message
      });
    }
  }
};
