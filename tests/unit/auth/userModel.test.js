/**
 * ExtBridge - ユーザーモデルのユニットテスト
 */

// モジュールのモック設定
jest.mock('mongoose');
jest.mock('../../../src/services/slackService');
jest.mock('../../../src/services/figmaService');

const mongoose = require('mongoose');
const User = require('../../../src/auth/models/user');

// テスト用のモックユーザーデータ
const createMockUser = (overrides = {}) => ({
  _id: 'user-id-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  connectedServices: [
    { service: 'github', serviceUserId: 'github-user-123', accessToken: 'github-token-123' }
  ],
  isConnectedTo: function(serviceName) {
    return this.connectedServices.some(svc => svc.service === serviceName);
  },
  getServiceConnection: function(serviceName) {
    return this.connectedServices.find(svc => svc.service === serviceName) || null;
  },
  save: jest.fn().mockImplementation(function() {
    return Promise.resolve(this);
  }),
  ...overrides
});

describe('ユーザーモデル', () => {
  let mockUser;

  // 各テストの前に実行
  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();

    // モックユーザーの作成
    mockUser = createMockUser();

    // モックモデルのメソッドを設定
    User.findById = jest.fn().mockResolvedValue(mockUser);
    User.findOne = jest.fn().mockResolvedValue(mockUser);
    User.create = jest.fn().mockImplementation((data) => {
      return Promise.resolve(createMockUser(data));
    });
    User.findByServiceId = jest.fn().mockResolvedValue(mockUser);
  });

  describe('isConnectedTo', () => {
    it('接続済みのサービスの場合、trueを返すこと', async () => {
      // テスト実行
      const user = await User.findOne({});
      const result = user.isConnectedTo('github');

      // 検証
      expect(result).toBe(true);
    });

    it('未接続のサービスの場合、falseを返すこと', async () => {
      // テスト実行
      const user = await User.findOne({});
      const result = user.isConnectedTo('figma');

      // 検証
      expect(result).toBe(false);
    });
  });

  describe('getServiceConnection', () => {
    it('接続済みのサービスの接続情報を取得できること', async () => {
      // テスト実行
      const user = await User.findOne({});
      const result = user.getServiceConnection('github');

      // 検証
      expect(result).toEqual({
        service: 'github',
        serviceUserId: 'github-user-123',
        accessToken: 'github-token-123'
      });
    });

    it('未接続のサービスの場合、nullを返すこと', async () => {
      // テスト実行
      const user = await User.findOne({});
      const result = user.getServiceConnection('figma');

      // 検証
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('メールアドレスでユーザーを検索できること', async () => {
      // モックの設定
      const email = 'test@example.com';

      // テスト実行
      const result = await User.findOne({ email });

      // 検証
      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(result).toEqual(mockUser);
    });

    it('ユーザーが存在しない場合、nullを返すこと', async () => {
      // モックの設定
      const email = 'nonexistent@example.com';
      User.findOne.mockResolvedValueOnce(null);

      // テスト実行
      const result = await User.findOne({ email });
      
      // 検証
      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(result).toBeNull();
    });
  });

  describe('findByServiceId', () => {
    it('サービスIDでユーザーを検索できること', async () => {
      // テストデータ
      const service = 'github';
      const serviceUserId = 'github-user-123';

      // テスト実行
      const result = await User.findByServiceId(service, serviceUserId);

      // 検証
      expect(User.findByServiceId).toHaveBeenCalledWith(service, serviceUserId);
      expect(result).toEqual(mockUser);
    });
  });
});
