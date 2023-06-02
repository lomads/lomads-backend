const express = require('express');
const web3Auth = require('@server/services/web3Auth');
const gnosisSafeCtrl = require('./gnosisSafe.controller');
const router = express.Router(); // eslint-disable-line new-cap

router.get('/', web3Auth, gnosisSafeCtrl.load)

module.exports = router;
