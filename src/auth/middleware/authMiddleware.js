/**
 * ExtBridge - 認証ミドルウェア
 * JWTトークンの検証と認可制御を行います
 */

const jwt = require('jsonwebtoken');
const config = require('../../../config/default');
const User = require('../models/user');
const logger = require('../../utils/logger');

// JWTトークンの検証ミドルウェア
const verifyToken = (req, res, next) => {
  // ヘッダーからトークンを取得
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"形式を想定
  
  if (!token) {
    logger.warn('認証トークンが提供されていません');
    return res.status(401).json({
      status: 'error',
      message: '認証が必要です'
    });
  }
  
  try {
    // トークンの検証
    const decoded = jwt.verify(token, config.auth.jwt.secret);
    req.user = decoded; // デコードされたユーザー情報をリクエストに追加
    next();
  } catch (error) {
    logger.error(`トークン検証エラー: ${error.message}`);
    return res.status(403).json({
      status: 'error',
      message: '無効または期限切れのトークンです'
    });
  }
};

// ユーザーロールの検証ミドルウェア
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: '認証が必要です'
      });
    }
    
    if (roles.includes(req.user.role)) {
      next();
    } else {
      logger.warn(`アクセス拒否: ユーザー ${req.user.email} (${req.user.role}) は必要な権限を持っていません`);
      return res.status(403).json({
        status: 'error',
        message: 'このリソースにアクセスする権限がありません'
      });
    }
  };
};

// ユーザーデータの取得ミドルウェア
const loadUser = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return next();
  }
  
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      req.userData = user; // 完全なユーザーデータをリクエストに追加
    }
    next();
  } catch (error) {
    logger.error(`ユーザーデータ取得エラー: ${error.message}`);
    next();
  }
};

// サービス接続の検証ミドルウェア
const checkServiceConnection = (serviceName) => {
  return (req, res, next) => {
    if (!req.userData) {
      return res.status(401).json({
        status: 'error',
        message: 'ユーザーデータが読み込まれていません'
      });
    }
    
    if (req.userData.isConnectedTo(serviceName)) {
      next();
    } else {
      return res.status(403).json({
        status: 'error',
        message: `${serviceName}との連携が設定されていません`
      });
    }
  };
};

module.exports = {
  verifyToken,
  checkRole,
  loadUser,
  checkServiceConnection
};
