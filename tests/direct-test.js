// Simple test without any dependencies
console.log('Running direct test...');

function testAddition() {
  const result = 1 + 1;
  const expected = 2;
  
  if (result !== expected) {
    console.error(`Test failed: expected ${expected}, but got ${result}`);
    process.exit(1);
  }
  
  console.log('Test passed!');
  process.exit(0);
}

testAddition();
