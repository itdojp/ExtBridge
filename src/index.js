/**
 * ExtBridge - メインアプリケーションエントリーポイント
 */

// 依存関係のインポート
const express = require('express');
const mongoose = require('mongoose');
const config = require('../config/default');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

// モニタリングの初期化
const { initMonitoring, logError, logInfo } = require('../monitoring/app-monitoring');

// ルートのインポート
const authRoutes = require('./auth/routes');
const serviceRoutes = require('./services/routes');

// 環境変数の読み込み
dotenv.config();

// Express アプリケーションの初期化
const app = express();

// ミドルウェアの設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, '../public')));

// ルートの設定
app.use('/api/services', serviceRoutes);

// 認証ルートの有効化
app.use('/auth', authRoutes);

// React アプリケーションのためのフォールバックルート
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// グローバルエラーハンドラー
app.use((err, req, res, next) => {
  logError(err, req);
  res.status(err.status || 500).json({
    error: {
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
    }
  });
});

// データベース接続
mongoose.connect(config.db.uri, config.db.options)
  .then(async () => {
    console.log('MongoDB に接続しました');
    
    // モニタリングの初期化
    await initMonitoring(app);
    logInfo('アプリケーションが起動しました');
    
    // サーバーの起動
    const PORT = process.env.PORT || config.server.port;
    app.listen(PORT, () => {
      console.log(`サーバーがポート ${PORT} で起動しました`);
      logInfo(`サーバーがポート ${PORT} で起動しました`);
    });
  })
  .catch(err => {
    console.error('MongoDB 接続エラー:', err);
    logError(err);
    process.exit(1);
  });
// サーバーの起動
const PORT = config.server.port;
app.listen(PORT, () => {
  logger.info(`ExtBridge server running on port ${PORT} in ${config.server.env} mode`);
});

module.exports = app; // テスト用にエクスポート
