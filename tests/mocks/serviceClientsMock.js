const axios = require('axios');

// GitHub APIのモック
jest.mock('axios', () => {
  return {
    create: jest.fn().mockReturnValue({
      get: jest.fn().mockImplementation((url) => {
        if (url === '/user') {
          return Promise.resolve({
            data: {
              id: 'github-user-id',
              login: 'test-user',
              name: 'Test User',
              email: 'test@example.com'
            }
          });
        }
        if (url === '/user/repos') {
          return Promise.resolve({
            data: [{
              id: 'repo1',
              name: 'test-repo',
              full_name: 'test-user/test-repo',
              html_url: 'https://github.com/test-user/test-repo'
            }]
          });
        }
        return Promise.reject(new Error('Invalid GitHub API request'));
      }),
      post: jest.fn().mockImplementation(() => {
        return Promise.reject(new Error('Invalid GitHub API request'));
      })
    })
  };
});

// Figma APIのモック
jest.mock('figma-api', () => {
  return class FigmaAPI {
    constructor(token) {
      this.token = token;
    }

    async me() {
      return {
        id: 'figma-user-id',
        handle: 'test-user',
        email: 'test@example.com',
        name: 'Test User'
      };
    }

    async files() {
      return [{
        id: 'file1',
        name: 'Test File',
        lastModified: new Date().toISOString(),
        thumbnailUrl: 'https://example.com/thumbnail.png'
      }];
    }
  };
});

// Slack APIのモック
jest.mock('@slack/web-api', () => {
  return {
    WebClient: jest.fn().mockImplementation(() => {
      return {
        auth: {
          test: jest.fn().mockResolvedValue({
            ok: true,
            user_id: 'slack-user-id',
            user: 'test-user',
            team: 'test-team',
            url: 'https://slack.com'
          })
        },
        users: {
          profile: {
            get: jest.fn().mockResolvedValue({
              ok: true,
              profile: {
                email: 'test@example.com',
                real_name: 'Test User',
                display_name: 'Test User'
              }
            })
          }
        },
        conversations: {
          list: jest.fn().mockResolvedValue({
            ok: true,
            channels: [{
              id: 'channel1',
              name: 'general',
              is_channel: true
            }]
          })
        }
      };
    })
  };
});

module.exports = {
  mockGitHubClient: () => {
    return axios.create();
  },
  mockFigmaClient: () => {
    return new (require('figma-api'))('test-token');
  },
  mockSlackClient: () => {
    return new (require('@slack/web-api').WebClient)('test-token');
  }
};
