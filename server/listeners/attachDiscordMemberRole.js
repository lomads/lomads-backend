const Project = require('@server/modules/project/project.model')
const _ = require('lodash');
const { attachRole } = require('@services/discord');

module.exports = {
  handle: async ($data) => {
    const { member, invite } = $data;
    let project = await Project.findOne({
        'links.link': `https://discord.com/channels/${invite.guild.id}/${invite.channelId}`
    })
    if(project){
        const roleId = _.get(_.find(project.links, l => l.link === `https://discord.com/channels/${invite.guild.id}/${invite.channelId}`), 'roleId', null)
        if(roleId) {
            await attachRole(invite.guild.id, roleId, member)
        }
    }
  }
}