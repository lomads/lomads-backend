const Notification = require('@server/modules/notification/notification.model');
const Member = require('@server/modules/member/member.model');
const ObjectId = require('mongodb').ObjectID;
const _ = require('lodash')

function beautifyHexToken(token) {
  return (token.slice(0, 6) + "..." + token.slice(-4))
}


module.exports = {
  handle: async ($task) => {
    const payload = {
        daoId: $task.daoId,
        task: $task._id,
        project: _.get($task, 'project._id', null),
        type: 'task:created',
        model: 'Task',
        title: $task.name,
        notification: `${$task.name} has been <span class="bold">created</span> ${ $task.project ? 'in ' + $task.project.name : '' }`,
        to: null,
        metadata: { entityId: $task._id }
    }
    const notification = new Notification(payload)
    await notification.save();

    if($task.taskStatus === 'assigned' && $task.members.length > 0) {
        const notifications = []
        for (let index = 0; index < $task.members.length; index++) {
            const member = $task.members[index];
            console.log(member)
            const name = _.get(member, 'member.name', '') === '' ? beautifyHexToken(_.get(member, 'member.wallet', '')) : _.get(member, 'member.name', '')
            if(member._id !== $task.creator) {
              const p = {
                daoId: $task.daoId,
                task: $task._id,
                project: _.get($task, 'project._id', null),
                type: 'task:member.assigned',
                model: 'Task',
                title: $task.name,
                notification: `${name} has been <span class="bold">assigned</span> to ${$task.name}`,
                to: member.member._id,
                metadata: { entityId: $task._id }
              }
              notifications.push(p)
            }
        }
        await Notification.create(notifications)
    }
  }
}