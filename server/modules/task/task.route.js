const express = require('express');
const taskCtrl = require('./task.controller');
const web3Auth = require('@server/services/web3Auth');

const router = express.Router(); // eslint-disable-line new-cap

router.get('/:taskId', web3Auth, taskCtrl.getById);
router.post('/', web3Auth, taskCtrl.create);
router.post('/draft', web3Auth, taskCtrl.draftTask);
router.patch('/:taskId/apply', web3Auth, taskCtrl.applyTask);
router.patch('/:taskId/assign', web3Auth, taskCtrl.assignTask);

module.exports = router;
