// Jestのグローバル関数を使用
console.log('Basic test is running');

describe('Basic Test', () => {
  it('should pass a basic test', () => {
    console.log('Running basic test');
    expect(1 + 1).toBe(2);
  });

  it('should pass another test', () => {
    console.log('Running another test');
    expect(1 + 1).not.toBe(3);
  });
});
