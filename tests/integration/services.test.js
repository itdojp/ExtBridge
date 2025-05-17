/**
 * ExtBridge - サービス連携の統合テスト
 */

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../src/index');
const User = require('../../src/auth/models/user');

// モックデータ
const mockUser = {
  _id: new mongoose.Types.ObjectId(),
  email: 'test@example.com',
  role: 'user',
  connectedServices: []
};

// テスト用トークンの生成
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('サービス連携API', () => {
  let token;
  
  beforeAll(async () => {
    // テスト用データベースに接続
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });
    
    // テストユーザーを作成
    await User.deleteMany({});
    await new User(mockUser).save();
    
    // テスト用トークンを生成
    token = generateToken(mockUser);
  });
  
  afterAll(async () => {
    // テスト後にデータベース接続を閉じる
    await mongoose.connection.close();
  });
  
  describe('GitHub連携', () => {
    it('認証されていない場合、401エラーを返すこと', async () => {
      const response = await request(app)
        .get('/api/services/github/repositories');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('status', 'error');
    });
    
    it('認証されている場合、GitHub連携ルートにアクセスできること', async () => {
      // GitHubサービスがモックされていることを前提としています
      const response = await request(app)
        .get('/api/services/github/repositories')
        .set('Authorization', `Bearer ${token}`);
      
      // 連携されていない場合は403が返ることを期待
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'GitHubと連携されていません');
    });
  });
  
  describe('Figma連携', () => {
    it('認証されていない場合、401エラーを返すこと', async () => {
      const response = await request(app)
        .get('/api/services/figma/projects');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('status', 'error');
    });
    
    it('認証されている場合、Figma連携ルートにアクセスできること', async () => {
      // Figmaサービスがモックされていることを前提としています
      const response = await request(app)
        .get('/api/services/figma/projects')
        .set('Authorization', `Bearer ${token}`);
      
      // 連携されていない場合は403が返ることを期待
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Figmaと連携されていません');
    });
  });
  
  describe('Slack連携', () => {
    it('認証されていない場合、401エラーを返すこと', async () => {
      const response = await request(app)
        .get('/api/services/slack/channels');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('status', 'error');
    });
    
    it('認証されている場合、Slack連携ルートにアクセスできること', async () => {
      // Slackサービスがモックされていることを前提としています
      const response = await request(app)
        .get('/api/services/slack/channels')
        .set('Authorization', `Bearer ${token}`);
      
      // 連携されていない場合は403が返ることを期待
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Slackと連携されていません');
    });
  });
});
