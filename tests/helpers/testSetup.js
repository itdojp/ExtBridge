/**
 * ExtBridge - テスト設定ヘルパー
 * 
 * このモジュールはテスト環境のセットアップとティアダウンを行います。
 * テスト用データベースの準備などを行います。
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// グローバルでmongoServerを保持
let mongoServer;

// テスト環境変数の設定
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.EXTIC_BASE_URL = 'http://test-extic-api.example.com';
process.env.EXTIC_API_URL = 'http://test-extic-api.example.com';

// SAML関連のダミー環境変数（テスト用）
process.env.SAML_ENTRY_POINT = 'https://dummy-saml-entry-point.example.com';
process.env.SAML_ISSUER = 'dummy-issuer';
process.env.SAML_CALLBACK_URL = 'http://localhost:3000/auth/saml/callback';
process.env.SAML_CERT = 'dummy-cert';

// GitHub用のダミー環境変数（テスト用）
process.env.GITHUB_CLIENT_ID = 'dummy-client-id';
process.env.GITHUB_CLIENT_SECRET = 'dummy-client-secret';
process.env.GITHUB_CALLBACK_URL = 'http://localhost:3000/auth/github/callback';

// Figma用のダミー環境変数（テスト用）
process.env.FIGMA_CLIENT_ID = 'dummy-figma-client-id';
process.env.FIGMA_CLIENT_SECRET = 'dummy-figma-client-secret';
process.env.FIGMA_CALLBACK_URL = 'http://localhost:3000/auth/figma/callback';

// Slack用のダミー環境変数（テスト用）
process.env.SLACK_CLIENT_ID = 'dummy-slack-client-id';
process.env.SLACK_CLIENT_SECRET = 'dummy-slack-client-secret';
process.env.SLACK_CALLBACK_URL = 'http://localhost:3000/auth/slack/callback';

// テスト環境のセットアップ
const setupTestEnvironment = async (options = { useMongoMemory: true }) => {
  if (options.useMongoMemory) {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
};

// テスト環境のクリーンアップ
const teardownTestEnvironment = async (options = { useMongoMemory: true }) => {
  if (options.useMongoMemory) {
    console.log('[teardownTestEnvironment] MongoDB disconnecting...');
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
      console.log('[teardownTestEnvironment] MongoMemoryServer stopped.');
    }
    console.log('[teardownTestEnvironment] MongoDB disconnected.');
    console.log('[teardownTestEnvironment] mongoose.readyState:', mongoose.connection.readyState);
    if (process._getActiveHandles) {
      console.log('[teardownTestEnvironment] Active handles:', process._getActiveHandles().length);
      console.log('[teardownTestEnvironment] Handles:', process._getActiveHandles());
    }
  }
};

module.exports = {
  setupTestEnvironment,
  teardownTestEnvironment
};
