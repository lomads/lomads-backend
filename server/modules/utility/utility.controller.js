const AWS = require('@config/aws');
const config = require('@config/config');
const axios = require('axios');
const util = require('@metamask/eth-sig-util')

const getUploadURL = async (req, res, next) => {
    try {
        const { key, mime } = req.body;
        var s3 = new AWS.S3({ signatureVersion: 'v4' });
        const params = { Bucket: config.aws.s3Bucket, Key: key, Expires: 60 * 10, ACL: 'public-read', ContentType: mime};
        const url = await s3.getSignedUrlPromise('putObject', params)
        if(url)
            return res.status(200).json({signedUrl: url})
    } catch (e){
        console.log(e)
        return res.status(500).json({ message: "Something went wrong"})
    }
  }

  const checkLomadsBot = async (req, res ) => {
    const { server } = req.body;
    try {
        axios.get(`https://discord.com/api/v10/guilds/${server}`, {
            headers: {
                Authorization: 'Bot MTAzNjUxMDA0MTI4NjYzOTY1Ng.G0uJ7N.ufvt5XOLRq4RKG_caFGcAhvAqe4ehqQjxHdtW0'
            }
        })
        .then(result => { 
            console.log(result.data)
            return res.status(200).json(true)
        })
        .catch(e => {
            console.log(e)
            return res.status(200).json(false)
        })
    } catch (e) {
        console.log(e)
        return res.status(200).json(false)
    }
  }

  const encryptData = (req, res) => {
    const { publicKey, data } = req.body
    try {
        const encryptedMessage = Buffer.from(
            JSON.stringify(
            util.encrypt({
                publicKey: publicKey,
                data: data,
                version: 'x25519-xsalsa20-poly1305',
              })
            ),
            'utf8'
      ).toString('hex')
      return res.status(200).json({ message: encryptedMessage })
    } catch (e) {
        console.log(e)
        return res.status(200).json(false)
    }
        
  }
  
  module.exports = { getUploadURL, checkLomadsBot, encryptData };