console.log('Simple test in root directory is running');

describe('Simple Test in Root', () => {
  it('should pass', () => {
    console.log('Test is running');
    expect(1 + 1).toBe(2);
  });
});
