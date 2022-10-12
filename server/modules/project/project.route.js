const express = require('express');
const projectCtrl = require('./project.controller');
const web3Auth = require('@server/services/web3Auth');

const router = express.Router(); // eslint-disable-line new-cap

router.post('/', web3Auth, projectCtrl.create)

module.exports = router;
