const Notification = require('@server/modules/notification/notification.model');
const Member = require('@server/modules/member/member.model');
const ObjectId = require('mongodb').ObjectID;
const _ = require('lodash')

module.exports = {
  handle: async ($task) => {
    const payload = {
        daoId: $task.daoId,
        task: $task._id,
        project: _.get($task, 'project._id', null),
        type: 'task:member.applied',
        model: 'Task',
        title: $task.name,
        notification: `New <span class="bold">Applicant</span>`,
        to: $task.creator,
        metadata: { entityId: $task._id }
    }
    await Notification.create(payload)
  }
}