// Import required modules
const { describe, it, expect } = require('@jest/globals');

console.log('Simple test is running');

describe('Simple Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });

  it('should fail', () => {
    expect(1 + 1).not.toBe(3);
  });
});
