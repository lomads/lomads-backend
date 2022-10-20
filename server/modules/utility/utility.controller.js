const AWS = require('@config/AWS');
const config = require('@config/config');

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
  
  module.exports = { getUploadURL };