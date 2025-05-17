/**
 * ExtBridge - Slack連携コントローラー
 * Slack連携機能のエンドポイントを処理します
 */

const passport = require('passport');
const { Strategy: SlackStrategy } = require('passport-slack-oauth2');
const config = require('../../../config/default');
const User = require('../../auth/models/user');
const SlackClient = require('../slack/slackClient');
const logger = require('../../utils/logger');

// Slack OAuth設定
passport.use(new SlackStrategy({
  clientID: config.services.slack.clientId,
  clientSecret: config.services.slack.clientSecret,
  callbackURL: config.services.slack.callbackUrl,
  scope: ['channels:read', 'chat:write', 'users:read', 'team:read', 'files:read']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    logger.info(`Slack OAuth認証: ${profile.user.email} (${profile.user.id})`);
    
    // ユーザー検索（認証済みユーザーのみ）
    const user = await User.findOne({ email: profile.user.email });
    
    if (!user) {
      logger.warn(`Slack連携エラー: ユーザーが見つかりません - ${profile.user.email}`);
      return done(null, false, { message: 'ユーザーが見つかりません。先にログインしてください。' });
    }
    
    // Slackサービス連携情報を更新
    const serviceIndex = user.connectedServices.findIndex(s => s.service === 'slack');
    
    if (serviceIndex >= 0) {
      // 既存の連携情報を更新
      user.connectedServices[serviceIndex] = {
        service: 'slack',
        serviceUserId: profile.user.id,
        accessToken,
        refreshToken,
        tokenExpiry: new Date(Date.now() + 86400000), // 24時間の有効期限
        scopes: ['channels:read', 'chat:write', 'users:read', 'team:read', 'files:read'],
        connectedAt: new Date(),
        teamId: profile.team.id,
        teamName: profile.team.name
      };
    } else {
      // 新規連携情報を追加
      user.connectedServices.push({
        service: 'slack',
        serviceUserId: profile.user.id,
        accessToken,
        refreshToken,
        tokenExpiry: new Date(Date.now() + 86400000),
        scopes: ['channels:read', 'chat:write', 'users:read', 'team:read', 'files:read'],
        connectedAt: new Date(),
        teamId: profile.team.id,
        teamName: profile.team.name
      });
    }
    
    await user.save();
    logger.info(`Slack連携成功: ${user.email} - ${profile.user.name}`);
    
    return done(null, user);
  } catch (error) {
    logger.error(`Slack連携エラー: ${error.message}`);
    return done(error);
  }
}));

// コントローラーメソッド
module.exports = {
  // Slack認証開始
  connect: (req, res, next) => {
    passport.authenticate('slack', {
      session: false,
      state: req.user.id // ユーザーIDをstateパラメータとして渡す
    })(req, res, next);
  },
  
  // Slack認証コールバック
  handleCallback: (req, res, next) => {
    passport.authenticate('slack', { session: false }, (err, user) => {
      if (err) {
        logger.error(`Slack認証コールバックエラー: ${err.message}`);
        return res.redirect('/dashboard?error=slack_auth_failed');
      }
      
      if (!user) {
        logger.warn('Slack認証: ユーザー情報なし');
        return res.redirect('/dashboard?error=slack_no_user');
      }
      
      // 連携成功、ダッシュボードにリダイレクト
      res.redirect('/dashboard?message=slack_connected');
    })(req, res, next);
  },
  
  // Slack連携解除
  disconnect: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'ユーザーが見つかりません'
        });
      }
      
      // Slack連携情報を削除
      user.connectedServices = user.connectedServices.filter(s => s.service !== 'slack');
      await user.save();
      
      logger.info(`Slack連携解除: ${user.email}`);
      
      return res.json({
        status: 'success',
        message: 'Slack連携を解除しました'
      });
    } catch (error) {
      logger.error(`Slack連携解除エラー: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Slack連携解除に失敗しました',
        error: error.message
      });
    }
  },
  
  // チャンネル一覧を取得
  getChannels: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'ユーザーが見つかりません'
        });
      }
      
      // Slack連携確認
      const slackService = user.getServiceConnection('slack');
      if (!slackService) {
        return res.status(403).json({
          status: 'error',
          message: 'Slackと連携されていません'
        });
      }
      
      // アクセストークンの有効期限確認
      if (slackService.tokenExpiry && new Date(slackService.tokenExpiry) < new Date()) {
        return res.status(401).json({
          status: 'error',
          message: 'Slackアクセストークンの有効期限が切れています。再連携してください。'
        });
      }
      
      // Slackクライアント初期化
      const slackClient = new SlackClient(slackService.accessToken);
      
      // チャンネル一覧取得
      const channels = await slackClient.getChannels();
      
      return res.json({
        status: 'success',
        data: {
          channels
        }
      });
    } catch (error) {
      logger.error(`Slackチャンネル一覧取得エラー: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Slackチャンネル一覧取得に失敗しました',
        error: error.message
      });
    }
  },
  
  // チャンネルのメッセージ履歴を取得
  getChannelHistory: async (req, res) => {
    try {
      const { channelId } = req.params;
      
      if (!channelId) {
        return res.status(400).json({
          status: 'error',
          message: 'チャンネルIDが必要です'
        });
      }
      
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'ユーザーが見つかりません'
        });
      }
      
      // Slack連携確認
      const slackService = user.getServiceConnection('slack');
      if (!slackService) {
        return res.status(403).json({
          status: 'error',
          message: 'Slackと連携されていません'
        });
      }
      
      // Slackクライアント初期化
      const slackClient = new SlackClient(slackService.accessToken);
      
      // メッセージ履歴取得
      const messages = await slackClient.getChannelHistory(channelId, {
        limit: 50
      });
      
      return res.json({
        status: 'success',
        data: {
          messages
        }
      });
    } catch (error) {
      logger.error(`Slackメッセージ履歴取得エラー: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Slackメッセージ履歴取得に失敗しました',
        error: error.message
      });
    }
  },
  
  // メッセージを送信
  sendMessage: async (req, res) => {
    try {
      const { channelId, text, threadTs } = req.body;
      
      if (!channelId || !text) {
        return res.status(400).json({
          status: 'error',
          message: 'チャンネルIDとメッセージテキストが必要です'
        });
      }
      
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'ユーザーが見つかりません'
        });
      }
      
      // Slack連携確認
      const slackService = user.getServiceConnection('slack');
      if (!slackService) {
        return res.status(403).json({
          status: 'error',
          message: 'Slackと連携されていません'
        });
      }
      
      // Slackクライアント初期化
      const slackClient = new SlackClient(slackService.accessToken);
      
      // メッセージ送信
      const result = await slackClient.sendMessage(channelId, text, {
        thread_ts: threadTs
      });
      
      return res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error(`Slackメッセージ送信エラー: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Slackメッセージ送信に失敗しました',
        error: error.message
      });
    }
  },
  
  // チーム情報を取得
  getTeamInfo: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'ユーザーが見つかりません'
        });
      }
      
      // Slack連携確認
      const slackService = user.getServiceConnection('slack');
      if (!slackService) {
        return res.status(403).json({
          status: 'error',
          message: 'Slackと連携されていません'
        });
      }
      
      // Slackクライアント初期化
      const slackClient = new SlackClient(slackService.accessToken);
      
      // チーム情報取得
      const teamInfo = await slackClient.getTeamInfo();
      
      return res.json({
        status: 'success',
        data: {
          team: teamInfo
        }
      });
    } catch (error) {
      logger.error(`Slackチーム情報取得エラー: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Slackチーム情報取得に失敗しました',
        error: error.message
      });
    }
  }
};
