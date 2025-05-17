// Cloud Monitoring用のアプリケーション監視設定
const winston = require('winston');

// 環境に応じてロガーを設定
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: process.env.SERVICE_NAME || 'extbridge' },
  transports: [
    new winston.transports.Console()
  ],
});

// トレースプロバイダーの設定（テスト環境では簡易版）
const setupTracing = () => {
  // テスト環境では実際のトレースは行わない
  if (process.env.NODE_ENV === 'test') {
    return {
      // ダミーのトレーサー
      getTracer: () => ({
        startSpan: () => ({
          end: () => {}
        })
      })
    };
  }
  
  // 本番環境では実際のトレーサーを使用（ただし現在は簡易版）
  return {
    getTracer: () => ({
      startSpan: (name) => {
        logger.debug(`Starting span: ${name}`);
        return {
          end: () => { logger.debug(`Ending span: ${name}`); }
        };
      }
    })
  };
};

// メトリクスプロバイダーの設定（テスト環境では簡易版）
const setupMetrics = () => {
  // テスト環境では実際のメトリクス収集は行わない
  return {
    requestCounter: {
      add: (value, labels) => {
        if (process.env.NODE_ENV !== 'test') {
          logger.debug(`Request counter: +${value}`, labels);
        }
      }
    },
    responseTimeHistogram: {
      record: (value, labels) => {
        if (process.env.NODE_ENV !== 'test') {
          logger.debug(`Response time: ${value}s`, labels);
        }
      }
    },
    activeConnectionsGauge: {
      add: (value) => {
        if (process.env.NODE_ENV !== 'test') {
          logger.debug(`Active connections: ${value > 0 ? '+' : ''}${value}`);
        }
      }
    }
  };
};

// エラーロギング
const logError = (err, req = {}) => {
  const logData = {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  };
  
  logger.error(err.message, logData);
  return Promise.resolve(); // 非同期APIと互換性を保つ
};

// アプリケーション情報ロギング
const logInfo = (message, data = {}) => {
  const logData = {
    ...data,
    timestamp: new Date().toISOString(),
  };
  
  logger.info(message, logData);
  return Promise.resolve(); // 非同期APIと互換性を保つ
};

// Express.jsミドルウェア - リクエスト監視
const monitorRequests = (metrics) => {
  return (req, res, next) => {
    const startTime = Date.now();
    metrics.activeConnectionsGauge.add(1);
    
    // レスポンス完了時の処理
    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000; // 秒単位に変換
      
      metrics.requestCounter.add(1, {
        method: req.method,
        path: req.route ? req.route.path : req.path,
        status_code: res.statusCode.toString(),
      });
      
      metrics.responseTimeHistogram.record(duration, {
        method: req.method,
        path: req.route ? req.route.path : req.path,
      });
      
      metrics.activeConnectionsGauge.add(-1);
      
      // 4xx, 5xxエラーのログ
      if (res.statusCode >= 400) {
        logInfo(`HTTP ${res.statusCode} on ${req.method} ${req.originalUrl}`, {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          responseTime: duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        });
      }
    });
    
    next();
  };
};

// エラーハンドリングミドルウェア
const errorHandler = (err, req, res, next) => {
  logError(err, req);
  
  // エラーレスポンスを返す
  res.status(err.status || 500).json({
    error: {
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    },
  });
};

// アラート設定のヘルパー関数（テスト環境では簡易版）
const createAlert = async (metricType, displayName, filterString, duration, threshold) => {
  // テスト環境では実際のアラート設定は行わない
  if (process.env.NODE_ENV === 'test') {
    logger.debug(`Mock alert created: ${displayName}`);
    return { name: `mock-alert-${displayName}`, displayName };
  }
  
  // 本番環境では実際のアラートを設定（ただし現在は簡易版）
  logger.info(`Creating alert: ${displayName}`, {
    metricType,
    filterString,
    duration,
    threshold
  });
  
  return { name: `alert-${displayName}`, displayName };
};

// 初期化関数
const initMonitoring = async (app) => {
  try {
    // トレースの設定
    const tracerProvider = setupTracing();
    
    // メトリクスの設定
    const metrics = setupMetrics();
    
    // Expressミドルウェアの適用
    if (app) {
      app.use(monitorRequests(metrics));
      app.use(errorHandler);
    }
    
    // アラートの作成（本番環境のみ）
    if (process.env.NODE_ENV === 'production') {
      // エラーレート監視
      await createAlert(
        'custom.googleapis.com/http_requests_total',
        'High Error Rate',
        'metric.type="custom.googleapis.com/http_requests_total" AND metric.labels.status_code=~"5.."',
        300, // 5分間
        0.05 // 5%以上のエラー率でアラート
      );
      
      // レスポンスタイム監視
      await createAlert(
        'custom.googleapis.com/http_response_time_seconds',
        'High Response Time',
        'metric.type="custom.googleapis.com/http_response_time_seconds"',
        300, // 5分間
        2.0 // 2秒以上の応答時間でアラート
      );
    }
    
    logInfo('Application monitoring initialized successfully');
    
    return {
      tracerProvider,
      metrics,
      logError,
      logInfo,
      logger
    };
  } catch (err) {
    console.error('Failed to initialize monitoring:', err);
    // 監視の初期化に失敗してもアプリケーションは継続する
    return {
      logError: console.error,
      logInfo: console.info,
      logger
    };
  }
};

module.exports = {
  initMonitoring,
  logError,
  logInfo,
  logger
};
