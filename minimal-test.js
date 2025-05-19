// Minimal test to verify Jest is working
console.log('Running minimal test...');

describe('Minimal Test', () => {
  it('should pass', () => {
    console.log('Inside test...');
    expect(1 + 1).toBe(2);
  });
});

// Export for Jest
module.exports = { test: true };
