// Import required modules
const { describe, it, expect } = require('@jest/globals');

console.log('Basic test is running');

describe('Basic Test', () => {
  it('should pass a basic test', () => {
    console.log('Running basic test');
    expect(1 + 1).toBe(2);
  });

  it('should fail intentionally', () => {
    console.log('Running failing test');
    expect(1 + 1).not.toBe(3);
  });
});
