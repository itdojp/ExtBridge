/**
 * ExtBridge - メインアプリケーションエントリーポイント
 */

// 依存関係のインポート
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const config = require('../config/default');
const logger = require('./utils/logger');

// 環境変数の読み込み
dotenv.config();

// Expressアプリケーションの初期化
const app = express();

// ミドルウェアの設定
app.use(helmet()); // セキュリティヘッダーの設定
app.use(cors()); // CORS設定
app.use(express.json()); // JSONボディパーサー
app.use(express.urlencoded({ extended: true })); // URLエンコードボディパーサー

// ルートエンドポイント
app.get('/', (req, res) => {
  res.json({
    message: 'ExtBridge API',
    version: '0.1.0',
    status: 'running'
  });
});

// ルーターのセットアップ
app.use('/auth', require('./auth/routes'));
app.use('/api/services', require('./services/routes')); // サービス連携ルート

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status || 500
    }
  });
});

// サーバーの起動
const PORT = config.server.port;
app.listen(PORT, () => {
  logger.info(`ExtBridge server running on port ${PORT} in ${config.server.env} mode`);
});

module.exports = app; // テスト用にエクスポート
