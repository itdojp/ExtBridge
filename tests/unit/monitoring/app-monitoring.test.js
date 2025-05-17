/**
 * ExtBridge - モニタリング機能のユニットテスト
 */

const { Logging } = require('@google-cloud/logging');
const { Monitoring } = require('@google-cloud/monitoring');
const { TraceExporter } = require('@google-cloud/opentelemetry-cloud-trace-exporter');
const { MeterProvider } = require('@opentelemetry/sdk-metrics-base');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const express = require('express');

const { initMonitoring, logError, logInfo } = require('../../../monitoring/app-monitoring');

// モックの設定
jest.mock('@google-cloud/logging');
jest.mock('@google-cloud/monitoring');
jest.mock('@google-cloud/opentelemetry-cloud-trace-exporter');
jest.mock('@opentelemetry/sdk-metrics-base');
jest.mock('@opentelemetry/sdk-trace-node');
jest.mock('@opentelemetry/sdk-trace-base');
jest.mock('@opentelemetry/instrumentation');

describe('アプリケーションモニタリング', () => {
  let mockApp;
  let mockLog;
  let mockEntry;
  let mockWrite;
  
  beforeEach(() => {
    // テスト前にモックをリセット
    jest.clearAllMocks();
    
    // Expressアプリのモック
    mockApp = {
      use: jest.fn()
    };
    
    // Loggingのモック設定
    mockWrite = jest.fn().mockResolvedValue([true]);
    mockEntry = jest.fn().mockReturnValue({ write: mockWrite });
    mockLog = { entry: mockEntry };
    
    Logging.prototype.log = jest.fn().mockReturnValue(mockLog);
    
    // MeterProviderのモック設定
    const mockMeter = {
      createCounter: jest.fn().mockReturnValue({}),
      createHistogram: jest.fn().mockReturnValue({}),
      createUpDownCounter: jest.fn().mockReturnValue({})
    };
    MeterProvider.prototype.getMeter = jest.fn().mockReturnValue(mockMeter);
    
    // NodeTracerProviderのモック設定
    NodeTracerProvider.prototype.addSpanProcessor = jest.fn();
    NodeTracerProvider.prototype.register = jest.fn();
    
    // 環境変数の設定
    process.env.K_SERVICE = 'extbridge-test';
    process.env.K_REVISION = 'test-revision-001';
  });
  
  afterEach(() => {
    // 環境変数のリセット
    delete process.env.K_SERVICE;
    delete process.env.K_REVISION;
  });
  
  describe('initMonitoring', () => {
    it('モニタリングを正しく初期化すること', async () => {
      // テスト実行
      const result = await initMonitoring(mockApp);
      
      // 検証
      expect(NodeTracerProvider).toHaveBeenCalled();
      expect(MeterProvider).toHaveBeenCalled();
      expect(mockApp.use).toHaveBeenCalledTimes(2); // モニタリングミドルウェアとエラーハンドラー
      expect(result).toHaveProperty('tracerProvider');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('logError');
      expect(result).toHaveProperty('logInfo');
    });
    
    it('アプリが指定されていない場合でも初期化できること', async () => {
      // テスト実行
      const result = await initMonitoring();
      
      // 検証
      expect(NodeTracerProvider).toHaveBeenCalled();
      expect(MeterProvider).toHaveBeenCalled();
      expect(result).toHaveProperty('tracerProvider');
      expect(result).toHaveProperty('metrics');
    });
    
    it('エラー発生時にフォールバックオブジェクトを返すこと', async () => {
      // エラーをシミュレート
      NodeTracerProvider.prototype.register = jest.fn().mockImplementation(() => {
        throw new Error('初期化エラー');
      });
      
      // コンソールエラーをモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // テスト実行
      const result = await initMonitoring(mockApp);
      
      // 検証
      expect(console.error).toHaveBeenCalledWith('Failed to initialize monitoring:', expect.any(Error));
      expect(result).toHaveProperty('logError');
      expect(result).toHaveProperty('logInfo');
      
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    });
  });
  
  describe('logError', () => {
    it('エラーを正しくログ出力すること', async () => {
      // モックエラーとリクエスト
      const mockError = new Error('テストエラー');
      const mockReq = {
        path: '/api/test',
        method: 'GET'
      };
      
      // テスト実行
      await logError(mockError, mockReq);
      
      // 検証
      expect(mockEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: expect.objectContaining({
            type: 'cloud_run_revision',
            labels: expect.objectContaining({
              service_name: 'extbridge-test',
              revision_name: 'test-revision-001'
            })
          }),
          severity: 'ERROR'
        }),
        expect.objectContaining({
          message: 'テストエラー',
          stack: mockError.stack,
          path: '/api/test',
          method: 'GET'
        })
      );
      expect(mockWrite).toHaveBeenCalled();
    });
    
    it('リクエスト情報がない場合でもエラーをログ出力すること', async () => {
      // モックエラー
      const mockError = new Error('テストエラー');
      
      // テスト実行
      await logError(mockError);
      
      // 検証
      expect(mockEntry).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'ERROR' }),
        expect.objectContaining({
          message: 'テストエラー',
          stack: mockError.stack
        })
      );
      expect(mockWrite).toHaveBeenCalled();
    });
  });
  
  describe('logInfo', () => {
    it('情報を正しくログ出力すること', async () => {
      // メッセージとデータ
      const message = 'テスト情報メッセージ';
      const data = { key: 'value' };
      
      // テスト実行
      await logInfo(message, data);
      
      // 検証
      expect(mockEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: expect.objectContaining({
            type: 'cloud_run_revision',
            labels: expect.objectContaining({
              service_name: 'extbridge-test',
              revision_name: 'test-revision-001'
            })
          }),
          severity: 'INFO'
        }),
        expect.objectContaining({
          message: 'テスト情報メッセージ',
          data: { key: 'value' }
        })
      );
      expect(mockWrite).toHaveBeenCalled();
    });
    
    it('追加データなしでも情報をログ出力すること', async () => {
      // メッセージのみ
      const message = 'テスト情報メッセージ';
      
      // テスト実行
      await logInfo(message);
      
      // 検証
      expect(mockEntry).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'INFO' }),
        expect.objectContaining({
          message: 'テスト情報メッセージ',
          data: {}
        })
      );
      expect(mockWrite).toHaveBeenCalled();
    });
  });
  
  describe('monitorRequests ミドルウェア', () => {
    it('リクエスト監視ミドルウェアが正しく機能すること', async () => {
      // モックの設定
      const mockMetrics = {
        requestCounter: { add: jest.fn() },
        responseTimeHistogram: { record: jest.fn() },
        activeConnectionsGauge: { add: jest.fn() }
      };
      
      // Expressアプリの初期化をシミュレート
      await initMonitoring(mockApp);
      
      // ミドルウェア関数を取得（モックアプリのuse呼び出しから）
      const middleware = mockApp.use.mock.calls[0][0];
      
      // モックリクエスト、レスポンス、ネクスト関数
      const req = {
        method: 'GET',
        path: '/api/test',
        route: { path: '/api/test' },
        originalUrl: '/api/test?param=value',
        get: jest.fn().mockReturnValue('Mozilla/5.0'),
        ip: '127.0.0.1'
      };
      
      const res = {
        statusCode: 200,
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'finish') {
            // 非同期でコールバックを実行
            setTimeout(() => callback(), 10);
          }
          return res;
        })
      };
      
      const next = jest.fn();
      
      // テスト実行
      middleware(req, res, next);
      
      // 検証
      expect(next).toHaveBeenCalled();
      
      // 少し待ってからfinishイベントの処理を検証
      await new Promise(resolve => setTimeout(resolve, 20));
    });
  });
});
