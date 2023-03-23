const express = require('express');
const web3Auth = require('@server/services/web3Auth');
const contractCtrl = require('./contract.controller');
const router = express.Router(); // eslint-disable-line new-cap

router.post('/', web3Auth, contractCtrl.create);
router.get('/signature', contractCtrl.signature);
router.post('/whitelist-signature', web3Auth, contractCtrl.getWhitelistSignature);
router.get('/:contractAddress', web3Auth, contractCtrl.getContract);
router.patch('/:contractAddress', web3Auth, contractCtrl.update);


module.exports = router;
