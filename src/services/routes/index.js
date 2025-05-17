/**
 * ExtBridge - サービス連携ルート
 * 外部サービス連携のエンドポイントを定義します
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../auth/middleware/authMiddleware');
const githubController = require('../controllers/githubController');
const figmaController = require('../controllers/figmaController');
const slackController = require('../controllers/slackController');

// ミドルウェア - すべてのルートで認証を要求
router.use(verifyToken);

// GitHub連携ルート
router.get('/github/connect', githubController.connect);
router.get('/github/callback', githubController.handleCallback);
router.post('/github/disconnect', githubController.disconnect);
router.get('/github/repositories', githubController.getRepositories);
router.get('/github/repositories/:owner/:repo', githubController.getRepositoryDetails);

// Figma連携ルート
router.get('/figma/connect', figmaController.connect);
router.get('/figma/callback', figmaController.handleCallback);
router.post('/figma/disconnect', figmaController.disconnect);
router.get('/figma/projects', figmaController.getProjects);
router.get('/figma/projects/:projectId/files', figmaController.getProjectFiles);
router.get('/figma/files/:fileKey', figmaController.getFileDetails);

// Slack連携ルート
router.get('/slack/connect', slackController.connect);
router.get('/slack/callback', slackController.handleCallback);
router.post('/slack/disconnect', slackController.disconnect);
router.get('/slack/channels', slackController.getChannels);
router.get('/slack/channels/:channelId/history', slackController.getChannelHistory);
router.post('/slack/messages', slackController.sendMessage);
router.get('/slack/team', slackController.getTeamInfo);

module.exports = router;
