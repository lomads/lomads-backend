const express = require('express');
const utilityCtrl = require('./utility.controller');
const web3Auth = require('@server/services/web3Auth');

const router = express.Router(); // eslint-disable-line new-cap

router.post('/upload-url', web3Auth, utilityCtrl.getUploadURL);
router.post('/check-lomads-bot', web3Auth, utilityCtrl.checkLomadsBot)
router.post('/encrypt', web3Auth, utilityCtrl.encryptData)
router.post('/create-notification', web3Auth, utilityCtrl.createNotification)

// github 

router.get('/getGithubAccessToken', utilityCtrl.getGithubAccessToken);
router.get('/get-issues', web3Auth, utilityCtrl.getIssues);
router.post('/store-issues', utilityCtrl.storeIssues);
router.post('/desync-github', utilityCtrl.deSyncGithub);
router.post('/create-webhook', utilityCtrl.createWebhook);
router.post('/requiresGitAuthentication', utilityCtrl.requiresGitAuthentication);
router.post('/github/issues-listener', utilityCtrl.issuesListener);

router.post('/desync-discord', utilityCtrl.deSyncDiscord);

//  trello
router.get('/get-trello-organizations', utilityCtrl.getTrelloOrganization);
router.get('/get-trello-boards', utilityCtrl.getTrelloBoards);
router.post('/sync-trello-data', web3Auth, utilityCtrl.syncTrelloData);

router.get('/trello/trello-listener', utilityCtrl.trelloListener);
router.post('/trello/trello-listener', utilityCtrl.trelloListener);
router.post('/desync-trello', utilityCtrl.deSyncTrello);

router.get('/update-safe', utilityCtrl.updateSafe)

router.post('/estimate-gas', utilityCtrl.getEstimateGas)
router.post('/estimate-mint-gas', utilityCtrl.getEstimateMintGas)

router.get('/deploy-email-template', utilityCtrl.deployEmailTemplate)

router.post('/send-alert', web3Auth, utilityCtrl.sendAlert);

router.post('/on-ramper/status', utilityCtrl.onRamperStatus)
router.post('/stripe/status', utilityCtrl.onStripeStatus)

router.post('/transaction-status', utilityCtrl.getTxnStatus)

module.exports = router;
