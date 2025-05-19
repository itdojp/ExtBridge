/**
 * ExtBridge - SAMLコントローラーのユニットテスト
 */

const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../../../src/auth/models/user');
const samlController = require('../../../src/auth/controllers/samlController');
const config = require('../../../config/default');

// モックの設定
jest.mock('passport');
jest.mock('jsonwebtoken');
jest.mock('../../../src/auth/models/user');

describe('SAMLコントローラー', () => {
  let req, res, next;
  
  beforeEach(() => {
    // リクエスト、レスポンス、nextのモックを設定
    req = {
      body: {},
      user: {
        email: 'test@example.com',
        nameID: 'test@example.com',
        name: 'Test User'
      }
    };
    
    res = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // 環境変数の設定
    process.env.JWT_SECRET = 'test-jwt-secret';
    
    // パスポートのモック設定
    passport.authenticate = jest.fn((strategy, options, callback) => {
      return (req, res, next) => {
        if (callback) {
          callback(null, req.user, () => {
            next();
          });
        } else {
          next();
        }
      };
    });
    
    // JWTのモック設定
    jwt.sign = jest.fn().mockReturnValue('mock-jwt-token');
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('initiateSamlLogin', () => {
    it('SAMLログインを開始すること', () => {
      // テスト対象の関数を実行
      samlController.initiateSamlLogin(req, res, next);
      
      // 検証
      expect(passport.authenticate).toHaveBeenCalledWith('saml', {
        failureRedirect: '/auth/login',
        failureFlash: true
      });
    });
  });
  
  describe('handleSamlCallback', () => {
    it('有効なSAMLレスポンスの場合、ユーザーを作成/更新してJWTトークンを発行すること', async () => {
      // ユーザーモデルのモック設定
      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        role: 'user'
      };
      
      User.findOneAndUpdate.mockResolvedValue(mockUser);
      
      // テスト対象の関数を実行
      await samlController.handleSamlCallback(req, res, next);
      
      // 検証
      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        { $setOnInsert: { email: 'test@example.com', role: 'user' } },
        { new: true, upsert: true }
      );
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: '123', email: 'test@example.com', role: 'user' },
        'test-jwt-secret',
        { expiresIn: config.auth.jwt.expiresIn }
      );
      
      expect(res.redirect).toHaveBeenCalledWith('/dashboard?token=mock-jwt-token');
    });
    
    it('ユーザー情報がない場合、エラーを返すこと', async () => {
      // ユーザー情報をnullに設定
      req.user = null;
      
      // テスト対象の関数を実行
      await samlController.handleSamlCallback(req, res, next);
      
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
      await samlController.handleSamlCallback(req, res, next);
      
      // 検証
      expect(User.findOneAndUpdate).toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(dbError);
    });
  });
  
  describe('handleLogout', () => {
    it('ログアウト時にリダイレクトすること', () => {
      // テスト対象の関数を実行
      samlController.handleLogout(req, res);
      
      // 検証
      expect(res.redirect).toHaveBeenCalledWith('/');
    });
  });
});
