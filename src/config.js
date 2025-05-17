/**
 * ExtBridge - 設定ファイル
 * 
 * アプリケーション全体の設定を管理します。
 * 環境変数から設定値を読み込みます。
 */

require('dotenv').config();

const config = {
  // アプリケーション設定
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    name: 'ExtBridge'
  },
  
  // データベース設定
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/extbridge',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // 認証設定
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    saml: {
      entryPoint: process.env.SAML_ENTRY_POINT || 'https://extic.example.com/saml2/idp/SSOService.php',
      issuer: process.env.SAML_ISSUER || 'extic-saml',
      callbackUrl: process.env.SAML_CALLBACK_URL || 'https://extbridge.example.com/auth/saml/callback',
      cert: process.env.SAML_CERT || null
    }
  },
  
  // Extic設定
  extic: {
    baseUrl: process.env.EXTIC_BASE_URL || 'https://extic.example.com/api/v1',
    apiKey: process.env.EXTIC_API_KEY
  },
  
  // サービス連携設定
  services: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackUrl: process.env.GITHUB_CALLBACK_URL || 'https://extbridge.example.com/api/services/github/callback',
      scope: ['user:email', 'read:user', 'repo']
    },
    figma: {
      clientId: process.env.FIGMA_CLIENT_ID,
      clientSecret: process.env.FIGMA_CLIENT_SECRET,
      callbackUrl: process.env.FIGMA_CALLBACK_URL || 'https://extbridge.example.com/api/services/figma/callback',
      scope: ['file_read']
    },
    slack: {
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
      callbackUrl: process.env.SLACK_CALLBACK_URL || 'https://extbridge.example.com/api/services/slack/callback',
      scope: ['channels:read', 'chat:write', 'users:read']
    }
  },
  
  // ロギング設定
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    service: process.env.SERVICE_NAME || 'extbridge'
  }
};

module.exports = config;
