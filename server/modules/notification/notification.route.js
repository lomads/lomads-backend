const express = require('express');
const web3Auth = require('@server/services/web3Auth');
const notificationCtrl = require('./notification.controller');
const router = express.Router(); // eslint-disable-line new-cap

router.get('/', web3Auth, notificationCtrl.load);

module.exports = router;