const express = require('express');
const web3Auth = require('@server/services/web3Auth');
const contractCtrl = require('./contract.controller');
const router = express.Router(); // eslint-disable-line new-cap

router.post('/', web3Auth, contractCtrl.create);
router.get('/:contractAddress', web3Auth, contractCtrl.getContract);

module.exports = router;
