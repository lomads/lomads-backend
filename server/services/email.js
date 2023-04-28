const config = require('@config/config')
const AWS = require('../../config/aws');

var ses = new AWS.SES({ region: config.aws.region });
  

const sendMail = async ({ to = [], template, from = 'alerts@lomads.xyz'}) => {
    var params = {
        Destination: {
          ToAddresses: to
        },
        Source: from,
        Message: {
          Body: {
           Html: {
            Charset: "UTF-8", 
            Data: template
           }, 
           Text: {
            Charset: "UTF-8", 
            Data: template
           }
          }, 
          Subject: {
           Charset: "UTF-8", 
           Data: "Mint successful"
          }
         }, 
        // Template: template,
        // TemplateData: JSON.stringify(data)
      };

      return new Promise((resolve, reject) => {
         ses.sendEmail(params, function(err, data) {
            if (err) {
                console.log(err);
                reject(err)
            }
            else {
                resolve(data)
                console.log(data);
            }
          });
      })
}

module.exports = { sendMail }
