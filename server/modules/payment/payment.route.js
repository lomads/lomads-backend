const express = require('express');
const web3Auth = require('@server/services/web3Auth');
const paymentCtrl = require('./payment.controller');
const router = express.Router(); // eslint-disable-line new-cap

router.get('/onboard', web3Auth, paymentCtrl.onboard);
router.get('/onboard-refresh', paymentCtrl.refresh);
router.get('/connected-account', paymentCtrl.connectionSuccess);
router.get('/stripe-accounts', web3Auth, paymentCtrl.loadStripeAccounts);
router.post('/initiate/:contractAddress', web3Auth, paymentCtrl.initializePayment);


module.exports = router;