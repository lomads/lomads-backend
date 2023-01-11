const express = require('express');
const web3Auth = require('@server/services/web3Auth');
const discordCtrl = require('./discord.controller');
const router = express.Router(); // eslint-disable-line new-cap

router.get('/guild/:guildId', web3Auth, discordCtrl.getDiscordGuild)
router.post('/guild/:guildId/role', web3Auth, discordCtrl.createDiscordGuildRole)
router.get('/guild/:guildId/roles', web3Auth, discordCtrl.getDiscordGuildRoles)
router.get('/guild/:guildId/member/:memberId/role/:roleId/check', web3Auth, discordCtrl.checkMemberHasRole)
router.get('/guild/:guildId/member/:memberId/role/:roleId/add', web3Auth, discordCtrl.addGuildMemberRole)
router.get('/guild/:guildId/:channelId/invite-code', web3Auth, discordCtrl.getInviteCode)
router.post('/guild/:guildId/sync-roles', web3Auth, discordCtrl.syncRoles)
module.exports = router;
