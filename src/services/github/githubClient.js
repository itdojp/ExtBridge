/**
 * ExtBridge - GitHub APIクライアント
 * GitHub APIとの連携機能を提供します
 */

const axios = require('axios');
const config = require('../../../config/default');
const logger = require('../../utils/logger');

// GitHub API基本URL
const GITHUB_API_BASE_URL = 'https://api.github.com';

/**
 * GitHub APIクライアントクラス
 */
class GitHubClient {
  /**
   * コンストラクタ
   * @param {string} accessToken - GitHub APIアクセストークン
   */
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: GITHUB_API_BASE_URL,
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ExtBridge-App'
      }
    });
  }

  /**
   * ユーザー情報を取得
   * @returns {Promise<Object>} ユーザー情報
   */
  async getUserInfo() {
    try {
      const response = await this.client.get('/user');
      return response.data;
    } catch (error) {
      logger.error(`GitHub API エラー (getUserInfo): ${error.message}`);
      throw new Error(`GitHub ユーザー情報取得エラー: ${error.message}`);
    }
  }

  /**
   * ユーザーのリポジトリ一覧を取得
   * @param {string} username - GitHubユーザー名
   * @param {Object} options - 取得オプション
   * @returns {Promise<Array>} リポジトリ一覧
   */
  async getRepositories(username, options = {}) {
    try {
      const { sort = 'updated', per_page = 30, page = 1 } = options;
      const response = await this.client.get(`/users/${username}/repos`, {
        params: { sort, per_page, page }
      });
      return response.data;
    } catch (error) {
      logger.error(`GitHub API エラー (getRepositories): ${error.message}`);
      throw new Error(`GitHub リポジトリ一覧取得エラー: ${error.message}`);
    }
  }

  /**
   * ユーザーの組織一覧を取得
   * @returns {Promise<Array>} 組織一覧
   */
  async getOrganizations() {
    try {
      const response = await this.client.get('/user/orgs');
      return response.data;
    } catch (error) {
      logger.error(`GitHub API エラー (getOrganizations): ${error.message}`);
      throw new Error(`GitHub 組織一覧取得エラー: ${error.message}`);
    }
  }

  /**
   * リポジトリの詳細情報を取得
   * @param {string} owner - リポジトリオーナー
   * @param {string} repo - リポジトリ名
   * @returns {Promise<Object>} リポジトリ情報
   */
  async getRepository(owner, repo) {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}`);
      return response.data;
    } catch (error) {
      logger.error(`GitHub API エラー (getRepository): ${error.message}`);
      throw new Error(`GitHub リポジトリ情報取得エラー: ${error.message}`);
    }
  }

  /**
   * リポジトリのコミット履歴を取得
   * @param {string} owner - リポジトリオーナー
   * @param {string} repo - リポジトリ名
   * @param {Object} options - 取得オプション
   * @returns {Promise<Array>} コミット履歴
   */
  async getCommits(owner, repo, options = {}) {
    try {
      const { per_page = 30, page = 1, sha, path, author, since, until } = options;
      const response = await this.client.get(`/repos/${owner}/${repo}/commits`, {
        params: { per_page, page, sha, path, author, since, until }
      });
      return response.data;
    } catch (error) {
      logger.error(`GitHub API エラー (getCommits): ${error.message}`);
      throw new Error(`GitHub コミット履歴取得エラー: ${error.message}`);
    }
  }

  /**
   * リポジトリのIssue一覧を取得
   * @param {string} owner - リポジトリオーナー
   * @param {string} repo - リポジトリ名
   * @param {Object} options - 取得オプション
   * @returns {Promise<Array>} Issue一覧
   */
  async getIssues(owner, repo, options = {}) {
    try {
      const { state = 'open', per_page = 30, page = 1, labels, sort, direction } = options;
      const response = await this.client.get(`/repos/${owner}/${repo}/issues`, {
        params: { state, per_page, page, labels, sort, direction }
      });
      return response.data;
    } catch (error) {
      logger.error(`GitHub API エラー (getIssues): ${error.message}`);
      throw new Error(`GitHub Issue一覧取得エラー: ${error.message}`);
    }
  }
}

module.exports = GitHubClient;
