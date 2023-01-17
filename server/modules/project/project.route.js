const express = require('express');
const projectCtrl = require('./project.controller');
const web3Auth = require('@server/services/web3Auth');

const router = express.Router(); // eslint-disable-line new-cap

router.post('/', web3Auth, projectCtrl.create);
router.get('/discord-server-exists/:discordServerId', web3Auth, projectCtrl.checkDiscordServerExists);
router.get('/notion/space-admin-status', web3Auth, projectCtrl.checkNotionSpaceAdminStatus);
router.get('/notion/notion-user', web3Auth, projectCtrl.getNotionUser);
router.post('/notion/add-role', web3Auth, projectCtrl.addNotionUserRole);
router.get('/:projectId', web3Auth, projectCtrl.getById);
router.patch('/:projectId/update-project', web3Auth, projectCtrl.updateProjectDetails);
router.patch('/:projectId/archive', web3Auth, projectCtrl.archiveProject);
router.patch('/:projectId/delete', web3Auth, projectCtrl.deleteProject);
router.patch('/:projectId/add-member', web3Auth, projectCtrl.addProjectMember);
router.patch('/:projectId/update-member', web3Auth, projectCtrl.updateProjectMember);
router.patch('/:projectId/delete-member', web3Auth, projectCtrl.deleteProjectMember);
router.patch('/:projectId/edit-members', web3Auth, projectCtrl.editProjectMember);
router.patch('/:projectId/add-links', web3Auth, projectCtrl.addProjectLinks);
router.patch('/:projectId/edit-links', web3Auth, projectCtrl.editProjectLinks);
router.patch('/:projectId/update-link', web3Auth, projectCtrl.updateProjectLink);
router.post('/:projectId/join-discord-queue', web3Auth, projectCtrl.joinDiscordQueue);
router.patch('/:projectId/update-kra', web3Auth, projectCtrl.updateProjectKRAReview);
router.patch('/:projectId/edit-kra', web3Auth, projectCtrl.editProjectKRA);
router.patch('/:projectId/update-milestones', web3Auth, projectCtrl.updateProjectMilestones);

module.exports = router;
