/**
 * ExtBridge - 認証とサービス連携の統合テスト
 */

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../src/index');
const User = require('../../src/auth/models/user');
const config = require('../../config/default');

// モックの設定
jest.mock('@services/github/githubClient');
jest.mock('../../src/services/figma/figmaClient');
jest.mock('../../src/services/slack/slackClient');

describe('認証とサービス連携の統合テスト', () => {
  let testUser;
  let authToken;
  
  beforeAll(async () => {
    // テスト用のデータベース接続
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/extbridge_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // テストユーザーの作成
    testUser = new User({
      email: 'integration-test@example.com',
      role: 'user',
      connectedServices: []
    });
    
    await testUser.save();
    
    // 認証トークンの生成
    authToken = jwt.sign(
      { id: testUser._id, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET || config.auth.jwt.secret,
      { expiresIn: '1h' }
    );
  });
  
  afterAll(async () => {
    // テストユーザーの削除
    await User.deleteOne({ _id: testUser._id });
    
    // データベース接続のクローズ
    await mongoose.connection.close();
  });
  
  describe('認証API', () => {
    it('有効なトークンでユーザー情報を取得できること', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('email', testUser.email);
      expect(response.body.data).toHaveProperty('role', testUser.role);
    });
    
    it('無効なトークンでアクセスするとエラーになること', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);
      
      expect(response.body).toHaveProperty('status', 'error');
    });
    
    it('トークンなしでアクセスするとエラーになること', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(401);
      
      expect(response.body).toHaveProperty('status', 'error');
    });
  });
  
  describe('サービス連携API', () => {
    it('GitHub認証URLを取得できること', async () => {
      const response = await request(app)
        .get('/api/services/github/auth-url')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('authUrl');
      expect(response.body.data.authUrl).toContain('github.com/login/oauth/authorize');
    });
    
    it('Figma認証URLを取得できること', async () => {
      const response = await request(app)
        .get('/api/services/figma/auth-url')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('authUrl');
      expect(response.body.data.authUrl).toContain('figma.com/oauth');
    });
    
    it('Slack認証URLを取得できること', async () => {
      const response = await request(app)
        .get('/api/services/slack/auth-url')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('authUrl');
      expect(response.body.data.authUrl).toContain('slack.com/oauth/v2/authorize');
    });
    
    it('認証なしでサービス連携APIにアクセスするとエラーになること', async () => {
      const response = await request(app)
        .get('/api/services/github/auth-url')
        .expect(401);
      
      expect(response.body).toHaveProperty('status', 'error');
    });
  });
  
  describe('サービス接続状態API', () => {
    it('サービス接続状態を取得できること', async () => {
      const response = await request(app)
        .get('/api/services/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('github');
      expect(response.body.data).toHaveProperty('figma');
      expect(response.body.data).toHaveProperty('slack');
    });
    
    it('認証なしでサービス接続状態APIにアクセスするとエラーになること', async () => {
      const response = await request(app)
        .get('/api/services/status')
        .expect(401);
      
      expect(response.body).toHaveProperty('status', 'error');
    });
  });
});
