// Cloud Monitoring用のアプリケーション監視設定
const { Logging } = require('@google-cloud/logging');
const { Monitoring } = require('@google-cloud/monitoring');
const { TraceExporter } = require('@google-cloud/opentelemetry-cloud-trace-exporter');
const { MeterProvider } = require('@opentelemetry/sdk-metrics-base');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { MongoDBInstrumentation } = require('@opentelemetry/instrumentation-mongodb');

// ロギングクライアントの初期化
const logging = new Logging();
const log = logging.log('extbridge-application');

// モニタリングクライアントの初期化
const monitoring = new Monitoring();

// トレースプロバイダーの設定
const setupTracing = () => {
  const provider = new NodeTracerProvider();
  const exporter = new TraceExporter();
  
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();
  
  // 自動計測の登録
  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new MongoDBInstrumentation(),
    ],
  });
  
  return provider;
};

// メトリクスプロバイダーの設定
const setupMetrics = () => {
  const meter = new MeterProvider().getMeter('extbridge-meter');
  
  // カスタムメトリクスの作成
  const requestCounter = meter.createCounter('http_requests_total', {
    description: 'Total number of HTTP requests',
  });
  
  const responseTimeHistogram = meter.createHistogram('http_response_time_seconds', {
    description: 'HTTP response time in seconds',
  });
  
  const activeConnectionsGauge = meter.createUpDownCounter('active_connections', {
    description: 'Number of active connections',
  });
  
  return {
    requestCounter,
    responseTimeHistogram,
    activeConnectionsGauge,
  };
};

// エラーロギング
const logError = (err, req = {}) => {
  const metadata = {
    resource: {
      type: 'cloud_run_revision',
      labels: {
        service_name: process.env.K_SERVICE || 'extbridge',
        revision_name: process.env.K_REVISION || 'unknown',
      },
    },
    severity: 'ERROR',
  };
  
  const entry = log.entry(metadata, {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
  
  return log.write(entry);
};

// アプリケーション情報ロギング
const logInfo = (message, data = {}) => {
  const metadata = {
    resource: {
      type: 'cloud_run_revision',
      labels: {
        service_name: process.env.K_SERVICE || 'extbridge',
        revision_name: process.env.K_REVISION || 'unknown',
      },
    },
    severity: 'INFO',
  };
  
  const entry = log.entry(metadata, {
    message,
    data,
    timestamp: new Date().toISOString(),
  });
  
  return log.write(entry);
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

// アラート設定のヘルパー関数
const createAlert = async (metricType, displayName, filterString, duration, threshold) => {
  const client = monitoring.alertPolicyServiceClient();
  
  const [policies] = await client.listAlertPolicies({
    name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}`,
  });
  
  // 既存のポリシーをチェック
  const existingPolicy = policies.find(p => p.displayName === displayName);
  if (existingPolicy) {
    console.log(`Alert policy ${displayName} already exists.`);
    return existingPolicy;
  }
  
  const [policy] = await client.createAlertPolicy({
    name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}`,
    alertPolicy: {
      displayName,
      combiner: 'OR',
      conditions: [
        {
          displayName: `${displayName} condition`,
          conditionThreshold: {
            filter: filterString,
            comparison: 'COMPARISON_GT',
            thresholdValue: threshold,
            duration: { seconds: duration },
            trigger: { count: 1 },
            aggregations: [
              {
                alignmentPeriod: { seconds: 60 },
                perSeriesAligner: 'ALIGN_RATE',
                crossSeriesReducer: 'REDUCE_SUM',
              },
            ],
          },
        },
      ],
      notificationChannels: [], // 通知チャネルはGCPコンソールで設定
    },
  });
  
  console.log(`Created alert policy: ${policy.name}`);
  return policy;
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
    };
  } catch (err) {
    console.error('Failed to initialize monitoring:', err);
    // 監視の初期化に失敗してもアプリケーションは継続する
    return {
      logError: console.error,
      logInfo: console.info,
    };
  }
};

module.exports = {
  initMonitoring,
  logError,
  logInfo,
};
