/**
 * ExtBridge - Extic SAML認証コントローラーのユニットテスト
 * 
 * このテストはExticサーバーとのSAML認証をモックして行います。
 * 実際のExticサーバーに接続せずにテストを実行できます。
 */

const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../../../src/auth/models/user');
const exticSamlController = require('../../../src/auth/controllers/exticSamlController');
const { setupTestEnvironment, teardownTestEnvironment } = require('../../helpers/testSetup');

// モックの設定
jest.mock('passport');
jest.mock('jsonwebtoken');
jest.mock('../../../src/auth/models/user');

describe('Extic SAML認証コントローラー', () => {
  let req, res, next;
  
  beforeAll(async () => {
    // テスト環境のセットアップ
    await setupTestEnvironment({ mockExtic: true });
  });
  
  afterAll(async () => {
    // テスト環境のクリーンアップ
    await teardownTestEnvironment({ mockExtic: true });
  });
  
  beforeEach(() => {
    // リクエスト、レスポンス、nextのモックを設定
    req = {
      body: {},
      user: {
        email: 'test-user@example.com',
        nameID: 'test-user@example.com',
        firstName: 'Test',
        lastName: 'User'
      }
    };
    
    res = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // パスポートのモック設定
    passport.authenticate = jest.fn((strategy, options, callback) => {
      return (req, res, next) => {
        if (callback) {
          callback(null, req.user);
        }
        return next();
      };
    });
    
    // JWTのモック設定
    jwt.sign = jest.fn().mockReturnValue('mock-jwt-token');
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('initiateExticSamlLogin', () => {
    it('Extic SAML認証を開始すること', () => {
      // テスト対象の関数を実行
      exticSamlController.initiateExticSamlLogin(req, res, next);
      
      // 検証
      expect(passport.authenticate).toHaveBeenCalledWith('saml', {
        failureRedirect: '/auth/login',
        failureFlash: true
      });
    });
  });
  
  describe('handleExticSamlCallback', () => {
    it('有効なSAMLレスポンスの場合、ユーザーを作成/更新してJWTトークンを発行すること', async () => {
      // ユーザーモデルのモック設定
      const mockUser = {
        _id: '123',
        email: 'test-user@example.com',
        role: 'user'
      };
      
      User.findOneAndUpdate.mockResolvedValue(mockUser);
      
      // テスト対象の関数を実行
      await exticSamlController.handleExticSamlCallback(req, res, next);
      
      // 検証
      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { email: 'test-user@example.com' },
        { 
          $setOnInsert: { 
            email: 'test-user@example.com', 
            role: 'user',
            firstName: 'Test',
            lastName: 'User'
          } 
        },
        { new: true, upsert: true }
      );
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: '123', email: 'test-user@example.com', role: 'user' },
        expect.any(String),
        { expiresIn: expect.any(String) }
      );
      
      expect(res.redirect).toHaveBeenCalledWith('/dashboard?token=mock-jwt-token');
    });
    
    it('ユーザー情報がない場合、エラーを返すこと', async () => {
      // ユーザー情報をnullに設定
      req.user = null;
      
      // テスト対象の関数を実行
      await exticSamlController.handleExticSamlCallback(req, res, next);
      
      // 検証
      expect(User.findOneAndUpdate).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '認証に失敗しました'
      });
    });
    
    it('データベースエラーの場合、エラーを返すこと', async () => {
      // データベースエラーをシミュレート
      const dbError = new Error('Database error');
      User.findOneAndUpdate.mockRejectedValue(dbError);
      
      // テスト対象の関数を実行
      await exticSamlController.handleExticSamlCallback(req, res, next);
      
      // 検証
      expect(User.findOneAndUpdate).toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(dbError);
    });
  });
  
  describe('verifyExticSamlAssertion', () => {
    it('有効なSAML Assertionを検証できること', () => {
      // SAMLアサーションのモック
      const mockAssertion = `
        <saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_mock_assertion_id" IssueInstant="${new Date().toISOString()}" Version="2.0">
          <saml:Issuer>extic-saml</saml:Issuer>
          <saml:Subject>
            <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">test-user@example.com</saml:NameID>
          </saml:Subject>
        </saml:Assertion>
      `;
      
      req.body.SAMLResponse = Buffer.from(mockAssertion).toString('base64');
      
      // テスト対象の関数を実行
      const result = exticSamlController.verifyExticSamlAssertion(req);
      
      // 検証
      expect(result).toBe(true);
    });
    
    it('無効なSAML Assertionの場合、falseを返すこと', () => {
      // 無効なSAMLアサーション
      req.body.SAMLResponse = 'invalid-saml-response';
      
      // テスト対象の関数を実行
      const result = exticSamlController.verifyExticSamlAssertion(req);
      
      // 検証
      expect(result).toBe(false);
    });
  });
});
