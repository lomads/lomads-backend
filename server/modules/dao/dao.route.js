const express = require('express');
const rateLimit = require('express-rate-limit')
const Web3Token = require('web3-token');
const Member = require('@server/modules/member/member.model');
const { toChecksumAddress, checkAddressChecksum } = require('ethereum-checksum-address')
const daoCtrl = require('./dao.controller');
const web3Auth = require('@server/services/web3Auth');
const web3AdminAuth = require('@server/services/web3AdminAuth');

const router = express.Router(); // eslint-disable-line new-cap

const createOrgLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 3, // Limit each IP to 5 create account requests per `window` (here, per hour)
	message:
		'Too many organisations created from this IP, please try again after an hour',
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

router.get('/', web3Auth, daoCtrl.load)
router.post('/', [createOrgLimiter, web3Auth], daoCtrl.create)
router.get('/sbt-dao', web3Auth, daoCtrl.loadSBTDao)
router.get('/all', [web3Auth, web3AdminAuth], daoCtrl.loadAll)
router.get('/:url', async (req, res, next) => {
    const token = req.headers['authorization']
    if(token) {
        const { address = '', body } = await Web3Token.verify(token);
        let member = await Member.findOne({ wallet: toChecksumAddress(address) })
        if (!member) {
            return res.status(500).json({ message: 'Invalid Token' })
        }
        req.user = member;
        return next();
    }
    return next();
}, daoCtrl.getByUrl)
router.delete('/:url', [web3Auth, web3AdminAuth], daoCtrl.deleteByUrl)
router.patch('/:url/sweat-points', web3Auth, daoCtrl.updateSweatPoints)
router.patch('/:url/add-member', web3Auth, daoCtrl.addDaoMember)
router.patch('/:url/create-option', web3Auth, daoCtrl.createOption)
router.patch('/:url/add-member-list', web3Auth, daoCtrl.addDaoMemberList)
router.patch('/:url/manage-member', web3Auth, daoCtrl.manageDaoMember)
router.patch('/:url/add-links', web3Auth, daoCtrl.addDaoLinks);
router.patch('/:url/update-links', web3Auth, daoCtrl.updateDaoLinks);
router.patch('/:url/delete-link', web3Auth, daoCtrl.deleteDaoLink);
router.patch('/:url/update-details', web3Auth, daoCtrl.updateDetails);
router.patch('/:url/sync-safe-owners', web3Auth, daoCtrl.syncSafeOwners);
router.patch('/:url/update-user-discord', web3Auth, daoCtrl.updateUserDiscord);
router.post('/:url/attach-safe', web3Auth, daoCtrl.attachSafe);
router.post('/:url/toggle-safe-state', web3Auth, daoCtrl.toggleSafeState);

module.exports = router;
