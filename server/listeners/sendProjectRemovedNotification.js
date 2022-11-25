const Notification = require('@server/modules/notification/notification.model');
const Member = require('@server/modules/member/member.model');
const ObjectId = require('mongodb').ObjectID;
const _ = require('lodash')

function beautifyHexToken(token) {
    return (token.slice(0, 6) + "..." + token.slice(-4))
}

module.exports = {
  handle: async ({ $project, $memberList }) => {
    const members = Member.find({ _id: { $in: $memberList.map(m => ObjectId(m)) } })
    let notifications = []
    for (let index = 0; index < members.length; index++) {
        const member = members[index];
        const name = _.get(mamber, 'name', '') === '' ? _.get(member, 'wallet', '') : _.get(mamber, 'name', '')
        const payload = {
            daoId: $project.daoId,
            project: $project._id,
            type: 'project:member:removed',
            model: 'Project',
            title: $project.name,
            notification: `${name} <span className="bold">removed</span> from ${$project.name}`,
            to: null,
            metadata: { entityId: $project._id }
        }
        notifications.push(payload)
    }
    await Notification.create(notifications)
  }
}