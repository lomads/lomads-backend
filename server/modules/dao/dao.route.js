const express = require('express');
const daoCtrl = require('./dao.controller');
const web3Auth = require('@server/services/web3Auth');
const web3AdminAuth = require('@server/services/web3AdminAuth');

const router = express.Router(); // eslint-disable-line new-cap

router.get('/', web3Auth, daoCtrl.load)
router.post('/', web3Auth, daoCtrl.create)
router.get('/all', [web3Auth, web3AdminAuth], daoCtrl.loadAll)
router.get('/:url', daoCtrl.getByUrl)
router.patch('/:url/sweat-points', web3Auth, daoCtrl.updateSweatPoints)
router.patch('/:url/add-member', web3Auth, daoCtrl.addDaoMember)
router.patch('/:url/add-member-list', web3Auth, daoCtrl.addDaoMemberList)
router.patch('/:url/manage-member', web3Auth, daoCtrl.manageDaoMember)
router.patch('/:url/add-links', web3Auth, daoCtrl.addDaoLinks);
router.patch('/:url/update-links', web3Auth, daoCtrl.updateDaoLinks);
router.patch('/:url/delete-link', web3Auth, daoCtrl.deleteDaoLink);
router.patch('/:url/update-details', web3Auth, daoCtrl.updateDetails);
router.patch('/:url/sync-safe-owners', web3Auth, daoCtrl.syncSafeOwners);
router.patch('/:url/update-user-discord', web3Auth, daoCtrl.updateUserDiscord);

module.exports = router;
