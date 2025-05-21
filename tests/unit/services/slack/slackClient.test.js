/**
 * ExtBridge - Slackクライアントのユニットテスト
 */

const axios = require('axios');
const SlackClient = require('../../../../src/services/slack/slackClient');

// axiosのモック
jest.mock('axios');

describe('SlackClient', () => {
  let slackClient;
  const mockAccessToken = 'xoxp-mock-slack-access-token';
  
  beforeEach(() => {
    // テスト前にモックをリセット
    jest.clearAllMocks();
    
    // Slackクライアントのインスタンスを作成
    slackClient = new SlackClient(mockAccessToken);
  });
  
  describe('constructor', () => {
    it('アクセストークンを正しく設定すること', () => {
      expect(slackClient.accessToken).toBe(mockAccessToken);
    });
    
    it('axiosクライアントを正しく設定すること', () => {
      expect(slackClient.client.defaults.baseURL).toBe('https://slack.com/api');
      expect(slackClient.client.defaults.headers.Authorization).toBe(`Bearer ${mockAccessToken}`);
      expect(slackClient.client.defaults.headers['Content-Type']).toBe('application/json; charset=utf-8');
    });
  });
  
  describe('getUserInfo', () => {
    it('ユーザー情報を取得できること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: {
          ok: true,
          user: {
            id: 'U12345',
            name: 'slack-user',
            real_name: 'Slack User',
            profile: {
              email: 'slack-user@example.com',
              image_72: 'https://example.com/avatar.png'
            }
          }
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // メソッド実行
      const result = await slackClient.getUserInfo();
      
      // 検証
      expect(axios.get).toHaveBeenCalledWith('/users.identity');
      expect(result).toEqual(mockResponse.data.user);
    });
    
    it('APIエラーレスポンスの場合、例外をスローすること', async () => {
      // エラーレスポンスのモック設定
      const mockResponse = {
        data: {
          ok: false,
          error: 'invalid_auth'
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // メソッド実行と検証
      await expect(slackClient.getUserInfo()).rejects.toThrow('Slack API エラー: invalid_auth');
    });
    
    it('ネットワークエラー時に例外をスローすること', async () => {
      // エラーモックの設定
      const mockError = new Error('Network error');
      axios.get.mockRejectedValue(mockError);
      
      // メソッド実行と検証
      await expect(slackClient.getUserInfo()).rejects.toThrow('Slack ユーザー情報取得エラー');
    });
  });
  
  describe('getChannels', () => {
    it('チャンネル一覧を取得できること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: {
          ok: true,
          channels: [
            { id: 'C12345', name: 'general', is_private: false },
            { id: 'C67890', name: 'random', is_private: false }
          ]
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // メソッド実行
      const result = await slackClient.getChannels();
      
      // 検証
      expect(axios.get).toHaveBeenCalledWith('/conversations.list', {
        params: { types: 'public_channel,private_channel', limit: 100 }
      });
      expect(result).toEqual(mockResponse.data.channels);
    });
    
    it('カスタムパラメータを正しく処理すること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: {
          ok: true,
          channels: []
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // カスタムオプション
      const options = {
        types: 'public_channel',
        limit: 50,
        cursor: 'dXNlcjpVMDYxTkZUUjI='
      };
      
      // メソッド実行
      await slackClient.getChannels(options);
      
      // 検証
      expect(axios.get).toHaveBeenCalledWith('/conversations.list', {
        params: options
      });
    });
    
    it('APIエラーレスポンスの場合、例外をスローすること', async () => {
      // エラーレスポンスのモック設定
      const mockResponse = {
        data: {
          ok: false,
          error: 'invalid_cursor'
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // メソッド実行と検証
      await expect(slackClient.getChannels()).rejects.toThrow('Slack API エラー: invalid_cursor');
    });
    
    it('ネットワークエラー時に例外をスローすること', async () => {
      // エラーモックの設定
      const mockError = new Error('Network error');
      axios.get.mockRejectedValue(mockError);
      
      // メソッド実行と検証
      await expect(slackClient.getChannels()).rejects.toThrow('Slack チャンネル一覧取得エラー');
    });
  });
  
  describe('getChannelInfo', () => {
    const channelId = 'C12345';
    
    it('チャンネル情報を取得できること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: {
          ok: true,
          channel: {
            id: 'C12345',
            name: 'general',
            is_private: false,
            topic: { value: 'Company-wide announcements' },
            purpose: { value: 'This channel is for team-wide communication' }
          }
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // メソッド実行
      const result = await slackClient.getChannelInfo(channelId);
      
      // 検証
      expect(axios.get).toHaveBeenCalledWith('/conversations.info', {
        params: { channel: channelId }
      });
      expect(result).toEqual(mockResponse.data.channel);
    });
    
    it('APIエラーレスポンスの場合、例外をスローすること', async () => {
      // エラーレスポンスのモック設定
      const mockResponse = {
        data: {
          ok: false,
          error: 'channel_not_found'
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // メソッド実行と検証
      await expect(slackClient.getChannelInfo(channelId)).rejects.toThrow('Slack API エラー: channel_not_found');
    });
    
    it('ネットワークエラー時に例外をスローすること', async () => {
      // エラーモックの設定
      const mockError = new Error('Network error');
      axios.get.mockRejectedValue(mockError);
      
      // メソッド実行と検証
      await expect(slackClient.getChannelInfo(channelId)).rejects.toThrow('Slack チャンネル情報取得エラー');
    });
  });
  
  describe('postMessage', () => {
    const channelId = 'C12345';
    const text = 'Hello, world!';
    
    it('メッセージを投稿できること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: {
          ok: true,
          channel: 'C12345',
          ts: '1589296883.000200',
          message: {
            text: 'Hello, world!',
            user: 'U12345',
            ts: '1589296883.000200'
          }
        }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      // メソッド実行
      const result = await slackClient.sendMessage(channelId, text);
      
      // 検証
      expect(axios.post).toHaveBeenCalledWith('/chat.postMessage', {
        channel: channelId,
        text: text
      });
      expect(result).toEqual(mockResponse.data);
    });
    
    it('追加オプションを正しく処理すること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        data: {
          ok: true,
          channel: 'C12345',
          ts: '1589296883.000200'
        }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      // 追加オプション
      const options = {
        as_user: true,
        attachments: [{ text: 'Attachment text' }]
      };
      
      // メソッド実行
      await slackClient.sendMessage(channelId, text, options);
      
      // 検証
      expect(axios.post).toHaveBeenCalledWith('/chat.postMessage', {
        channel: channelId,
        text: text,
        as_user: true,
        attachments: [{ text: 'Attachment text' }]
      });
    });
    
    it('APIエラーレスポンスの場合、例外をスローすること', async () => {
      // エラーレスポンスのモック設定
      const mockResponse = {
        data: {
          ok: false,
          error: 'channel_not_found'
        }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      // メソッド実行と検証
      await expect(slackClient.sendMessage(channelId, text)).rejects.toThrow('Slack API エラー: channel_not_found');
    });
    
    it('ネットワークエラー時に例外をスローすること', async () => {
      // エラーモックの設定
      const mockError = new Error('Network error');
      axios.post.mockRejectedValue(mockError);
      
      // メソッド実行と検証
      await expect(slackClient.sendMessage(channelId, text)).rejects.toThrow('Slack メッセージ投稿エラー');
    });
  });
});
