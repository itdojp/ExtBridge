/**
 * ExtBridge - Extic SAML認証コントローラー
 * 
 * Exticサーバーとの連携によるSAML認証を処理するコントローラー
 */

const passport = require('passport');
const { Strategy } = require('passport-saml');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const config = require('../../config');
const logger = require('../../monitoring/app-monitoring').logger;

// SAML認証戦略の設定
const samlStrategy = new Strategy({
  entryPoint: config.auth.saml.entryPoint,
  issuer: config.auth.saml.issuer,
  callbackUrl: config.auth.saml.callbackUrl,
  cert: config.auth.saml.cert,
  identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
}, async (profile, done) => {
  try {
    if (!profile || !profile.nameID) {
      logger.error('SAML認証: プロファイル情報がありません');
      return done(null, false);
    }

    logger.info(`SAML認証: ユーザー ${profile.nameID} が認証されました`);
    return done(null, profile);
  } catch (error) {
    logger.error(`SAML認証エラー: ${error.message}`, { error });
    return done(error);
  }
});

passport.use('saml', samlStrategy);

// SAML認証を開始する
const initiateExticSamlLogin = (req, res, next) => {
  logger.info('Extic SAML認証を開始します');
  passport.authenticate('saml', {
    failureRedirect: '/auth/login',
    failureFlash: true
  })(req, res, next);
};

// SAML認証のコールバックを処理する
const handleExticSamlCallback = async (req, res, next) => {
  try {
    // SAML Assertionの検証
    if (!verifyExticSamlAssertion(req)) {
      logger.error('無効なSAML Assertion');
      return res.status(401).json({
        status: 'error',
        message: '認証に失敗しました'
      });
    }

    // ユーザー情報がない場合はエラー
    if (!req.user) {
      logger.error('SAML認証: ユーザー情報がありません');
      return res.status(401).json({
        status: 'error',
        message: '認証に失敗しました'
      });
    }

    // ユーザー情報の取得
    const email = req.user.nameID || req.user.email;
    const firstName = req.user.firstName || '';
    const lastName = req.user.lastName || '';

    // ユーザーの作成または更新
    const user = await User.findOneAndUpdate(
      { email },
      { 
        $setOnInsert: { 
          email, 
          role: 'user',
          firstName,
          lastName
        } 
      },
      { new: true, upsert: true }
    );

    // JWTトークンの生成
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      config.auth.jwt.secret,
      { expiresIn: config.auth.jwt.expiresIn || '24h' }
    );

    logger.info(`ユーザー ${email} が認証されました`);
    
    // ダッシュボードにリダイレクト（トークン付き）
    return res.redirect(`/dashboard?token=${token}`);
  } catch (error) {
    logger.error(`SAML認証コールバックエラー: ${error.message}`, { error });
    return next(error);
  }
};

// SAML Assertionを検証する
const verifyExticSamlAssertion = (req) => {
  try {
    // 実際の環境では、SAML Assertionの署名検証などを行う
    // このサンプルでは簡易的な検証のみ
    const samlResponse = req.body.SAMLResponse;
    
    if (!samlResponse) {
      logger.error('SAML Response がありません');
      return false;
    }
    
    // Base64デコード
    const decoded = Buffer.from(samlResponse, 'base64').toString('utf-8');
    
    // 簡易的な検証（実際の環境ではより厳密に行う）
    if (decoded.includes('<saml:Assertion') && decoded.includes('<saml:Subject')) {
      return true;
    }
    
    logger.error('無効なSAML Assertion形式');
    return false;
  } catch (error) {
    logger.error(`SAML Assertion検証エラー: ${error.message}`, { error });
    return false;
  }
};

module.exports = {
  initiateExticSamlLogin,
  handleExticSamlCallback,
  verifyExticSamlAssertion
};
