const express = require('express');
const web3Auth = require('@server/services/web3Auth');
const metaDataCtrl = require('./metadata.controller');
const router = express.Router(); // eslint-disable-line new-cap

router.post('/ipfs-metadata', web3Auth, metaDataCtrl.createIPFSMetadata);
router.post('/:contractAddress', web3Auth, metaDataCtrl.addMetaData);
router.get('/:contractAddress', web3Auth, metaDataCtrl.getMetadata);
router.patch('/:contractAddress', web3Auth, metaDataCtrl.update);

module.exports = router;