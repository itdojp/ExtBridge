// Simple test for ExticClient
const axios = require('axios');
const ExticClient = require('./src/services/extic/exticClient');

// Mock config
jest.mock('config', () => ({
  extic: {
    baseUrl: 'https://extic.test.com/api/v1'
  }
}));

// Mock app-monitoring
jest.mock('./src/monitoring/app-monitoring', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('ExticClient', () => {
  let client;
  let mockAxiosInstance;

  beforeEach(() => {
    // Create a mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };
    
    // Mock axios.create
    axios.create = jest.fn().mockReturnValue(mockAxiosInstance);
    
    // Create client instance
    client = new ExticClient('test-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with the correct configuration', () => {
    // Verify client was created
    expect(client).toBeDefined();
    expect(client).toHaveProperty('accessToken', 'test-token');
    
    // Verify axios was configured correctly
    expect(axios.create).toHaveBeenCalledTimes(1);
    const config = axios.create.mock.calls[0][0];
    expect(config).toEqual({
      baseURL: 'https://extic.test.com/api/v1',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
  });
});
