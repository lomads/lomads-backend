const Project = require('@server/modules/project/project.model')
const _ = require('lodash');

module.exports = {
  handle: async ($data) => {
    console.log($data)
    const { guild_id, channel_id } = $data;
    const url = `https://discord.com/channels/${guild_id}/${channel_id}`
    const projects = await Project.find({'links.link': url, archivedAt: null, deletedAt: null })
    if(projects && projects.length > 0){
      for (let index = 0; index < projects.length; index++) {
        const project = projects[index];
        project.links = project.links.map(l => {
            if (l.link === url)
                return { ...l, notification: _.get(l, 'notification', 0) + 1 }
            return l
        })
        await project.save();
      }
    }
  }
}