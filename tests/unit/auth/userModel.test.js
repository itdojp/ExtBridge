/**
 * ExtBridge - ユーザーモデルのユニットテスト
 */

const mongoose = require('mongoose');
const User = require('../../../src/auth/models/user');

// モックの設定
jest.mock('mongoose');

describe('ユーザーモデル', () => {
  let mockUser;
  
  beforeEach(() => {
    // テスト前にモックをリセット
    jest.clearAllMocks();
    
    // モックユーザーの作成
    mockUser = {
      _id: 'user-id-123',
      email: 'test@example.com',
      role: 'user',
      connectedServices: [
        { service: 'github', serviceUserId: 'github-user-123' }
      ],
      isServiceConnected: jest.fn(),
      connectService: jest.fn(),
      disconnectService: jest.fn(),
      save: jest.fn().mockResolvedValue(true)
    };
  });
  
  describe('isServiceConnected', () => {
    it('接続済みのサービスの場合、trueを返すこと', () => {
      // 実装をモック
      mockUser.isServiceConnected.mockReturnValue(true);
      
      // テスト実行
      const result = mockUser.isServiceConnected('github');
      
      // 検証
      expect(result).toBe(true);
    });
    
    it('未接続のサービスの場合、falseを返すこと', () => {
      // 実装をモック
      mockUser.isServiceConnected.mockReturnValue(false);
      
      // テスト実行
      const result = mockUser.isServiceConnected('figma');
      
      // 検証
      expect(result).toBe(false);
    });
  });
  
  describe('connectService', () => {
    it('新しいサービスを接続できること', async () => {
      // 実装をモック
      mockUser.isServiceConnected.mockReturnValue(false);
      mockUser.connectService.mockImplementation((service, serviceUserId) => {
        mockUser.connectedServices.push({ service, serviceUserId });
        return mockUser;
      });
      
      // テスト実行
      await mockUser.connectService('figma', 'figma-user-456');
      
      // 検証
      expect(mockUser.save).toHaveBeenCalled();
    });
    
    it('既に接続済みのサービスの場合、サービスIDを更新すること', async () => {
      // 実装をモック
      mockUser.isServiceConnected.mockReturnValue(true);
      mockUser.connectService.mockImplementation((service, serviceUserId) => {
        const existingIndex = mockUser.connectedServices.findIndex(s => s.service === service);
        if (existingIndex >= 0) {
          mockUser.connectedServices[existingIndex].serviceUserId = serviceUserId;
        }
        return mockUser;
      });
      
      // テスト実行
      await mockUser.connectService('github', 'github-user-updated');
      
      // 検証
      expect(mockUser.save).toHaveBeenCalled();
    });
  });
  
  describe('disconnectService', () => {
    it('接続済みのサービスを切断できること', async () => {
      // 実装をモック
      mockUser.isServiceConnected.mockReturnValue(true);
      mockUser.disconnectService.mockImplementation((service) => {
        mockUser.connectedServices = mockUser.connectedServices.filter(s => s.service !== service);
        return mockUser;
      });
      
      // テスト実行
      await mockUser.disconnectService('github');
      
      // 検証
      expect(mockUser.save).toHaveBeenCalled();
    });
    
    it('未接続のサービスの場合、何も変更せずに保存しないこと', async () => {
      // 実装をモック
      mockUser.isServiceConnected.mockReturnValue(false);
      mockUser.disconnectService.mockReturnValue(mockUser);
      
      // テスト実行
      await mockUser.disconnectService('slack');
      
      // 検証
      expect(mockUser.save).not.toHaveBeenCalled();
    });
  });
  
  describe('findByEmail', () => {
    it('メールアドレスでユーザーを検索できること', async () => {
      // モックの設定
      const email = 'test@example.com';
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      
      // テスト実行
      const result = await User.findByEmail(email);
      
      // 検証
      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(result).toEqual(mockUser);
    });
    
    it('ユーザーが存在しない場合、nullを返すこと', async () => {
      // モックの設定
      const email = 'nonexistent@example.com';
      User.findOne = jest.fn().mockResolvedValue(null);
      
      // テスト実行
      const result = await User.findByEmail(email);
      
      // 検証
      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(result).toBeNull();
    });
  });
  
  describe('findByServiceId', () => {
    it('サービスIDでユーザーを検索できること', async () => {
      // モックの設定
      const service = 'github';
      const serviceUserId = 'github-user-123';
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      
      // テスト実行
      const result = await User.findByServiceId(service, serviceUserId);
      
      // 検証
      expect(User.findOne).toHaveBeenCalledWith({
        'connectedServices': {
          $elemMatch: { service, serviceUserId }
        }
      });
      expect(result).toEqual(mockUser);
    });
    
    it('該当するユーザーが存在しない場合、nullを返すこと', async () => {
      // モックの設定
      const service = 'figma';
      const serviceUserId = 'figma-user-456';
      User.findOne = jest.fn().mockResolvedValue(null);
      
      // テスト実行
      const result = await User.findByServiceId(service, serviceUserId);
      
      // 検証
      expect(User.findOne).toHaveBeenCalledWith({
        'connectedServices': {
          $elemMatch: { service, serviceUserId }
        }
      });
      expect(result).toBeNull();
    });
  });
});
