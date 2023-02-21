const AWS = require('@config/aws');
const config = require('@config/config');
const axios = require('axios');
const util = require('@metamask/eth-sig-util')
const Notification = require('@server/modules/notification/notification.model');
const Member = require('@server/modules/member/member.model');
const Safe = require('@server/modules/safe/safe.model');
const Metadata = require('@server/modules/metadata/metadata.model');
const { toChecksumAddress, checkAddressChecksum } = require('ethereum-checksum-address')
const ObjectId = require('mongodb').ObjectID;

const CLIENT_ID = "8472b2207a0e12684382";
const CLIENT_SECRET = "03aea473a13431fdfea15a2dfe105d47701f30cb";

function beautifyHexToken(token) {
    return (token.slice(0, 6) + "..." + token.slice(-4))
}

const getUploadURL = async (req, res, next) => {
    try {
        const { key, mime } = req.body;
        var s3 = new AWS.S3({ signatureVersion: 'v4' });
        const params = { Bucket: config.aws.s3Bucket, Key: key, Expires: 60 * 10, ACL: 'public-read', ContentType: mime };
        const url = await s3.getSignedUrlPromise('putObject', params)
        if (url)
            return res.status(200).json({ signedUrl: url })
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: "Something went wrong" })
    }
}

const checkLomadsBot = async (req, res) => {
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
            const metaData = await Metadata.find({ 'attributes.value': toChecksumAddress(member.wallet) })
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

const createNotification = async (req, res) => {
    const { event, safeAddress, account } = req.body;
    try {
        if (event === 'transaction:execution.required') {
            const safe = await Safe.findOne({ address: safeAddress }).populate({ path: 'owners' })
            const notifications = []
            for (let index = 0; index < safe.owners.length; index++) {
                const p = {
                    daoId: safe.dao,
                    type: event,
                    model: 'Transaction',
                    title: 'Transaction',
                    notification: `Transaction needs <span class="bold">Execution</span>`,
                    to: safe.owners[index]._id,
                    timeline: false,
                    metadata: { entityId: safeAddress }
                }
                notifications.push(p)
            }
            await Notification.create(notifications)

            const creator = await Member.findOne({ wallet: account })
            let name = creator.name && creator.name !== '' ? creator.name : beautifyHexToken(account)
            const payload = {
                daoId: safe.dao,
                type: event,
                model: 'Transaction',
                title: 'Transaction',
                notification: `${name} <span class="bold">created</span> a transaction`,
                to: null,
                metadata: { entityId: safeAddress }
            }
            await Notification.create(payload)

        } else if (event === 'transaction:confirmation.required') {
            const safe = await Safe.findOne({ address: safeAddress }).populate({ path: 'owners' })
            console.log(safe)
            const notifications = []
            for (let index = 0; index < safe.owners.length; index++) {
                const p = {
                    daoId: safe.dao,
                    type: event,
                    model: 'Transaction',
                    title: 'Transaction',
                    notification: `Transaction needs <span class="bold">Confirmation</span>`,
                    timeline: false,
                    to: safe.owners[index]._id,
                    metadata: { entityId: safeAddress }
                }
                notifications.push(p)
            }
            await Notification.create(notifications)
            const creator = await Member.findOne({ wallet: account })
            let name = creator.name && creator.name !== '' ? creator.name : beautifyHexToken(account)
            const payload = {
                daoId: safe.dao,
                type: event,
                model: 'Transaction',
                title: 'Transaction',
                notification: `${name} <span class="bold">created</span> a transaction`,
                to: null,
                metadata: { entityId: safeAddress }
            }
            await Notification.create(payload)
        } else if (event === 'transaction:executed') {
            const safe = await Safe.findOne({ address: safeAddress }).populate({ path: 'owners' })
            const creator = await Member.findOne({ wallet: account })
            let name = creator.name && creator.name !== '' ? creator.name : beautifyHexToken(account)
            const payload = {
                daoId: safe.dao,
                type: event,
                model: 'Transaction',
                title: 'Transaction',
                notification: `${name} <span class="bold">executed</span> a transaction`,
                to: null,
                metadata: { entityId: safeAddress }
            }
            await Notification.create(payload)
        } else if (event === 'transaction:confirmed') {
            const safe = await Safe.findOne({ address: safeAddress }).populate({ path: 'owners' })
            const creator = await Member.findOne({ wallet: account })
            let name = creator.name && creator.name !== '' ? creator.name : beautifyHexToken(account)
            const payload = {
                daoId: safe.dao,
                type: event,
                model: 'Transaction',
                title: 'Transaction',
                notification: `${name} <span class="bold">confirmed</span> a transaction`,
                to: null,
                metadata: { entityId: safeAddress }
            }
            await Notification.create(payload)
        } else if (event === 'transaction:rejected') {
            const safe = await Safe.findOne({ address: safeAddress }).populate({ path: 'owners' })
            const creator = await Member.findOne({ wallet: account })
            let name = creator.name && creator.name !== '' ? creator.name : beautifyHexToken(account)
            const payload = {
                daoId: safe.dao,
                type: event,
                model: 'Transaction',
                title: 'Transaction',
                notification: `${name} <span class="bold">rejected</span> a transaction`,
                to: null,
                metadata: { entityId: safeAddress }
            }
            await Notification.create(payload)
        }
        return res.status(200).json(true)
    } catch (e) {
        console.log(e)
        return res.status(500).json(false)
    }
}

const getGithubAccessToken = async (req, res) => {
    console.log("Hello")
    const { code } = req.query;
    const params = `?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${code}`;

    await fetch("https://github.com/login/oauth/access_token" + params, {
        method: 'POST',
        headers: {
            "Accept": "application/json"
        }
    }).then((response) => {
        return response.json();
    }).then(async (data) => {
        console.log("data : ", data);
        await fetch(`https://api.github.com/repos/Lomads-Technologies/soulbound-token/issues`,
            {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `token ${data.access_token}`
                }
            })
            .then(r => r.json())
            .then(d => {
                console.log("github issues : ", d);
            })
        return res.json(data);
    })
}

const getUserData = async (req, res) => {
    await fetch("https://api.github.com/user", {
        method: 'GET',
        headers: {
            "Authorization": req.get("Authorization")
        }
    }).then((response) => {
        return response.json();
    }).then((data) => {
        return res.json(data);
    })
}

const issuesListener = async (req, res) => {
    console.log("github issue listener: ", req.body);
}

const createWebhook = async (req, res) => {
    const { token, repoInfo } = req.body;
    console.log("repo info : ", repoInfo)
    let _body = {
        name: 'web',
        active: true,
        config: {
            url: "https://f06e-202-142-103-104.in.ngrok.io/v1/utility/github/issues-listener",
            content_type: 'json',
            insecure_ssl: '0'
        },
        events: [
            "issues",
            "issue_comment",
            "pull_request",
            "pull_request_review",
            "pull_request_review_comment",
            "commit_comment",
            "push",
            "release",
            "create",
            "delete"
        ]
    }

    axios.post(`https://api.github.com/repos/Lomads-Technologies/soulbound-token/hooks`, JSON.stringify(_body), {
        headers: {
            "Authorization": `token ${token}`,
            "cache-control": "no-cache"
        }
    })
        .then((response) => {
            res.json(response.data);
        })
        .catch(e => {
            console.log("error : ", e);
            res.status(500).json(e);
        })
}

module.exports = { getUploadURL, checkLomadsBot, encryptData, syncMetadata, createNotification, getGithubAccessToken, getUserData, createWebhook, issuesListener };