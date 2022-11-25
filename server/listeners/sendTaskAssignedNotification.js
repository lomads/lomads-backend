const Notification = require('@server/modules/notification/notification.model');
const Member = require('@server/modules/member/member.model');
const ObjectId = require('mongodb').ObjectID;
const _ = require('lodash')

module.exports = {
  handle: async ({ $task, $member }) => {
    const name = _.get($member, 'name', '') === '' ? beautifyHexToken(_.get($member, 'wallet', '')) : _.get($member, 'name', '')
    const payload = {
        daoId: $task.daoId,
        task: $task._id,
        project: _.get($task, 'project._id', null),
        type: 'task:member.assigned',
        model: 'Task',
        title: $task.name,
        notification: `${name} has been <span class="bold">assigned</span> to ${$task.name}`,
        to: $member._id,
        metadata: { entityId: $task._id }
    }
    await Notification.create(payload)
  }
}