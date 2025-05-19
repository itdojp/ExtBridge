// Minimal test to verify Jest is working
console.log('Running minimal test...');

describe('Minimal Test', () => {
  it('should pass', () => {
    console.log('Inside test...');
    expect(1 + 1).toBe(2);
  });

  it('should also pass', () => {
    console.log('Another test...');
    expect(2 + 2).toBe(4);
  });
});
