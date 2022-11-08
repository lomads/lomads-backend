const Notification = require('@server/modules/notification/notification.model');

module.exports = {
  handle: async ($project) => {
    const payload = {
        daoId: $project.daoId,
        project: $project._id,
        type: 'project:created',
        model: 'Project',
        title: $project.name,
        notification: `<span className="bold">${$project.name}</span> created`,
        to: null,
        metadata: { entityId: $project._id }
    }
    const notification = new Notification(payload)
    await notification.save();

    const notifications = []
    for (let index = 0; index < $project.members.length; index++) {
        const member = $project.members[index];
        const p = {
            daoId: $project.daoId,
            project: $project._id,
            type: 'project:member.added',
            model: 'Project',
            title: $project.name,
            notification: `{{name}} <span className="bold">invited</span>`,
            to: member,
            metadata: { entityId: $project._id }
        }
        notifications.push(p)
    }
    await Notification.create(notifications)
  }
}