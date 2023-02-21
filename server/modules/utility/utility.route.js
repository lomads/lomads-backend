const express = require('express');
const utilityCtrl = require('./utility.controller');
const web3Auth = require('@server/services/web3Auth');

const router = express.Router(); // eslint-disable-line new-cap

router.post('/upload-url', web3Auth, utilityCtrl.getUploadURL);
router.post('/check-lomads-bot', web3Auth, utilityCtrl.checkLomadsBot)
router.post('/encrypt', web3Auth, utilityCtrl.encryptData)
router.post('/create-notification', web3Auth, utilityCtrl.createNotification)

// github oauth proxy server

router.get('/getGithubAccessToken', utilityCtrl.getGithubAccessToken);
router.post('/create-webhook', utilityCtrl.createWebhook);
router.post('/github/issues-listener', utilityCtrl.issuesListener);


module.exports = router;
