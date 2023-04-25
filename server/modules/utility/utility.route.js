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
router.get('/get-issues', utilityCtrl.getIssues);
router.post('/store-issues', utilityCtrl.storeIssues);
router.post('/create-webhook', utilityCtrl.createWebhook);
router.post('/github/issues-listener', utilityCtrl.issuesListener);

//  trello
router.get('/get-trello-organizations', utilityCtrl.getTrelloOrganization);
router.get('/get-trello-boards', utilityCtrl.getTrelloBoards);
router.post('/sync-trello-data',web3Auth, utilityCtrl.syncTrelloData);

router.get('/trello/trello-listener', utilityCtrl.trelloListener);
router.post('/trello/trello-listener', utilityCtrl.trelloListener);

router.get('/update-safe', utilityCtrl.updateSafe)

router.post('/estimate-gas', utilityCtrl.getEstimateGas)


module.exports = router;
