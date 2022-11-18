const express = require('express');
const daoCtrl = require('./dao.controller');
const web3Auth = require('@server/services/web3Auth');

const router = express.Router(); // eslint-disable-line new-cap

router.get('/', web3Auth, daoCtrl.load)
router.post('/', web3Auth, daoCtrl.create)
router.get('/:url', web3Auth, daoCtrl.getByUrl)
router.patch('/:url/sweat-points', web3Auth, daoCtrl.updateSweatPoints)
router.patch('/:url/add-member', web3Auth, daoCtrl.addDaoMember)
router.patch('/:url/add-member-list', web3Auth, daoCtrl.addDaoMemberList)
router.patch('/:url/manage-member', web3Auth, daoCtrl.manageDaoMember)
router.patch('/:url/add-links', web3Auth, daoCtrl.addDaoLinks);
router.patch('/:url/update-links', web3Auth, daoCtrl.updateDaoLinks);
router.patch('/:url/update-details', web3Auth, daoCtrl.updateDetails);

module.exports = router;
