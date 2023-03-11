const express = require('express');
const web3Auth = require('@server/services/web3Auth');
const memberCtrl = require('./member.controller');
const router = express.Router(); // eslint-disable-line new-cap

router.patch('/', web3Auth, memberCtrl.update)
router.post('/update-onboarding-count', web3Auth, memberCtrl.updateUserOnboardingCount)
router.post('/earnings', web3Auth, memberCtrl.updateEarnings)

module.exports = router;
