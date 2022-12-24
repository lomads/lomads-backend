const express = require('express');
const recurringPaymentCtrl = require('./recurringPayment.controller');
const web3Auth = require('@server/services/web3Auth');

const router = express.Router(); // eslint-disable-line new-cap

router.get('/', web3Auth, recurringPaymentCtrl.load);
router.post('/', web3Auth, recurringPaymentCtrl.create);
router.patch('/:recurringTxId', web3Auth, recurringPaymentCtrl.update);
router.patch('/reject', web3Auth, recurringPaymentCtrl.rejectRecurringPayment);
router.delete('/:txId', web3Auth, recurringPaymentCtrl.deleteRecurringTxn);
router.post('/:queueId/complete', web3Auth, recurringPaymentCtrl.completeQueuePayment);

module.exports = router;
