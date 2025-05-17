/**
 * ExtBridge - GitHubクライアントのユニットテスト
 */

const axios = require('axios');
const GitHubClient = require('../../../../src/services/github/githubClient');

// axiosのモック
jest.mock('axios');

describe('GitHubClient', () => {
  let githubClient;
  const mockAccessToken = 'mock-access-token';
  
  beforeEach(() => {
    // テスト前にモックをリセット
    jest.clearAllMocks();
    
    // GitHubクライアントのインスタンスを作成
    githubClient = new GitHubClient(mockAccessToken);
  });
  
  describe('constructor', () => {
    it('アクセストークンを正しく設定すること', () => {
      expect(githubClient.accessToken).toBe(mockAccessToken);
    });
    
    it('axiosクライアントを正しく設定すること', () => {
      expect(githubClient.client.defaults.headers.Authorization).toBe(`token ${mockAccessToken}`);
      expect(githubClient.client.defaults.headers.Accept).toBe('application/vnd.github.v3+json');
      expect(githubClient.client.defaults.headers['User-Agent']).toBe('ExtBridge-App');
    });
  });
  
  describe('getUserInfo', () => {
    it('ユーザー情報を取得できること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: {
          login: 'testuser',
          id: 12345,
          name: 'Test User',
          email: 'test@example.com'
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // メソッド実行
      const result = await githubClient.getUserInfo();
      
      // 検証
      expect(axios.get).toHaveBeenCalledWith('/user');
      expect(result).toEqual(mockResponse.data);
    });
    
    it('エラー時に例外をスローすること', async () => {
      // エラーモックの設定
      const mockError = new Error('API error');
      axios.get.mockRejectedValue(mockError);
      
      // メソッド実行と検証
      await expect(githubClient.getUserInfo()).rejects.toThrow('GitHub ユーザー情報取得エラー');
    });
  });
  
  describe('getRepositories', () => {
    const username = 'testuser';
    
    it('リポジトリ一覧を取得できること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: [
          { id: 1, name: 'repo1', description: 'Test repo 1' },
          { id: 2, name: 'repo2', description: 'Test repo 2' }
        ]
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // メソッド実行
      const result = await githubClient.getRepositories(username);
      
      // 検証
      expect(axios.get).toHaveBeenCalledWith(`/users/${username}/repos`, {
        params: { sort: 'updated', per_page: 30, page: 1 }
      });
      expect(result).toEqual(mockResponse.data);
    });
    
    it('オプションパラメータを正しく処理すること', async () => {
      // モックレスポンスの設定
      const mockResponse = { data: [] };
      axios.get.mockResolvedValue(mockResponse);
      
      // カスタムオプション
      const options = {
        sort: 'created',
        per_page: 50,
        page: 2
      };
      
      // メソッド実行
      await githubClient.getRepositories(username, options);
      
      // 検証
      expect(axios.get).toHaveBeenCalledWith(`/users/${username}/repos`, {
        params: options
      });
    });
    
    it('エラー時に例外をスローすること', async () => {
      // エラーモックの設定
      const mockError = new Error('API error');
      axios.get.mockRejectedValue(mockError);
      
      // メソッド実行と検証
      await expect(githubClient.getRepositories(username)).rejects.toThrow('GitHub リポジトリ一覧取得エラー');
    });
  });
  
  describe('getRepository', () => {
    const owner = 'testowner';
    const repo = 'testrepo';
    
    it('リポジトリ情報を取得できること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: {
          id: 12345,
          name: 'testrepo',
          description: 'Test repository',
          owner: {
            login: 'testowner'
          }
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // メソッド実行
      const result = await githubClient.getRepository(owner, repo);
      
      // 検証
      expect(axios.get).toHaveBeenCalledWith(`/repos/${owner}/${repo}`);
      expect(result).toEqual(mockResponse.data);
    });
    
    it('エラー時に例外をスローすること', async () => {
      // エラーモックの設定
      const mockError = new Error('API error');
      axios.get.mockRejectedValue(mockError);
      
      // メソッド実行と検証
      await expect(githubClient.getRepository(owner, repo)).rejects.toThrow('GitHub リポジトリ情報取得エラー');
    });
  });
});
