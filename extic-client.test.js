// Simple test for ExticClient
const axios = require('axios');
const ExticClient = require('./src/services/extic/exticClient');

// Mock the config module
jest.mock('./src/config', () => ({
  extic: {
    baseUrl: 'https://extic.test.com/api/v1',
    apiKey: 'test-api-key'
  },
  // Add other required config properties
  app: {
    port: 3000,
    env: 'test',
    name: 'ExtBridge'
  },
  db: {
    uri: 'mongodb://localhost:27017/test',
    options: {}
  },
  auth: {
    jwt: {
      secret: 'test-secret',
      expiresIn: '1h'
    }
  }
}));

// Mock the app-monitoring module
jest.mock('./src/monitoring/app-monitoring', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn()
  }
}));

describe('ExticClient', () => {
  let client;
  let mockAxiosInstance;

  beforeEach(() => {
    // Create a mock axios instance
    mockAxiosInstance = {
      get: jest.fn().mockResolvedValue({ data: {} }),
      post: jest.fn().mockResolvedValue({ data: {} }),
      put: jest.fn().mockResolvedValue({ data: {} }),
      delete: jest.fn().mockResolvedValue({ data: {} })
    };
    
    // Mock axios.create to return our mock instance
    axios.create = jest.fn().mockReturnValue(mockAxiosInstance);
    
    // Create a new client instance
    client = new ExticClient('test-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create an instance with the correct configuration', () => {
    // Verify the client was created
    expect(client).toBeDefined();
    expect(client).toHaveProperty('accessToken', 'test-token');
    
    // Verify axios.create was called with the correct config
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'https://extic.test.com/api/v1',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
  });

  it('should get user info', async () => {
    // Mock the response
    const mockUser = { id: '123', name: 'Test User' };
    mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUser });
    
    // Call the method
    const result = await client.getUserInfo();
    
    // Verify the result
    expect(result).toEqual(mockUser);
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/me');
  });
});
