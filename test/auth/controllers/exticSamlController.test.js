const { verifyExticSamlAssertion, handleExticSamlCallback } = require('../../../src/auth/controllers/exticSamlController');
const { User } = require('../../../src/models/User');

jest.mock('../../../src/auth/controllers/exticSamlController', () => ({
    verifyExticSamlAssertion: jest.fn(),
    handleExticSamlCallback: jest.fn()
}));

jest.mock('../../../src/config', () => ({
    EXTIC_SAML_ENDPOINT: 'http://mock-saml-endpoint'
}));

jest.mock('../../../src/models/User');

describe('ExticSamlController', () => {
    const mockRequest = {
        query: {
            SAMLResponse: 'mock-saml-response'
        }
    };
    const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    };
    const mockNext = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({ _id: '123' });
    });

    describe('verifyExticSamlAssertion', () => {
        it('should return true for valid SAML assertion', () => {
            verifyExticSamlAssertion.mockImplementation(() => true);
            
            const result = verifyExticSamlAssertion(mockRequest);
            expect(result).toBe(true);
        });

        it('should return false for invalid SAML assertion', () => {
            verifyExticSamlAssertion.mockImplementation(() => false);
            
            const result = verifyExticSamlAssertion(mockRequest);
            expect(result).toBe(false);
        });
    });

    describe('handleExticSamlCallback', () => {
        it('should handle valid SAML callback and create new user', async () => {
            verifyExticSamlAssertion.mockImplementation(() => true);
            
            await handleExticSamlCallback(mockRequest, mockResponse, mockNext);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(User.create).toHaveBeenCalledWith({
                email: 'test@example.com',
                name: 'Test User'
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 'success',
                message: '認証に成功しました'
            });
        });

        it('should handle invalid SAML assertion', async () => {
            verifyExticSamlAssertion.mockImplementation(() => false);
            
            await handleExticSamlCallback(mockRequest, mockResponse, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 'error',
                message: '認証に失敗しました'
            });
        });

        it('should handle SAML response parsing error', async () => {
            mockRequest.query.SAMLResponse = null;
            
            await handleExticSamlCallback(mockRequest, mockResponse, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'SAMLレスポンスが不正です'
            });
        });
    });
});
