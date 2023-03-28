const express = require('express');
const web3Auth = require('@server/services/web3Auth');
const createAccount = require('@server/services/createAccount');
const router = express.Router(); // eslint-disable-line new-cap
const authCtrl = require('./auth.controller');
const web3AdminAuth = require('@server/services/web3AdminAuth');

router.get('/me', web3Auth, (req, res) => {
  return res.status(200).json(req.user)
});

router.patch('/me', web3Auth, authCtrl.update);
router.post('/admin', web3AdminAuth, createAccount);
router.post('/create-account', createAccount);
router.post('/create-account-aikon', authCtrl.createAccountAikon);



module.exports = router;
