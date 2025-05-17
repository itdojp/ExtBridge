/**
 * ExtBridge - Figma APIクライアント
 * Figma APIとの連携機能を提供します
 */

const axios = require('axios');
const config = require('../../../config/default');
const logger = require('../../utils/logger');

// Figma API基本URL
const FIGMA_API_BASE_URL = 'https://api.figma.com/v1';

/**
 * Figma APIクライアントクラス
 */
class FigmaClient {
  /**
   * コンストラクタ
   * @param {string} accessToken - Figma APIアクセストークン
   */
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: FIGMA_API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Figma-Token': accessToken
      }
    });
  }

  /**
   * ユーザー情報を取得
   * @returns {Promise<Object>} ユーザー情報
   */
  async getUserInfo() {
    try {
      const response = await this.client.get('/me');
      return response.data;
    } catch (error) {
      logger.error(`Figma API エラー (getUserInfo): ${error.message}`);
      throw new Error(`Figma ユーザー情報取得エラー: ${error.message}`);
    }
  }

  /**
   * ファイル情報を取得
   * @param {string} fileKey - Figmaファイルキー
   * @returns {Promise<Object>} ファイル情報
   */
  async getFile(fileKey) {
    try {
      const response = await this.client.get(`/files/${fileKey}`);
      return response.data;
    } catch (error) {
      logger.error(`Figma API エラー (getFile): ${error.message}`);
      throw new Error(`Figma ファイル情報取得エラー: ${error.message}`);
    }
  }

  /**
   * ファイルのノード情報を取得
   * @param {string} fileKey - Figmaファイルキー
   * @param {string} nodeIds - 取得するノードIDのカンマ区切りリスト
   * @returns {Promise<Object>} ノード情報
   */
  async getFileNodes(fileKey, nodeIds) {
    try {
      const response = await this.client.get(`/files/${fileKey}/nodes`, {
        params: { ids: nodeIds }
      });
      return response.data;
    } catch (error) {
      logger.error(`Figma API エラー (getFileNodes): ${error.message}`);
      throw new Error(`Figma ノード情報取得エラー: ${error.message}`);
    }
  }

  /**
   * ファイルの画像を取得
   * @param {string} fileKey - Figmaファイルキー
   * @param {Object} options - 取得オプション
   * @returns {Promise<Object>} 画像URL情報
   */
  async getFileImages(fileKey, options = {}) {
    try {
      const { ids, scale = 1, format = 'png' } = options;
      const response = await this.client.get(`/images/${fileKey}`, {
        params: { ids, scale, format }
      });
      return response.data;
    } catch (error) {
      logger.error(`Figma API エラー (getFileImages): ${error.message}`);
      throw new Error(`Figma 画像取得エラー: ${error.message}`);
    }
  }

  /**
   * ユーザーのプロジェクト一覧を取得
   * @param {string} teamId - チームID
   * @returns {Promise<Array>} プロジェクト一覧
   */
  async getTeamProjects(teamId) {
    try {
      const response = await this.client.get(`/teams/${teamId}/projects`);
      return response.data.projects;
    } catch (error) {
      logger.error(`Figma API エラー (getTeamProjects): ${error.message}`);
      throw new Error(`Figma プロジェクト一覧取得エラー: ${error.message}`);
    }
  }

  /**
   * プロジェクトのファイル一覧を取得
   * @param {string} projectId - プロジェクトID
   * @returns {Promise<Array>} ファイル一覧
   */
  async getProjectFiles(projectId) {
    try {
      const response = await this.client.get(`/projects/${projectId}/files`);
      return response.data.files;
    } catch (error) {
      logger.error(`Figma API エラー (getProjectFiles): ${error.message}`);
      throw new Error(`Figma ファイル一覧取得エラー: ${error.message}`);
    }
  }

  /**
   * コメント一覧を取得
   * @param {string} fileKey - Figmaファイルキー
   * @returns {Promise<Array>} コメント一覧
   */
  async getComments(fileKey) {
    try {
      const response = await this.client.get(`/files/${fileKey}/comments`);
      return response.data.comments;
    } catch (error) {
      logger.error(`Figma API エラー (getComments): ${error.message}`);
      throw new Error(`Figma コメント一覧取得エラー: ${error.message}`);
    }
  }
}

module.exports = FigmaClient;
