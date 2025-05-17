/**
 * ExtBridge - ロガーユーティリティ
 * アプリケーション全体で一貫したログ記録を提供します
 */

const winston = require('winston');
const config = require('../../config/default');
const fs = require('fs');
const path = require('path');

// ログディレクトリの確認と作成
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// ロガーの設定
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'extbridge' },
  transports: [
    // ファイルへのログ出力
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // エラーログの別ファイル出力
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// 開発環境の場合はコンソールにも出力
if (config.server.env !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
