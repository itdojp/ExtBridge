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
  let mockAxiosInstance;
  const mockAccessToken = 'test-access-token';
  const mockUserData = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User'
  };

  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // モックの設定
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      defaults: {
        baseURL: '',
        headers: {}
      }
    };
    
    axios.create.mockReturnValue(mockAxiosInstance);
    exticClient = new ExticClient(mockAccessToken);
  });

  describe('getUserInfo', () => {
    it('ユーザー情報を取得できること', async () => {
      // モックの設定
      mockAxiosInstance.get.mockResolvedValue({ data: mockUserData });

      // テスト実行
      const result = await exticClient.getUserInfo();

      // 検証
      expect(result).toEqual(mockUserData);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/me');
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: expect.any(String),
        headers: {
          'Authorization': `Bearer ${mockAccessToken}`,
          'Content-Type': 'application/json'
        }
      });
    });

    it('エラーが発生した場合に適切に処理すること', async () => {
      // モックの設定
      const error = new Error('Network Error');
      mockAxiosInstance.get.mockRejectedValue(error);

      // テスト実行と検証
      await expect(exticClient.getUserInfo())
        .rejects
        .toThrow('Extic ユーザー情報取得エラー');
    });
  });
});
