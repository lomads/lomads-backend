const express = require('express');
const daoCtrl = require('./dao.controller');
const web3Auth = require('@server/services/web3Auth');

const router = express.Router(); // eslint-disable-line new-cap

router.get('/', web3Auth, daoCtrl.load)
router.post('/', web3Auth, daoCtrl.create)
router.get('/:url', web3Auth, daoCtrl.getByUrl)
router.patch('/:url/add-member', web3Auth, daoCtrl.addDaoMember)

module.exports = router;
