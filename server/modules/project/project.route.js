const express = require('express');
const projectCtrl = require('./project.controller');
const web3Auth = require('@server/services/web3Auth');

const router = express.Router(); // eslint-disable-line new-cap

router.post('/', web3Auth, projectCtrl.create);
router.get('/:projectId', web3Auth, projectCtrl.getById);
router.patch('/:projectId/add-member', web3Auth, projectCtrl.addProjectMember);
router.patch('/:projectId/add-links', web3Auth, projectCtrl.addProjectLinks);

module.exports = router;
