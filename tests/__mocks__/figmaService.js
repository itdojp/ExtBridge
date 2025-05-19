module.exports = {
    getUserInfo: jest.fn().mockResolvedValue({
        data: {
            id: 'test-figma-user',
            email: 'test@example.com',
            handle: 'testuser'
        }
    })
};
