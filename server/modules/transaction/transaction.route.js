const express = require('express');
const transactionCtrl = require('./transaction.controller');
const web3Auth = require('@server/services/web3Auth');

const router = express.Router(); // eslint-disable-line new-cap


router.get('/', web3Auth, transactionCtrl.load)
router.get('/off-chain', web3Auth, transactionCtrl.loadOffChain)
router.post('/off-chain', web3Auth, transactionCtrl.createOffChainTransaction)
router.patch('/off-chain/:nonce/reject', web3Auth, transactionCtrl.rejectOffChainTransaction)
router.patch('/off-chain/:safeTxHash/approve', web3Auth, transactionCtrl.approveOffChainTransaction)
router.post('/', web3Auth, transactionCtrl.create)
router.patch('/', web3Auth, transactionCtrl.update)

module.exports = router;
