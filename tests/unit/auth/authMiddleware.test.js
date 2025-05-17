/**
 * ExtBridge - 認証ミドルウェアのユニットテスト
 */

const jwt = require('jsonwebtoken');
const { verifyToken, checkRole } = require('../../../src/auth/middleware/authMiddleware');

// jwtのモック
jest.mock('jsonwebtoken');

describe('認証ミドルウェア', () => {
  let req, res, next;
  
  beforeEach(() => {
    // リクエスト、レスポンス、nextのモックを設定
    req = {
      headers: {
        authorization: 'Bearer test-token'
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // 環境変数の設定
    process.env.JWT_SECRET = 'test-jwt-secret';
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('verifyToken', () => {
    it('有効なトークンの場合、ユーザー情報をリクエストに追加して次のミドルウェアを呼び出すこと', () => {
      const mockUser = { id: '123', email: 'test@example.com', role: 'user' };
      
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, mockUser);
      });
      
      verifyToken(req, res, next);
      
      expect(jwt.verify).toHaveBeenCalledWith('test-token', 'test-jwt-secret', expect.any(Function));
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('トークンがない場合、401エラーを返すこと', () => {
      req.headers.authorization = undefined;
      
      verifyToken(req, res, next);
      
      expect(jwt.verify).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '認証トークンが必要です'
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('トークンが無効な場合、403エラーを返すこと', () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('無効なトークン'), null);
      });
      
      verifyToken(req, res, next);
      
      expect(jwt.verify).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '無効な認証トークンです'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  describe('checkRole', () => {
    beforeEach(() => {
      // ユーザー情報をリクエストに追加
      req.user = { id: '123', email: 'test@example.com', role: 'user' };
    });
    
    it('ユーザーが必要なロールを持っている場合、次のミドルウェアを呼び出すこと', () => {
      const middleware = checkRole('user');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('ユーザーが必要なロールを持っていない場合、403エラーを返すこと', () => {
      const middleware = checkRole('admin');
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'アクセス権限がありません'
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('管理者は全てのロールにアクセスできること', () => {
      req.user.role = 'admin';
      const middleware = checkRole('user');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('ユーザー情報がない場合、401エラーを返すこと', () => {
      req.user = undefined;
      const middleware = checkRole('user');
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '認証が必要です'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
