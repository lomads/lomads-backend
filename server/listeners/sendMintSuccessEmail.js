const _ = require('lodash');
const { sendMail } = require('../services/email');
const template = require('../../views/emailTemplates/mint')

module.exports = {
  handle: async ($data) => {
    console.log($data)
    try {
        console.log($data)
        await sendMail({
            to: $data.to,
            template: template($data.data)
        })
    } catch (e) {
      console.log(e)
    }
  }
}