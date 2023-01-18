const AWS = require('@config/aws');
const config = require('@config/config');
const axios = require('axios');
const util = require('@metamask/eth-sig-util')
const Member = require('@server/modules/member/member.model');
const Metadata = require('@server/modules/metadata/metadata.model');
const { toChecksumAddress, checkAddressChecksum } = require('ethereum-checksum-address')
const ObjectId = require('mongodb').ObjectID;

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

  const syncMetadata = async (req, res) => {
    try {
        const members = await Member.find({})
        for (let index = 0; index < members.length; index++) {
            const member = members[index];
            const metaData = await Metadata.find({'attributes.value': toChecksumAddress(member.wallet) })
            const tokensId = metaData.map(m => ObjectId(m.contract))
            const metaDataId = metaData.map(m => ObjectId(m._id))
            console.log(tokensId)
            console.log(metaDataId)
            await Member.findOneAndUpdate(
                { _id: member._id },        
                //{ $set: { sbtTokens: [], sbtMetaData: [] } }     
                { $addToSet: { sbtTokens: { $each: tokensId }, sbtMetaData: { $each: metaDataId } } }
            )
        }
        return res.status(200).json(true)
    } catch (e) {
        console.log(e)
        return res.status(500).json(false)
    } 
  }
  
  module.exports = { getUploadURL, checkLomadsBot, encryptData, syncMetadata };