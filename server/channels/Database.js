const Notification = require("@server/modules/notification/notification.model")

const Database = {
  handle: async params => {
      try {
        let notification = new Notification(params)
        await notification.save();
      } catch (e) {
        console.log('Err::channels/Database', e)
        resolve({ success: false, result: e.message || 'Error while inserting notification to database' })
      }
  }
}

module.exports = Database