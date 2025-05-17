/**
 * ExtBridge - Slack APIクライアント
 * Slack APIとの連携機能を提供します
 */

const axios = require('axios');
const config = require('../../../config/default');
const logger = require('../../utils/logger');

// Slack API基本URL
const SLACK_API_BASE_URL = 'https://slack.com/api';

/**
 * Slack APIクライアントクラス
 */
class SlackClient {
  /**
   * コンストラクタ
   * @param {string} accessToken - Slack APIアクセストークン
   */
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: SLACK_API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  }

  /**
   * ユーザー情報を取得
   * @returns {Promise<Object>} ユーザー情報
   */
  async getUserInfo() {
    try {
      const response = await this.client.get('/users.identity');
      return response.data;
    } catch (error) {
      logger.error(`Slack API エラー (getUserInfo): ${error.message}`);
      throw new Error(`Slack ユーザー情報取得エラー: ${error.message}`);
    }
  }

  /**
   * チャンネル一覧を取得
   * @param {Object} options - 取得オプション
   * @returns {Promise<Array>} チャンネル一覧
   */
  async getChannels(options = {}) {
    try {
      const { limit = 100, exclude_archived = true, types = 'public_channel,private_channel' } = options;
      const response = await this.client.get('/conversations.list', {
        params: { limit, exclude_archived, types }
      });
      return response.data.channels;
    } catch (error) {
      logger.error(`Slack API エラー (getChannels): ${error.message}`);
      throw new Error(`Slack チャンネル一覧取得エラー: ${error.message}`);
    }
  }

  /**
   * チャンネルのメッセージ履歴を取得
   * @param {string} channelId - チャンネルID
   * @param {Object} options - 取得オプション
   * @returns {Promise<Array>} メッセージ履歴
   */
  async getChannelHistory(channelId, options = {}) {
    try {
      const { limit = 100, latest, oldest, inclusive = 0 } = options;
      const response = await this.client.get('/conversations.history', {
        params: { channel: channelId, limit, latest, oldest, inclusive }
      });
      return response.data.messages;
    } catch (error) {
      logger.error(`Slack API エラー (getChannelHistory): ${error.message}`);
      throw new Error(`Slack メッセージ履歴取得エラー: ${error.message}`);
    }
  }

  /**
   * メッセージを送信
   * @param {string} channelId - チャンネルID
   * @param {string} text - 送信するテキスト
   * @param {Object} options - 送信オプション
   * @returns {Promise<Object>} 送信結果
   */
  async sendMessage(channelId, text, options = {}) {
    try {
      const { thread_ts, blocks, attachments } = options;
      const response = await this.client.post('/chat.postMessage', {
        channel: channelId,
        text,
        thread_ts,
        blocks,
        attachments
      });
      return response.data;
    } catch (error) {
      logger.error(`Slack API エラー (sendMessage): ${error.message}`);
      throw new Error(`Slack メッセージ送信エラー: ${error.message}`);
    }
  }

  /**
   * ユーザー一覧を取得
   * @param {Object} options - 取得オプション
   * @returns {Promise<Array>} ユーザー一覧
   */
  async getUsers(options = {}) {
    try {
      const { limit = 100, include_locale = true } = options;
      const response = await this.client.get('/users.list', {
        params: { limit, include_locale }
      });
      return response.data.members;
    } catch (error) {
      logger.error(`Slack API エラー (getUsers): ${error.message}`);
      throw new Error(`Slack ユーザー一覧取得エラー: ${error.message}`);
    }
  }

  /**
   * チームの情報を取得
   * @returns {Promise<Object>} チーム情報
   */
  async getTeamInfo() {
    try {
      const response = await this.client.get('/team.info');
      return response.data.team;
    } catch (error) {
      logger.error(`Slack API エラー (getTeamInfo): ${error.message}`);
      throw new Error(`Slack チーム情報取得エラー: ${error.message}`);
    }
  }

  /**
   * ファイル一覧を取得
   * @param {Object} options - 取得オプション
   * @returns {Promise<Array>} ファイル一覧
   */
  async getFiles(options = {}) {
    try {
      const { channel, user, count = 100, types = 'all' } = options;
      const response = await this.client.get('/files.list', {
        params: { channel, user, count, types }
      });
      return response.data.files;
    } catch (error) {
      logger.error(`Slack API エラー (getFiles): ${error.message}`);
      throw new Error(`Slack ファイル一覧取得エラー: ${error.message}`);
    }
  }
}

module.exports = SlackClient;
