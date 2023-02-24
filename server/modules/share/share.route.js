const express = require('express');
const shareCtrl = require('./share.controller');

const router = express.Router(); // eslint-disable-line new-cap

router.get('/:daoId/project/:projectId/preview', shareCtrl.handleProjectShare);
router.get('/:daoId/task/:taskId/preview', shareCtrl.handleTaskShare);

module.exports = router;
