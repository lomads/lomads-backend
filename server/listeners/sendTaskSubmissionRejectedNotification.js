const Notification = require('@server/modules/notification/notification.model');
const Member = require('@server/modules/member/member.model');
const ObjectId = require('mongodb').ObjectID;
const _ = require('lodash')

function beautifyHexToken(token) {
  return (token.slice(0, 6) + "..." + token.slice(-4))
}


module.exports = {
  handle: async ({ $task, $member }) => {
    console.log( $member )
    const name = _.get($member , 'name', '') === '' ? beautifyHexToken(_.get($member , 'wallet', '')) : _.get($member , 'name', '')
    const payload = {
        daoId: $task.daoId,
        task: $task._id,
        project: _.get($task, 'project._id', null),
        type: 'task:member.submission.rejected',
        model: 'Task',
        title: $task.name,
        notification: `${name} submission has been <span class="bold">rejected</span>`,
        to: $member._id,
        metadata: { entityId: $task._id }
    }
    await Notification.create(payload)
  }
}