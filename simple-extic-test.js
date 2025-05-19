// Simple test for ExticClient
const axios = require('axios');
const ExticClient = require('./src/services/extic/exticClient');

// Mock axios
jest.mock('axios');

// Mock config and app-monitoring
jest.mock('config');
jest.mock('./src/monitoring/app-monitoring');

describe('ExticClient Simple Test', () => {
  let mockAxiosInstance;
  
  beforeEach(() => {
    console.log('Setting up test...');
    
    // Create a mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };
    
    // Mock axios.create to return our mock instance
    axios.create.mockReturnValue(mockAxiosInstance);
    
    // Mock config
    const config = require('config');
    config.extic = {
      baseUrl: 'https://extic.test.com/api/v1'
    };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should create an instance', () => {
    console.log('Running test...');
    const client = new ExticClient('test-token');
    expect(client).toBeDefined();
    expect(client).toHaveProperty('accessToken', 'test-token');
    
    // Verify axios.create was called with the correct config
    expect(axios.create).toHaveBeenCalled();
    
    const call = axios.create.mock.calls[0][0];
    expect(call.baseURL).toBe('https://extic.test.com/api/v1');
    expect(call.headers.Authorization).toBe('Bearer test-token');
    expect(call.headers['Content-Type']).toBe('application/json');
  });
});
