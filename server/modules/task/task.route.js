const express = require('express');
const taskCtrl = require('./task.controller');
const web3Auth = require('@server/services/web3Auth');

const router = express.Router(); // eslint-disable-line new-cap

router.post('/', web3Auth, taskCtrl.create);

module.exports = router;
