/**
 * ExtBridge デフォルト設定ファイル
 * 環境変数とデフォルト値の設定を管理します
 */

module.exports = {
  // サーバー設定
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  
  // データベース設定
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/extbridge',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // 認証設定
  auth: {
    // SAML設定
    saml: {
      entryPoint: process.env.SAML_ENTRY_POINT,
      issuer: process.env.SAML_ISSUER || 'extbridge',
      callbackUrl: process.env.SAML_CALLBACK_URL || 'http://localhost:3000/auth/saml/callback',
      cert: process.env.SAML_CERT
    },
    // JWT設定
    jwt: {
      secret: process.env.JWT_SECRET || 'extbridge_development_secret',
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    }
  },
  
  // Extic連携設定
  extic: {
    apiUrl: process.env.EXTIC_API_URL,
    apiKey: process.env.EXTIC_API_KEY,
    clientId: process.env.EXTIC_CLIENT_ID
  },
  
  // 外部サービス連携設定
  services: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackUrl: process.env.GITHUB_CALLBACK_URL
    },
    figma: {
      clientId: process.env.FIGMA_CLIENT_ID,
      clientSecret: process.env.FIGMA_CLIENT_SECRET,
      callbackUrl: process.env.FIGMA_CALLBACK_URL
    },
    slack: {
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
      callbackUrl: process.env.SLACK_CALLBACK_URL
    }
  },
  
  // ログ設定
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/extbridge.log'
  }
};
