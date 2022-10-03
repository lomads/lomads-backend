const express = require('express');
const memberRoutes = require('@server/modules/member/member.route');
const daoRoutes = require('@server/modules/dao/dao.route');
const authRoutes = require('@server/modules/auth/auth.route');

const router = express.Router(); // eslint-disable-line new-cap

// TODO: use glob to match *.route files

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
  res.send('OK')
);

// mount user routes at /users
router.use('/dao', daoRoutes);

// mount user routes at /users
router.use('/member', memberRoutes);

// mount auth routes at /auth
router.use('/auth', authRoutes);

module.exports = router;
