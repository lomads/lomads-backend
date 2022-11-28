const Notification = require('@server/modules/notification/notification.model');
const Member = require('@server/modules/member/member.model');
const ObjectId = require('mongodb').ObjectID;
const _ = require('lodash')

function beautifyHexToken(token) {
  return (token.slice(0, 6) + "..." + token.slice(-4))
}


module.exports = {
  handle: async ({ $dao, $members }) => {
    const notifications = []
    console.log("$members", $members)
    for (let index = 0; index < $members.length; index++) {
        const member = $members[index];
        const m = await Member.findOne({ _id: member })
        const name = _.get(m, 'name', '') === '' ? beautifyHexToken(_.get(m, 'wallet', '')) : _.get(m, 'name', '')
          const p = {
            daoId: $dao._id,
            type: 'dao:member.added',
            model: 'DAO',
            title: $dao.name,
            notification: `${name} <span class="bold">added</span> to ${$dao.name}`,
            to: null,
            metadata: { entityId: $dao._id }
          }
          notifications.push(p)
    }
    await Notification.create(notifications)
  }
}