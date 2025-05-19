/**
 * ExtBridge - Exticクライアントのユニットテスト
 * 
 * このテストはExticサーバーとの通信をモックして行います。
 * 実際のExticサーバーに接続せずにテストを実行できます。
 */

const axios = require('axios');
const { setupTestEnvironment, teardownTestEnvironment } = require('../../helpers/testSetup');
const ExticClient = require('../../../src/services/extic/exticClient');

// axiosのモック
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    defaults: {
      baseURL: '',
      headers: {}
    }
  };
  
  return {
    create: jest.fn().mockReturnValue(mockAxiosInstance)
  };
});

// モック用のaxiosインスタンスを作成する関数
const createMockAxiosInstance = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  defaults: {
    baseURL: '',
    headers: {}
  }
});

describe('ExticClient', () => {
  let exticClient;
  let mockAxiosInstance;
  const mockAccessToken = 'mock-extic-access-token';
  
  beforeAll(async () => {
    // テスト環境のセットアップ
    await setupTestEnvironment({ mockExtic: true });
  });
  
  afterAll(async () => {
    // テスト環境のクリーンアップ
    await teardownTestEnvironment({ mockExtic: true });
  });
  
  beforeEach(() => {
    // モックを完全にリセット
    jest.clearAllMocks();
    
    // 新しいモックインスタンスを作成
    mockAxiosInstance = createMockAxiosInstance();
    
    // axios.createがモックインスタンスを返すように設定
    jest.spyOn(require('axios'), 'create').mockReturnValue(mockAxiosInstance);
    
    // Exticクライアントのインスタンスを作成
    exticClient = new ExticClient(mockAccessToken);
  });
  
  afterEach(() => {
    // 各テスト後にモックの状態を確認
    jest.restoreAllMocks();
  });
  
  describe('constructor', () => {
    it('アクセストークンを正しく設定すること', () => {
      expect(exticClient.accessToken).toBe(mockAccessToken);
    });
    
    it('axiosクライアントを正しく設定すること', () => {
      expect(exticClient.client.defaults.baseURL).toBe('https://extic.example.com/api/v1');
      expect(exticClient.client.defaults.headers.Authorization).toBe(`Bearer ${mockAccessToken}`);
      expect(exticClient.client.defaults.headers['Content-Type']).toBe('application/json');
    });
  });
  
  describe('getUserInfo', () => {
    it('ユーザー情報を取得できること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User'
        }
      };
      
      // モックの設定
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      
      // メソッドを実行
      const result = await exticClient.getUserInfo();
      
      // 検証
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/user');
      expect(result).toEqual(mockResponse.data);
    });
    
    it('APIエラーが発生した場合に適切に処理すること', async () => {
      // モックエラーの設定
      const error = new Error('API Error');
      error.response = {
        status: 500,
        data: { message: 'Internal Server Error' }
      };
      
      // モックの設定
      mockAxiosInstance.get.mockRejectedValue(error);
      
      // エラーがスローされることを検証
      await expect(exticClient.getUserInfo())
        .rejects
        .toThrow('Extic ユーザー情報取得エラー');
    });
  });
  
  describe('getContracts', () => {
    it('契約情報を取得できること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: {
          contracts: [
            {
              id: "contract-1",
              name: "GitHub Enterprise",
              provider: "GitHub"
            }
          ],
          total: 1,
          page: 1,
          limit: 50
        }
      };
      
      // モックの設定
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      
      // メソッドを実行
      const result = await exticClient.getContracts();
      
      // 検証
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/contracts', {
        params: { page: 1, limit: 50 }
      });
      // レスポンス全体を返すことを確認
      expect(result).toEqual(mockResponse.data);
    });
    
    it('オプションパラメータを正しく処理すること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: { 
          contracts: [], 
          total: 0,
          page: 2,
          limit: 20
        }
      };
      
      // モックの設定
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      
      // カスタムオプション
      const options = {
        page: 2,
        limit: 20,
        status: 'active'
      };
      
      // メソッドを実行
      await exticClient.getContracts(options);
      
      // 検証
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/contracts', {
        params: options
      });
    });
    
    it('エラー時に適切に処理すること', async () => {
      // モックエラーの設定
      const error = new Error('API Error');
      error.response = {
        status: 500,
        data: { message: 'Internal Server Error' }
      };
      
      // モックの設定
      mockAxiosInstance.get.mockRejectedValue(error);
      
      // エラーがスローされることを検証
      await expect(exticClient.getContracts())
        .rejects
        .toThrow('Extic 契約情報取得エラー');
    });
    
    it('フィルタパラメータを正しく処理すること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: { 
          contracts: [], 
          total: 0,
          page: 1,
          limit: 50
        }
      };
      
      // モックの設定
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      
      // フィルターパラメータ
      const filters = {
        provider: 'GitHub',
        status: 'active',
        search: 'enterprise'
      };
      
      // メソッドを実行
      await exticClient.getContracts(filters);
      
      // 検証
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/contracts', {
        params: filters
      });
    });
  });
  
  describe('getService', () => {
    it('サービス情報を取得できること', async () => {
      // モックレスポンスの設定
      const serviceId = 'service-1';
      const mockResponse = {
        data: {
          id: serviceId,
          name: 'GitHub',
          isConnected: true
        }
      };
      
      // モックの設定
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      
      // メソッドを実行
      const result = await exticClient.getService(serviceId);
      
      // 検証
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/services/${serviceId}`);
      expect(result).toEqual(mockResponse.data);
    });
    
    it('サービスが存在しない場合に適切に処理すること', async () => {
      // モックエラーの設定
      const serviceId = 'non-existent-service';
      const error = new Error('Not Found');
      error.response = { status: 404 };
      
      // モックの設定
      mockAxiosInstance.get.mockRejectedValue(error);
      
      // エラーがスローされることを検証
      await expect(exticClient.getService(serviceId))
        .rejects
        .toThrow('Extic サービス情報取得エラー');
    });
  });
  
  describe('getServices', () => {
    it('サービス情報を取得できること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: {
          services: [
            {
              id: "service-1",
              name: "GitHub",
              category: "Development"
            }
          ],
          total: 1,
          page: 1,
          limit: 50
        }
      };
      
      // モックの設定
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      
      // メソッドを実行
      const result = await exticClient.getServices();
      
      // 検証
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/services', {
        params: { page: 1, limit: 50 }
      });
      // レスポンス全体を返すことを確認
      expect(result).toEqual(mockResponse.data);
    });
    
    it('APIエラーが発生した場合に適切に処理すること', async () => {
      // モックエラーの設定
      const error = new Error('API Error');
      error.response = {
        status: 500,
        data: { message: 'Internal Server Error' }
      };
      
      // モックの設定
      mockAxiosInstance.get.mockRejectedValue(error);
      
      // エラーがスローされることを検証
      await expect(exticClient.getServices())
        .rejects
        .toThrow('Extic サービス一覧取得エラー');
    });
    
    it('ページネーションパラメータを正しく処理すること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: {
          services: [],
          total: 0,
          page: 2,
          limit: 10
        }
      };
      
      // モックの設定
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      
      // ページネーションパラメータを指定してメソッドを実行
      const params = {
        page: 2,
        limit: 10
      };
      
      await exticClient.getServices(params);
      
      // 検証
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/services', {
        params: params
      });
    });
  });
  
  describe('getServiceIntegration', () => {
    it('サービス連携情報を取得できること', async () => {
      // モックレスポンスの設定
      const serviceId = 'service-1';
      const mockResponse = {
        data: {
          id: serviceId,
          name: 'GitHub',
          isConnected: true,
          settings: {
            webhookUrl: 'https://example.com/webhook',
            events: ['push', 'pull_request']
          }
        }
      };
      
      // モックの設定
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      
      // メソッドを実行
      const result = await exticClient.getServiceIntegration(serviceId);
      
      // 検証
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/services/${serviceId}/integration`);
      expect(result).toEqual(mockResponse.data);
    });
    
    it('サービスが存在しない場合に適切に処理すること', async () => {
      // モックエラーの設定
      const serviceId = 'non-existent-service';
      const error = new Error('Not Found');
      error.response = { status: 404 };
      
      // モックの設定
      mockAxiosInstance.get.mockRejectedValue(error);
      
      // エラーがスローされることを検証
      await expect(exticClient.getServiceIntegration(serviceId))
        .rejects
        .toThrow('Extic サービス連携情報取得エラー');
    });
  });
});

