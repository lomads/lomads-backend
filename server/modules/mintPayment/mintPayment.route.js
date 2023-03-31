const express = require('express');
const recurringPaymentCtrl = require('./mintPayment.controller');
const web3Auth = require('@server/services/web3Auth');

const router = express.Router(); // eslint-disable-line new-cap

router.post('/verify', web3Auth, recurringPaymentCtrl.verify);
router.get('/signature', web3Auth, recurringPaymentCtrl.generateSignature);
router.get('/:contract', web3Auth, recurringPaymentCtrl.getPayment);

module.exports = router;
