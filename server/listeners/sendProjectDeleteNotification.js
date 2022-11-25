const Notification = require('@server/modules/notification/notification.model');

module.exports = {
  handle: async ($project) => {
    const payload = {
        daoId: $project.daoId,
        project: $project._id,
        type: 'project:deleted',
        model: 'Project',
        title: $project.name,
        notification: `<span className="bold">${$project.name}</span> deleted`,
        to: null,
        metadata: { entityId: $project._id }
    }
    const notification = new Notification(payload)
    await notification.save();
  }
}