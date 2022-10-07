const express = require('express');
const web3Auth = require('@server/services/web3Auth');
const metaDataCtrl = require('./metadata.controller');
const router = express.Router(); // eslint-disable-line new-cap

router.post('/:contractAddress', web3Auth, metaDataCtrl.addMetaData);

module.exports = router;