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
jest.mock('axios');

describe('ExticClient', () => {
  let exticClient;
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
    // テスト前にモックをリセット
    jest.clearAllMocks();
    
    // Exticクライアントのインスタンスを作成
    exticClient = new ExticClient(mockAccessToken);
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
          id: "user-123",
          email: "test-user@example.com",
          firstName: "Test",
          lastName: "User"
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // メソッド実行
      const result = await exticClient.getUserInfo();
      
      // 検証
      expect(axios.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockResponse.data);
    });
    
    it('エラー時に例外をスローすること', async () => {
      // エラーモックの設定
      const mockError = new Error('API error');
      axios.get.mockRejectedValue(mockError);
      
      // メソッド実行と検証
      await expect(exticClient.getUserInfo()).rejects.toThrow('Extic ユーザー情報取得エラー');
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
          total: 1
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // メソッド実行
      const result = await exticClient.getContracts();
      
      // 検証
      expect(axios.get).toHaveBeenCalledWith('/contracts', {
        params: { page: 1, limit: 50 }
      });
      expect(result).toEqual(mockResponse.data);
    });
    
    it('オプションパラメータを正しく処理すること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: { contracts: [], total: 0 }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // カスタムオプション
      const options = {
        page: 2,
        limit: 20,
        status: 'active'
      };
      
      // メソッド実行
      await exticClient.getContracts(options);
      
      // 検証
      expect(axios.get).toHaveBeenCalledWith('/contracts', {
        params: options
      });
    });
    
    it('エラー時に例外をスローすること', async () => {
      // エラーモックの設定
      const mockError = new Error('API error');
      axios.get.mockRejectedValue(mockError);
      
      // メソッド実行と検証
      await expect(exticClient.getContracts()).rejects.toThrow('Extic 契約情報取得エラー');
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
          total: 1
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // メソッド実行
      const result = await exticClient.getServices();
      
      // 検証
      expect(axios.get).toHaveBeenCalledWith('/services', {
        params: { page: 1, limit: 50 }
      });
      expect(result).toEqual(mockResponse.data);
    });
    
    it('カテゴリでフィルタリングできること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: {
          services: [
            {
              id: "service-2",
              name: "Figma",
              category: "Design"
            }
          ],
          total: 1
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // メソッド実行
      const result = await exticClient.getServices({ category: 'Design' });
      
      // 検証
      expect(axios.get).toHaveBeenCalledWith('/services', {
        params: { page: 1, limit: 50, category: 'Design' }
      });
      expect(result).toEqual(mockResponse.data);
    });
    
    it('エラー時に例外をスローすること', async () => {
      // エラーモックの設定
      const mockError = new Error('API error');
      axios.get.mockRejectedValue(mockError);
      
      // メソッド実行と検証
      await expect(exticClient.getServices()).rejects.toThrow('Extic サービス情報取得エラー');
    });
  });
});
