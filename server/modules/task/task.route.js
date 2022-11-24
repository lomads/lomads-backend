const express = require('express');
const taskCtrl = require('./task.controller');
const web3Auth = require('@server/services/web3Auth');

const router = express.Router(); // eslint-disable-line new-cap

router.get('/:taskId', web3Auth, taskCtrl.getById);
router.post('/', web3Auth, taskCtrl.create);
router.post('/draft', web3Auth, taskCtrl.draftTask);
router.patch('/:taskId/apply', web3Auth, taskCtrl.applyTask);
router.patch('/:taskId/assign', web3Auth, taskCtrl.assignTask);
router.patch('/:taskId/reject-member', web3Auth, taskCtrl.rejectTaskMember);
router.patch('/:taskId/submit', web3Auth, taskCtrl.submitTask);
router.post('/:taskId/approve', web3Auth, taskCtrl.approveTask);
router.post('/:taskId/reject', web3Auth, taskCtrl.rejectTask);
router.patch('/:taskId/archive', web3Auth, taskCtrl.archiveTask);
router.patch('/:taskId/delete', web3Auth, taskCtrl.deleteTask);
router.patch('/:taskId/edit', web3Auth, taskCtrl.editTask);

module.exports = router;
