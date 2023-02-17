const express = require('express');
const shareCtrl = require('./share.controller');

const router = express.Router(); // eslint-disable-line new-cap

router.get('/:daoId/project/:projectId/preview', shareCtrl.handleProjectShare);

module.exports = router;
