/**
 * ExtBridge - テストセットアップファイル
 */

// 環境変数の設定
process.env.NODE_ENV = 'test';
process.env.PORT = 3001;
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/extbridge_test';

// グローバルタイムアウトの設定
jest.setTimeout(10000);

// コンソール出力のモック化（テスト出力をクリーンに保つ）
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  // エラーと警告は表示する
  error: console.error,
  warn: console.warn,
};

// テスト後のクリーンアップ
afterAll(async () => {
  // 必要に応じてデータベース接続を閉じるなどの処理を追加
});
