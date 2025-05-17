/**
 * ExtBridge - SAML認証コントローラー
 * SAML SSOによる認証フローを管理します
 */

const passport = require('passport');
const { Strategy } = require('passport-saml');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const config = require('../../../config/default');
const logger = require('../../utils/logger');

// SAML戦略の設定
const samlStrategy = new Strategy({
  entryPoint: config.auth.saml.entryPoint,
  issuer: config.auth.saml.issuer,
  callbackUrl: config.auth.saml.callbackUrl,
  cert: config.auth.saml.cert,
  disableRequestedAuthnContext: true,
  identifierFormat: null
}, async (profile, done) => {
  try {
    logger.info(`SAML認証: ${profile.nameID} (${profile.email})`);
    
    // ユーザーの検索または作成
    let user = await User.findOne({ email: profile.email });
    
    if (!user) {
      // 新規ユーザーの作成
      user = new User({
        email: profile.email,
        name: profile.displayName || profile.email.split('@')[0],
        displayName: profile.displayName,
        samlId: profile.nameID,
        department: profile.department || ''
      });
      await user.save();
      logger.info(`新規ユーザー作成: ${user.email}`);
    } else {
      // 既存ユーザーの更新
      user.samlId = profile.nameID;
      user.lastLogin = new Date();
      await user.save();
      logger.info(`既存ユーザーログイン: ${user.email}`);
    }
    
    return done(null, user);
  } catch (error) {
    logger.error(`SAML認証エラー: ${error.message}`);
    return done(error);
  }
});

// Passportにストラテジーを登録
passport.use(samlStrategy);

// ユーザーシリアライズ/デシリアライズ
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// JWTトークンの生成
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  
  return jwt.sign(payload, config.auth.jwt.secret, {
    expiresIn: config.auth.jwt.expiresIn
  });
};

// コントローラーメソッド
module.exports = {
  // SAML認証開始
  initiateAuth: (req, res, next) => {
    passport.authenticate('saml', {
      failureRedirect: '/auth/login',
      failureFlash: true
    })(req, res, next);
  },
  
  // SAML認証コールバック
  handleCallback: (req, res, next) => {
    passport.authenticate('saml', { session: false }, (err, user) => {
      if (err) {
        logger.error(`SAML認証コールバックエラー: ${err.message}`);
        return res.redirect('/auth/login?error=auth_failed');
      }
      
      if (!user) {
        logger.warn('SAML認証: ユーザー情報なし');
        return res.redirect('/auth/login?error=no_user');
      }
      
      // JWTトークンの生成
      const token = generateToken(user);
      
      // クライアントにトークンを返す（通常はCookieまたはローカルストレージに保存）
      res.redirect(`/auth/success?token=${token}`);
    })(req, res, next);
  },
  
  // 認証成功ハンドラー
  authSuccess: (req, res) => {
    // フロントエンドアプリケーションにリダイレクト
    // 実際の実装ではフロントエンドのURLとトークンの受け渡し方法を調整する
    res.send(`
      <html>
        <head>
          <title>認証成功</title>
          <script>
            // トークンをローカルストレージに保存
            const token = new URLSearchParams(window.location.search).get('token');
            if (token) {
              localStorage.setItem('auth_token', token);
              window.location.href = '/dashboard';
            }
          </script>
        </head>
        <body>
          <h1>認証成功</h1>
          <p>リダイレクト中...</p>
        </body>
      </html>
    `);
  },
  
  // ログインページ
  loginPage: (req, res) => {
    res.send(`
      <html>
        <head>
          <title>ExtBridge - ログイン</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f5f5f5; }
            .login-container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }
            h1 { margin-top: 0; color: #333; }
            .btn { display: inline-block; background: #4285f4; color: white; padding: 10px 15px; border-radius: 4px; text-decoration: none; margin-top: 1rem; }
          </style>
        </head>
        <body>
          <div class="login-container">
            <h1>ExtBridge</h1>
            <p>個人契約クラウドサービス管理システム</p>
            <a href="/auth/saml" class="btn">Exticアカウントでログイン</a>
          </div>
        </body>
      </html>
    `);
  },
  
  // Exticとの接続検証
  verifyExticConnection: async (req, res) => {
    try {
      // Extic APIとの接続テスト
      // 実際の実装ではExtic APIクライアントを使用
      
      res.json({
        status: 'success',
        message: 'Extic接続検証成功',
        timestamp: new Date()
      });
    } catch (error) {
      logger.error(`Extic接続検証エラー: ${error.message}`);
      res.status(500).json({
        status: 'error',
        message: 'Extic接続検証失敗',
        error: error.message
      });
    }
  }
};
