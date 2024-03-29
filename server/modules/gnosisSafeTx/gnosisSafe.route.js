const express = require('express');
const web3Auth = require('@server/services/web3Auth');
const gnosisSafeCtrl = require('./gnosisSafe.controller');
const router = express.Router(); // eslint-disable-line new-cap

router.post('/', web3Auth, gnosisSafeCtrl.create)
router.patch('/', web3Auth, gnosisSafeCtrl.update)
router.get('/', web3Auth, gnosisSafeCtrl.load)
router.get('/transactions/:wallet', web3Auth, gnosisSafeCtrl.loadUserTransaction)
router.post('/update-metadata', web3Auth, gnosisSafeCtrl.updateMetadata)
router.post('/sync-safe', web3Auth, gnosisSafeCtrl.syncSafe)
router.get('/:safeTxHash', web3Auth, gnosisSafeCtrl.get)
router.patch('/tx-label', web3Auth, gnosisSafeCtrl.updateTxLabel)
router.patch('/off-chain/:confirm', web3Auth, gnosisSafeCtrl.confirmOffChainTxn)

router.post('/:safeTxHash/executed', web3Auth, gnosisSafeCtrl.postExecution)

module.exports = router;
