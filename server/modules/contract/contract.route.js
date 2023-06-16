const express = require('express');
const web3Auth = require('@server/services/web3Auth');
const contractCtrl = require('./contract.controller');
const router = express.Router(); // eslint-disable-line new-cap


router.get('/', web3Auth, contractCtrl.load);
router.post('/check', web3Auth, contractCtrl.checkContractAddress);
router.post('/', web3Auth, contractCtrl.create);
router.get('/signature', contractCtrl.signature);
router.get('/:contractAddress/validate-discount-code', web3Auth, contractCtrl.validateReferalCode)
router.post('/whitelist-signature', web3Auth, contractCtrl.getWhitelistSignature);
router.get('/:contractAddress', contractCtrl.getContract);
router.get('/getContractDao/:sbtId', contractCtrl.getContractDAO);
router.patch('/:contractAddress', web3Auth, contractCtrl.update);



module.exports = router;
