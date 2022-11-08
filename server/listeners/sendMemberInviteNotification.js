const Notification = require('@server/modules/notification/notification.model');

module.exports = {
  handle: async ($event) => {
    const { project, members } = $event;
    const notifications = []
    for (let index = 0; index < members.length; index++) {
        const member = members[index];
        const p = {
            daoId: project.daoId,
            project: project._id,
            type: 'project:member.invited',
            model: 'Project',
            title: project.name,
            notification: `{{name}} <span className="bold">invited</span>`,
            to: member,
            metadata: { entityId: project._id }
        }
        notifications.push(p)
    }
    await Notification.create(notifications)
  }
}