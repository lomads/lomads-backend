const express = require('express');
const memberRoutes = require('@server/modules/member/member.route');
const daoRoutes = require('@server/modules/dao/dao.route');
const authRoutes = require('@server/modules/auth/auth.route');
const contractRoutes = require('@server/modules/contract/contract.route');
const metadataRoutes = require('@server/modules/metadata/metadata.route');
const transactionRoutes = require('@server/modules/transaction/transaction.route');
const projectRoutes = require('@server/modules/project/project.route');
const taskRoutes = require('@server/modules/task/task.route');
const utilityRoutes = require('@server/modules/utility/utility.route');
const notificationRoutes = require('@server/modules/notification/notification.route');
const discordRoutes = require('@server/modules/discord/discord.route');
const recurringPaymentRoutes = require('@server/modules/RecurringPayment/recurringPayment.route');

const contractCtrl = require('@server/modules/contract/contract.controller');

const router = express.Router(); // eslint-disable-line new-cap

// TODO: use glob to match *.route files

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
  res.send('OK')
);
router.use('/dao', daoRoutes);
router.use('/member', memberRoutes);
router.use('/contract', contractRoutes);
router.use('/transaction', transactionRoutes);
router.use('/auth', authRoutes);
router.use('/metadata', metadataRoutes);
router.use('/project', projectRoutes);
router.use('/task', taskRoutes);
router.use('/utility', utilityRoutes);
router.use('/notification', notificationRoutes);
router.use('/discord', discordRoutes);
router.use('/recurring-payment', recurringPaymentRoutes)
router.get('/:contractAddress/:token', contractCtrl.getContractTokenMetadata)

module.exports = router;
