/**
 * ExtBridge - 認証ルート
 * 認証関連のエンドポイントを定義します
 */

const express = require('express');
const router = express.Router();
const samlController = require('../controllers/samlController');
const { verifyToken } = require('../middleware/authMiddleware');

// SAML認証ルート
router.get('/saml', samlController.initiateAuth);
router.post('/saml/callback', samlController.handleCallback);
router.get('/success', samlController.authSuccess);
router.get('/login', samlController.loginPage);

// 認証検証ルート
router.get('/verify', verifyToken, (req, res) => {
  res.json({
    status: 'success',
    message: '認証済みユーザー',
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Extic接続検証ルート
router.get('/verify-extic', verifyToken, samlController.verifyExticConnection);

module.exports = router;
