// Simple test for ExticClient
const axios = require('axios');
const ExticClient = require('../../../src/services/extic/exticClient');

// Mock axios
jest.mock('axios');

// Mock config and app-monitoring
jest.mock('config');
jest.mock('../../monitoring/app-monitoring');

describe('ExticClient Simple Test', () => {
  let mockAxiosInstance;
  
  beforeEach(() => {
    // Create a mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };
    
    // Mock axios.create to return our mock instance
    axios.create.mockReturnValue(mockAxiosInstance);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should create an instance', () => {
    const client = new ExticClient('test-token');
    expect(client).toBeDefined();
    expect(client).toHaveProperty('accessToken', 'test-token');
    
    // Verify axios.create was called with the correct config
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'https://extic.example.com/api/v1',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
  });
});
