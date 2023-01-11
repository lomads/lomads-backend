const { getGuild, hasNecessaryPermissions, getGuildRoles, getGuildMembers, createGuildRole, createChannelInvite, memberHasRole, attachGuildMemberRole } = require('@services/discord');
const DAO = require('@server/modules/dao/dao.model');

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
                [`discord.${guildId}.roles`]: guildRoles.map(gr => { return { id: gr.id, name: gr.name } }),
                [`discord.${guildId}.members`]: guildMembers.map(gm => { return { userId: gm.userId, roles: gm.roles, displayName: gm.displayName } }),
            }
        })
        const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } });
        return res.status(200).json(d)
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: e })
    }
}


module.exports = { syncRoles, getDiscordGuild, getDiscordGuildRoles, createDiscordGuildRole, getInviteCode, checkMemberHasRole, addGuildMemberRole };
