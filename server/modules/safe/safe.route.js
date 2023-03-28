const express = require('express');
const safeCtrl = require('./safe.controller');
const web3Auth = require('@server/services/web3Auth');
const web3AdminAuth = require('@server/services/web3AdminAuth');

const router = express.Router(); // eslint-disable-line new-cap

router.post('/:address/sync', web3Auth, safeCtrl.syncSafe)

module.exports = router;
