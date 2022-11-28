const Notification = require('@server/modules/notification/notification.model');
const ObjectId = require('mongodb').ObjectID;
const _ = require('lodash')


module.exports = {
  handle: async ({$task, $status = "Deleted"}) => {

    await Notification.deleteMany({ task: $task._id })

    console.log("$status", $status)

    const payload = {
        daoId: $task.daoId,
        task: $task._id,
        project: _.get($task, 'project._id', null),
        type: 'task:deleted',
        model: 'Task',
        title: $task.name,
        notification: `${$task.name} <span class="bold">${$status}</span>`,
        to: null,
        metadata: { entityId: $task._id }
    }
    const notification = new Notification(payload)
    await notification.save();
  }
}