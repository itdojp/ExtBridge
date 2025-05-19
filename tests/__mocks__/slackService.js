module.exports = {
    getUserInfo: jest.fn().mockResolvedValue({ 
        data: { 
            ok: true, 
            user: { 
                id: 'U12345678', 
                name: 'testuser' 
            } 
        } 
    })
};
