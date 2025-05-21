/**
 * ExtBridge - テスト終了時のクリーンアップ処理
 */

module.exports = async () => {
  // グローバルなリソースのクリーンアップ
  if (global.mongoServer) {
    await global.mongoServer.stop();
  }

  // その他のグローバルなリソースをクリーンアップ
  // jest.clearAllMocks(); // Removed: not available in global teardown context
  
  // 未解決のタイマーや非同期処理があればクリア
  if (global.gc) {
    global.gc();
  }
};
