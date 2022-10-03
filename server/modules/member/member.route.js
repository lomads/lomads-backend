const express = require('express');
const web3Auth = require('@server/services/web3Auth');
const memberCtrl = require('./member.controller');
const router = express.Router(); // eslint-disable-line new-cap

router.patch('/', web3Auth, memberCtrl.update)

module.exports = router;
