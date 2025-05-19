/**
 * ExtBridge - Extic Client Simple Test
 */

// 必要なモジュールをインポート
const axios = require('axios');
const ExticClient = require('../../../src/services/extic/exticClient');

// モジュールのモック化
jest.mock('axios');
jest.mock('config');
jest.mock('../../src/monitoring/app-monitoring');

// モック用のaxiosインスタンス
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
};

// モックの設定
const mockConfig = require('config');
const mockLogger = require('../../src/monitoring/app-monitoring').logger;

// axios.createがモックインスタンスを返すように設定
axios.create.mockImplementation(() => {
  console.log('Creating mock axios instance');
  return mockAxiosInstance;
});

// テスト用の設定
mockConfig.extic = {
  baseUrl: 'https://extic.test.com/api/v1'
};

describe('ExticClient - Simple Test', () => {
  let exticClient;
  const mockAccessToken = 'test-access-token';
  
  // テストの前処理
  beforeAll(() => {
    console.log('Setting up test environment');
  });
  
  // 各テストケースの前処理
  beforeEach(() => {
    console.log('Starting a new test case');
    
    // モックをリセット
    jest.clearAllMocks();
    
    // 新しいインスタンスを作成
    try {
      exticClient = new ExticClient(mockAccessToken);
      console.log('Created new ExticClient instance');
    } catch (error) {
      console.error('Failed to create ExticClient instance:', error);
      throw error;
    }
  });
  
  // インスタンス作成テスト
  it('should create an instance with the correct access token', () => {
    console.log('Running instance creation test');
    
    // インスタンスが正しく作成されたことを確認
    expect(exticClient).toBeDefined();
    expect(exticClient).toHaveProperty('accessToken', mockAccessToken);
    
    // axios.createが正しい引数で呼ばれたことを確認
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: mockConfig.extic.baseUrl,
      headers: {
        'Authorization': `Bearer ${mockAccessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Instance creation test completed');
  });
  
  // getUserInfoメソッドのテスト
  describe('getUserInfo', () => {
    it('should return user data when the API call is successful', async () => {
      console.log('Running getUserInfo test');
      
      // モックのレスポンスを設定
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com'
      };
      
      // axios.getのモックを設定
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUser });
      
      // テスト対象メソッドを実行
      let result;
      try {
        result = await exticClient.getUserInfo();
        console.log('getUserInfo call successful');
      } catch (error) {
        console.error('getUserInfo call failed:', error);
        throw error;
      }
      
      // 検証
      expect(result).toEqual(mockUser);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/me');
      
      console.log('getUserInfo test completed');
    });
    
    it('should throw an error when the API call fails', async () => {
      console.log('Running error handling test');
      
      // エラーレスポンスを設定
      const errorMessage = 'API Error';
      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' }
        },
        message: errorMessage
      };
      
      // axios.getのモックをエラーで設定
      mockAxiosInstance.get.mockRejectedValueOnce(errorResponse);
      
      // エラーがスローされることを検証
      await expect(exticClient.getUserInfo())
        .rejects
        .toThrow('Extic ユーザー情報取得エラー');
      
      // エラーログが記録されたことを確認
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Extic ユーザー情報取得エラー: ' + errorMessage,
        { error: errorResponse }
      );
      
      console.log('Error handling test completed');
    });
  });
  
  // テストの後処理
  afterEach(() => {
    console.log('Test case completed');
  });
  
  afterAll(() => {
    console.log('Tearing down test environment');
  });
});
