const { getGuild, hasNecessaryPermissions, getGuildRoles, createGuildRole, createChannelInvite, memberHasRole, attachGuildMemberRole } = require('@services/discord');

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


module.exports = { getDiscordGuild, getDiscordGuildRoles, createDiscordGuildRole, getInviteCode, checkMemberHasRole, addGuildMemberRole };
