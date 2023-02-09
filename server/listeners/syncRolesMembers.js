const DAO = require('@server/modules/dao/dao.model')
const Project = require('@server/modules/project/project.model')
const _ = require('lodash');
const { getGuildRoles, getGuildMembers } = require('@services/discord');

module.exports = {
  handle: async ($data) => {
    const guildRoles = await getGuildRoles($data)
    console.log("guildRoles", guildRoles)
    let guildMembers = await getGuildMembers($data)
    guildMembers = JSON.parse(JSON.stringify(guildMembers))
    await DAO.updateMany({ [`discord.${$data}`]: { $ne: null } }, {
        $set: { 
            [`discord.${$data}.roles`]: guildRoles.filter(gr => gr.name !== '@everyone' && !_.get(gr, 'tags.botId', null)).map(gr => { return { id: gr.id, name: gr.name, roleColor: gr.color ? `#${gr.color.toString(16)}` : `#99aab5` } }),
            [`discord.${$data}.members`]: guildMembers.map(gm => { return { userId: gm.userId, roles: gm.roles, displayName: gm.displayName } })
        }
    })

    let daoIds = await DAO.find({
       "links.link": { "$regex": $data, "$options": "i" }
     })
    daoIds = daoIds.map(d => d._id)
    let proj = await Project.find({ "links.link": { "$regex": $data, "$options": "i" } })
    daoIds = daoIds.concat(proj.map(p => p.daoId))
    daoIds = _.uniq(daoIds)
    console.log(daoIds)
    for (let index = 0; index < guildMembers.length; index++) {
      const guildMember = guildMembers[index];
      console.log($data, guildMember.roles)
      await DAO.updateMany(
        {
          _id: { $in: daoIds },
          members: { $elemMatch: { $or: [{ "discordId": guildMember.userId }, { "discordId": guildMember.displayName }]} }
        }
        ,
        { $set: { [`members.$.discordRoles.${$data}`] : guildMember.roles } }
     )
  }
  }
}