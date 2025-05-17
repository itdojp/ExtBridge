/**
 * ExtBridge - テスト設定ヘルパー
 * 
 * このモジュールはテスト環境のセットアップとティアダウンを行います。
 * モックの設定やテスト用データベースの準備などを行います。
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { setupExticMock, cleanupExticMock } = require('../mocks/exticMock');

let mongoServer;

/**
 * テスト環境をセットアップする
 * @param {Object} options - セットアップオプション
 * @param {boolean} options.useMongoMemory - インメモリMongoDBを使用するかどうか
 * @param {boolean} options.mockExtic - Exticサーバーをモックするかどうか
 * @returns {Promise<void>}
 */
async function setupTestEnvironment(options = { useMongoMemory: true, mockExtic: true }) {
  // 環境変数の設定
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  
  // インメモリMongoDBのセットアップ
  if (options.useMongoMemory) {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`テスト用MongoDBに接続しました: ${mongoUri}`);
  }
  
  // Exticサーバーのモックセットアップ
  if (options.mockExtic) {
    setupExticMock();
    
    // SAML設定の環境変数
    process.env.SAML_ENTRY_POINT = 'https://extic.example.com/saml2/idp/SSOService.php';
    process.env.SAML_ISSUER = 'extic-saml';
    process.env.SAML_CALLBACK_URL = 'https://extbridge-test.example.com/auth/saml/callback';
  }
  
  // サービス接続用の環境変数
  process.env.GITHUB_CLIENT_ID = 'github-test-client-id';
  process.env.GITHUB_CLIENT_SECRET = 'github-test-client-secret';
  process.env.GITHUB_CALLBACK_URL = 'https://extbridge-test.example.com/api/services/github/callback';
  
  process.env.FIGMA_CLIENT_ID = 'figma-test-client-id';
  process.env.FIGMA_CLIENT_SECRET = 'figma-test-client-secret';
  process.env.FIGMA_CALLBACK_URL = 'https://extbridge-test.example.com/api/services/figma/callback';
  
  process.env.SLACK_CLIENT_ID = 'slack-test-client-id';
  process.env.SLACK_CLIENT_SECRET = 'slack-test-client-secret';
  process.env.SLACK_CALLBACK_URL = 'https://extbridge-test.example.com/api/services/slack/callback';
}

/**
 * テスト環境をクリーンアップする
 * @param {Object} options - クリーンアップオプション
 * @param {boolean} options.useMongoMemory - インメモリMongoDBを使用したかどうか
 * @param {boolean} options.mockExtic - Exticサーバーをモックしたかどうか
 * @returns {Promise<void>}
 */
async function teardownTestEnvironment(options = { useMongoMemory: true, mockExtic: true }) {
  // Mongooseの接続を閉じる
  if (options.useMongoMemory && mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    console.log('テスト用MongoDBの接続を閉じました');
  }
  
  // Exticサーバーのモッククリーンアップ
  if (options.mockExtic) {
    cleanupExticMock();
  }
  
  // 環境変数のクリーンアップ
  delete process.env.JWT_SECRET;
  delete process.env.MONGODB_URI;
  delete process.env.SAML_ENTRY_POINT;
  delete process.env.SAML_ISSUER;
  delete process.env.SAML_CALLBACK_URL;
  delete process.env.GITHUB_CLIENT_ID;
  delete process.env.GITHUB_CLIENT_SECRET;
  delete process.env.GITHUB_CALLBACK_URL;
  delete process.env.FIGMA_CLIENT_ID;
  delete process.env.FIGMA_CLIENT_SECRET;
  delete process.env.FIGMA_CALLBACK_URL;
  delete process.env.SLACK_CLIENT_ID;
  delete process.env.SLACK_CLIENT_SECRET;
  delete process.env.SLACK_CALLBACK_URL;
}

module.exports = {
  setupTestEnvironment,
  teardownTestEnvironment
};
