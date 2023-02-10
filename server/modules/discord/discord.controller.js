const { getGuild, hasNecessaryPermissions, getGuildRoles, getGuildMembers, createGuildRole, createChannelInvite, memberHasRole, attachGuildMemberRole } = require('@services/discord');
const DAO = require('@server/modules/dao/dao.model');
const Project = require('@server/modules/project/project.model');
const _ = require('lodash')

const getDiscordGuild = async (req, res) => {
    const { guildId } = req.params
    try {
        await hasNecessaryPermissions(guildId);
        const guild = await getGuild(guildId)
        return res.status(200).json(guild)
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: e })
    }
}

const getDiscordGuildRoles = async (req, res) => {
    const { guildId } = req.params
    try {
        await hasNecessaryPermissions(guildId);
        const roles = await getGuildRoles(guildId)
        return res.status(200).json(roles)
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: e })
    }
}

const createDiscordGuildRole = async (req, res) => {
    const { guildId } = req.params
    const { name } = req.body
    try {
        await hasNecessaryPermissions(guildId);
        const role = await createGuildRole(guildId, name)
        return res.status(200).json(role)
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: e })
    }
}

const getInviteCode = async (req, res) => {
    const { guildId, channelId } = req.params
    try {
        await hasNecessaryPermissions(guildId);
       const code = await createChannelInvite(guildId, channelId)
       return res.status(200).json({ code })
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: e })
    }
}

const checkMemberHasRole = async (req, res) => {
    const { guildId, memberId, roleId } = req.params;
    try {
        await hasNecessaryPermissions(guildId);
       const role = await memberHasRole(guildId, memberId, roleId)
       return res.status(200).json({ role })
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: e })
    }
}

const addGuildMemberRole = async (req, res) => {
    const { guildId, memberId, roleId } = req.params;
    try {
        await hasNecessaryPermissions(guildId);
        const hasRole = await memberHasRole(guildId, memberId, roleId);
        console.log("hasRole", hasRole)
        if(!hasRole) {
            await attachGuildMemberRole(guildId, memberId, roleId)
        }
       return res.status(200).json({ success: true })
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: e })
    }
}

const syncRoles = async (req, res) => {
    const { guildId } = req.params;
    const { daoId } = req.body
    try {
        await hasNecessaryPermissions(guildId);
        let guildRoles = await getGuildRoles(guildId);
        let guildMembers = await getGuildMembers(guildId);
        guildMembers = JSON.parse(JSON.stringify(guildMembers))
        await DAO.findOneAndUpdate({ _id: daoId }, {
            $set: { 
                [`discord.${guildId}.roles`]: guildRoles.filter(gr => gr.name !== '@everyone' && !_.get(gr, 'tags.botId', null)).map(gr => { return { id: gr.id, name: gr.name, roleColor: gr.color ? `#${gr.color.toString(16)}` : `#99aab5` } }),
                [`discord.${guildId}.members`]: guildMembers.map(gm => { return { userId: gm.userId, roles: gm.roles, displayName: gm.displayName } }),
            }
        })
        let daoIds = await DAO.find({ "links.link": { "$regex": guildId, "$options": "i" } })
        daoIds = daoIds.map(d => d._id)
        let proj = await Project.find({ "links.link": { "$regex": guildId, "$options": "i" } })
        daoIds = daoIds.concat(proj.map(p => p.daoId))
        daoIds = _.uniq(daoIds)
        daoIds.push(daoId)
        for (let index = 0; index < guildMembers.length; index++) {
            const guildMember = guildMembers[index];
            console.log(guildId, guildMember.roles)
            const up = await DAO.updateMany(
              {
                _id: { $in: daoIds },
                members: { $elemMatch: { $or: [{ "discordId": guildMember.userId }, { "discordId": guildMember.displayName }]} }
              }
              ,
              { $set: { [`members.$.discordRoles.${guildId}`] : guildMember.roles } }
           )
        }
        const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } });
        return res.status(200).json(d)
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: e })
    }
}


module.exports = { syncRoles, getDiscordGuild, getDiscordGuildRoles, createDiscordGuildRole, getInviteCode, checkMemberHasRole, addGuildMemberRole };
