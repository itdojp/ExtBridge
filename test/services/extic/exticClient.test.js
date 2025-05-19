const nock = require('nock');
const axios = require('axios');
const ExticClient = require('../../../src/services/extic/exticClient');
const config = require('../../../src/config');

jest.mock('axios');

beforeEach(() => {
    axios.get.mockClear();
    axios.post.mockClear();
});

describe('ExticClient', () => {
    let exticClient;
    const mockUserInfo = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User'
    };
    const mockContracts = [{ id: 'contract1', name: 'Contract 1' }];
    const mockServices = [{ id: 'service1', name: 'Service 1' }];

    beforeEach(() => {
        exticClient = new ExticClient();
        
        // Mock axios responses
        axios.get.mockImplementation((url) => {
            if (url === `${config.EXTIC_API_BASE_URL}/users/me`) {
                return Promise.resolve({ data: mockUserInfo });
            }
            if (url === `${config.EXTIC_API_BASE_URL}/contracts`) {
                return Promise.resolve({ data: mockContracts });
            }
            if (url === `${config.EXTIC_API_BASE_URL}/services`) {
                return Promise.resolve({ data: mockServices });
            }
            return Promise.reject(new Error('Unexpected URL'));
        });
        
        axios.post.mockImplementation((url) => {
            return Promise.reject(new Error('Unexpected POST request'));
        });
    });

    afterEach(() => {
        nock.cleanAll();
    });

    describe('getUserInfo', () => {
        it('should return user info successfully', async () => {
            nock(config.EXTIC_API_BASE_URL)
                .get('/users/me')
                .reply(200, mockUserInfo);

            const result = await exticClient.getUserInfo();
            expect(result).toEqual(mockUserInfo);
        });

        it('should throw error when API request fails', async () => {
            nock(config.EXTIC_API_BASE_URL)
                .get('/users/me')
                .reply(500, { error: 'Server Error' });

            await expect(exticClient.getUserInfo()).rejects.toThrow('Extic ユーザー情報取得エラー');
        });
    });

    describe('getContracts', () => {
        it('should return contracts successfully', async () => {
            nock(config.EXTIC_API_BASE_URL)
                .get('/contracts')
                .reply(200, mockContracts);

            const result = await exticClient.getContracts();
            expect(result).toEqual(mockContracts);
        });

        it('should throw error when API request fails', async () => {
            nock(config.EXTIC_API_BASE_URL)
                .get('/contracts')
                .reply(500, { error: 'Server Error' });

            await expect(exticClient.getContracts()).rejects.toThrow('Extic 契約情報取得エラー');
        });
    });

    describe('getServices', () => {
        it('should return services successfully', async () => {
            nock(config.EXTIC_API_BASE_URL)
                .get('/services')
                .reply(200, mockServices);

            const result = await exticClient.getServices();
            expect(result).toEqual(mockServices);
        });

        it('should throw error when API request fails', async () => {
            nock(config.EXTIC_API_BASE_URL)
                .get('/services')
                .reply(500, { error: 'Server Error' });

            await expect(exticClient.getServices()).rejects.toThrow('Extic サービス情報取得エラー');
        });
    });
});
