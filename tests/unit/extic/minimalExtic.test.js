console.log('テストを開始します');

describe('Minimal Extic Test', () => {
  it('should pass a simple test', () => {
    console.log('テストを実行中');
    expect(1 + 1).toBe(2);
  });
});

console.log('テストの定義が完了しました');
