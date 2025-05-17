/**
 * ExtBridge - Exticクライアント
 * 
 * Exticサーバーとの通信を行うクライアントクラス
 */

const axios = require('axios');
const config = require('../../config');
const logger = require('../../monitoring/app-monitoring').logger;

class ExticClient {
  /**
   * Exticクライアントのコンストラクタ
   * @param {string} accessToken - Exticサーバーのアクセストークン
   */
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: config.extic.baseUrl || 'https://extic.example.com/api/v1',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * ユーザー情報を取得する
   * @returns {Promise<Object>} ユーザー情報
   */
  async getUserInfo() {
    try {
      const response = await this.client.get('/users/me');
      return response.data;
    } catch (error) {
      logger.error(`Extic ユーザー情報取得エラー: ${error.message}`, { error });
      throw new Error('Extic ユーザー情報取得エラー');
    }
  }

  /**
   * 契約情報を取得する
   * @param {Object} options - 取得オプション
   * @param {number} options.page - ページ番号
   * @param {number} options.limit - 1ページあたりの件数
   * @param {string} options.status - 契約ステータス
   * @returns {Promise<Object>} 契約情報
   */
  async getContracts(options = {}) {
    try {
      const params = {
        page: options.page || 1,
        limit: options.limit || 50,
        ...options
      };
      
      const response = await this.client.get('/contracts', { params });
      return response.data;
    } catch (error) {
      logger.error(`Extic 契約情報取得エラー: ${error.message}`, { error });
      throw new Error('Extic 契約情報取得エラー');
    }
  }

  /**
   * サービス情報を取得する
   * @param {Object} options - 取得オプション
   * @param {number} options.page - ページ番号
   * @param {number} options.limit - 1ページあたりの件数
   * @param {string} options.category - サービスカテゴリ
   * @returns {Promise<Object>} サービス情報
   */
  async getServices(options = {}) {
    try {
      const params = {
        page: options.page || 1,
        limit: options.limit || 50,
        ...options
      };
      
      const response = await this.client.get('/services', { params });
      return response.data;
    } catch (error) {
      logger.error(`Extic サービス情報取得エラー: ${error.message}`, { error });
      throw new Error('Extic サービス情報取得エラー');
    }
  }

  /**
   * サービス連携情報を取得する
   * @param {string} serviceId - サービスID
   * @returns {Promise<Object>} サービス連携情報
   */
  async getServiceIntegration(serviceId) {
    try {
      const response = await this.client.get(`/services/${serviceId}/integration`);
      return response.data;
    } catch (error) {
      logger.error(`Extic サービス連携情報取得エラー: ${error.message}`, { error, serviceId });
      throw new Error('Extic サービス連携情報取得エラー');
    }
  }

  /**
   * サービス連携を更新する
   * @param {string} serviceId - サービスID
   * @param {Object} integrationData - 連携データ
   * @returns {Promise<Object>} 更新結果
   */
  async updateServiceIntegration(serviceId, integrationData) {
    try {
      const response = await this.client.put(`/services/${serviceId}/integration`, integrationData);
      return response.data;
    } catch (error) {
      logger.error(`Extic サービス連携更新エラー: ${error.message}`, { error, serviceId });
      throw new Error('Extic サービス連携更新エラー');
    }
  }
}

module.exports = ExticClient;
