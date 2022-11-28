const Notification = require('@server/modules/notification/notification.model');
const Member = require('@server/modules/member/member.model');
const ObjectId = require('mongodb').ObjectID;
const _ = require('lodash')

function beautifyHexToken(token) {
  return (token.slice(0, 6) + "..." + token.slice(-4))
}


module.exports = {
  handle: async ({ $task, $member }) => {
    const name = _.get($member , 'name', '') === '' ? beautifyHexToken(_.get($member , 'wallet', '')) : _.get($member , 'name', '')
    const payload = {
        daoId: $task.daoId,
        task: $task._id,
        project: _.get($task, 'project._id', null),
        type: 'task:submitted',
        model: 'Task',
        title: $task.name,
        notification: `Check ${name} <span class="bold">Submission</span>`,
        to: $task.creator,
        timeline: false,
        metadata: { entityId: $task._id }
    }
    await Notification.create(payload)
  }
}