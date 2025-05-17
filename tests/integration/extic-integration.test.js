/**
 * ExtBridge - Extic連携の統合テスト
 * 
 * このテストはExticサーバーとの連携をモックして行う統合テストです。
 * 実際のExticサーバーに接続せずにテストを実行できます。
 */

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { setupTestEnvironment, teardownTestEnvironment } = require('../helpers/testSetup');
const app = require('../../src/index');
const User = require('../../src/auth/models/user');

describe('Extic連携の統合テスト', () => {
  let testUser;
  let authToken;
  
  beforeAll(async () => {
    // テスト環境のセットアップ
    await setupTestEnvironment({ useMongoMemory: true, mockExtic: true });
    
    // テストユーザーの作成
    testUser = new User({
      email: 'integration-test@example.com',
      role: 'user',
      firstName: 'Integration',
      lastName: 'Test',
      connectedServices: []
    });
    
    await testUser.save();
    
    // 認証トークンの生成
    authToken = jwt.sign(
      { id: testUser._id, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });
  
  afterAll(async () => {
    // テストユーザーの削除
    await User.deleteOne({ _id: testUser._id });
    
    // テスト環境のクリーンアップ
    await teardownTestEnvironment({ useMongoMemory: true, mockExtic: true });
  });
  
  describe('認証API', () => {
    it('SAML認証URLを取得できること', async () => {
      const response = await request(app)
        .get('/auth/saml/login')
        .expect(302); // リダイレクト
      
      expect(response.header.location).toContain('extic.example.com/saml2/idp/SSOService.php');
    });
    
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
  });
  
  describe('Extic契約API', () => {
    it('認証済みユーザーが契約情報を取得できること', async () => {
      const response = await request(app)
        .get('/api/extic/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('contracts');
      expect(Array.isArray(response.body.data.contracts)).toBe(true);
    });
    
    it('認証なしで契約情報にアクセスするとエラーになること', async () => {
      const response = await request(app)
        .get('/api/extic/contracts')
        .expect(401);
      
      expect(response.body).toHaveProperty('status', 'error');
    });
    
    it('契約情報をフィルタリングして取得できること', async () => {
      const response = await request(app)
        .get('/api/extic/contracts?status=active&provider=GitHub')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('contracts');
    });
  });
  
  describe('Exticサービス情報API', () => {
    it('認証済みユーザーがサービス情報を取得できること', async () => {
      const response = await request(app)
        .get('/api/extic/services')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('services');
      expect(Array.isArray(response.body.data.services)).toBe(true);
    });
    
    it('認証なしでサービス情報にアクセスするとエラーになること', async () => {
      const response = await request(app)
        .get('/api/extic/services')
        .expect(401);
      
      expect(response.body).toHaveProperty('status', 'error');
    });
    
    it('サービス情報をカテゴリでフィルタリングして取得できること', async () => {
      const response = await request(app)
        .get('/api/extic/services?category=Development')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('services');
    });
  });
  
  describe('サービス連携状態API', () => {
    it('サービス連携状態を取得できること', async () => {
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
  });
});
