const express = require('express');
const web3Auth = require('@server/services/web3Auth');
const gnosisSafeCtrl = require('./gnosisSafe.controller');
const router = express.Router(); // eslint-disable-line new-cap

router.post('/', web3Auth, gnosisSafeCtrl.create)
router.patch('/', web3Auth, gnosisSafeCtrl.update)
router.get('/', web3Auth, gnosisSafeCtrl.load)
router.patch('/tx-label', web3Auth, gnosisSafeCtrl.updateTxLabel)

module.exports = router;
