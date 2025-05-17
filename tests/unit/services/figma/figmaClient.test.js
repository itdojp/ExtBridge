/**
 * ExtBridge - Figmaクライアントのユニットテスト
 */

const axios = require('axios');
const FigmaClient = require('../../../../src/services/figma/figmaClient');

// axiosのモック
jest.mock('axios');

describe('FigmaClient', () => {
  let figmaClient;
  const mockAccessToken = 'mock-figma-access-token';
  
  beforeEach(() => {
    // テスト前にモックをリセット
    jest.clearAllMocks();
    
    // Figmaクライアントのインスタンスを作成
    figmaClient = new FigmaClient(mockAccessToken);
  });
  
  describe('constructor', () => {
    it('アクセストークンを正しく設定すること', () => {
      expect(figmaClient.accessToken).toBe(mockAccessToken);
    });
    
    it('axiosクライアントを正しく設定すること', () => {
      expect(figmaClient.client.defaults.baseURL).toBe('https://api.figma.com/v1');
      expect(figmaClient.client.defaults.headers.Authorization).toBe(`Bearer ${mockAccessToken}`);
      expect(figmaClient.client.defaults.headers['X-Figma-Token']).toBe(mockAccessToken);
    });
  });
  
  describe('getUserInfo', () => {
    it('ユーザー情報を取得できること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: {
          id: 'figma-user-id',
          email: 'figma-user@example.com',
          handle: 'figma-user',
          img_url: 'https://example.com/avatar.png'
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // メソッド実行
      const result = await figmaClient.getUserInfo();
      
      // 検証
      expect(axios.get).toHaveBeenCalledWith('/me');
      expect(result).toEqual(mockResponse.data);
    });
    
    it('エラー時に例外をスローすること', async () => {
      // エラーモックの設定
      const mockError = new Error('API error');
      axios.get.mockRejectedValue(mockError);
      
      // メソッド実行と検証
      await expect(figmaClient.getUserInfo()).rejects.toThrow('Figma ユーザー情報取得エラー');
    });
  });
  
  describe('getProjects', () => {
    const teamId = 'team-id';
    
    it('プロジェクト一覧を取得できること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: {
          projects: [
            { id: 'project1', name: 'Project 1' },
            { id: 'project2', name: 'Project 2' }
          ]
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // メソッド実行
      const result = await figmaClient.getProjects(teamId);
      
      // 検証
      expect(axios.get).toHaveBeenCalledWith(`/teams/${teamId}/projects`);
      expect(result).toEqual(mockResponse.data.projects);
    });
    
    it('エラー時に例外をスローすること', async () => {
      // エラーモックの設定
      const mockError = new Error('API error');
      axios.get.mockRejectedValue(mockError);
      
      // メソッド実行と検証
      await expect(figmaClient.getProjects(teamId)).rejects.toThrow('Figma プロジェクト一覧取得エラー');
    });
  });
  
  describe('getFiles', () => {
    const projectId = 'project-id';
    
    it('ファイル一覧を取得できること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: {
          files: [
            { key: 'file1', name: 'File 1', thumbnail_url: 'https://example.com/thumb1.png' },
            { key: 'file2', name: 'File 2', thumbnail_url: 'https://example.com/thumb2.png' }
          ]
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // メソッド実行
      const result = await figmaClient.getFiles(projectId);
      
      // 検証
      expect(axios.get).toHaveBeenCalledWith(`/projects/${projectId}/files`);
      expect(result).toEqual(mockResponse.data.files);
    });
    
    it('エラー時に例外をスローすること', async () => {
      // エラーモックの設定
      const mockError = new Error('API error');
      axios.get.mockRejectedValue(mockError);
      
      // メソッド実行と検証
      await expect(figmaClient.getFiles(projectId)).rejects.toThrow('Figma ファイル一覧取得エラー');
    });
  });
  
  describe('getFileDetails', () => {
    const fileKey = 'file-key';
    
    it('ファイル詳細を取得できること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: {
          name: 'Test File',
          lastModified: '2023-05-17T12:00:00Z',
          thumbnailUrl: 'https://example.com/thumb.png',
          document: {
            id: 'document-id',
            name: 'Document',
            type: 'DOCUMENT'
          }
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // メソッド実行
      const result = await figmaClient.getFileDetails(fileKey);
      
      // 検証
      expect(axios.get).toHaveBeenCalledWith(`/files/${fileKey}`);
      expect(result).toEqual(mockResponse.data);
    });
    
    it('エラー時に例外をスローすること', async () => {
      // エラーモックの設定
      const mockError = new Error('API error');
      axios.get.mockRejectedValue(mockError);
      
      // メソッド実行と検証
      await expect(figmaClient.getFileDetails(fileKey)).rejects.toThrow('Figma ファイル詳細取得エラー');
    });
  });
});
