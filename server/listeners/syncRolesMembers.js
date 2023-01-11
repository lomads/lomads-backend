const DAO = require('@server/modules/dao/dao.model')
const _ = require('lodash');
const { getGuildRoles, getGuildMembers } = require('@services/discord');

module.exports = {
  handle: async ($data) => {
    const guildRoles = await getGuildRoles($data)
    let guildMembers = await getGuildMembers($data)
    guildMembers = JSON.parse(JSON.stringify(guildMembers))
    const res = await DAO.updateMany({ [`discord.${$data}`]: { $ne: null } }, {
        $set: { 
            [`discord.${$data}.roles`]: guildRoles.map(gr => { return { id: gr.id, name: gr.name } }),
            [`discord.${$data}.members`]: guildMembers.map(gm => { return { userId: gm.userId, roles: gm.roles, displayName: gm.displayName } }),
        }
    })
    console.log(res)
  }
}