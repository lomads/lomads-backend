const AWS = require('@config/aws');
const config = require('@config/config');
const axios = require('axios');
const _ = require('lodash');
const util = require('@metamask/eth-sig-util')
const Notification = require('@server/modules/notification/notification.model');
const Member = require('@server/modules/member/member.model');
const Safe = require('@server/modules/safe/safe.model');
const Metadata = require('@server/modules/metadata/metadata.model');
const { toChecksumAddress, checkAddressChecksum } = require('ethereum-checksum-address')
const ObjectId = require('mongodb').ObjectID;

const CLIENT_ID = "8472b2207a0e12684382";
const CLIENT_SECRET = "03aea473a13431fdfea15a2dfe105d47701f30cb";

const Task = require('@server/modules/task/task.model');
const DAO = require('@server/modules/dao/dao.model')

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
    const { code, repoInfo } = req.query;
    const params = `?client_id=${config.githubClientId}&client_secret=${config.githubClientSecret}&code=${code}`;

    await fetch("https://github.com/login/oauth/access_token" + params, {
        method: 'POST',
        headers: {
            "Accept": "application/json"
        }
    })
        .then(response => response.json())
        .then(async (data) => {
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

const getIssues = async (req, res) => {
    const { token, repoInfo, daoId } = req.query;
    try {
        fetch(`https://api.github.com/repos/${repoInfo}/issues`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `token ${token}`
                }
            })
            .then((r) => {
                if (r.ok) {
                    return r.json();
                }
                else {
                    throw new Error("Not allowed!");
                }
            })
            .then(async issues => {
                var newArray = issues.map((i) => (
                    {
                        daoId: daoId,
                        provider: 'Github',
                        metaData: {
                            externalId: i.id.toString(),
                            repoUrl: new URL(i.html_url).origin + '/' + new URL(i.html_url).pathname.split("/")[1] + '/' + new URL(i.html_url).pathname.split("/")[2]
                        },
                        name: i.title,
                        description: i.body,
                        creator: null,
                        members: [],
                        project: null,
                        discussionChannel: i.html_url,
                        deadline: null,
                        submissionLink: i.html_url,
                        compensation: null,
                        reviewer: null,
                        contributionType: 'open',
                        createdAt: i.created_at,
                        draftedAt: Date.now(),
                    }
                ))
                return res.json({ data: newArray, message: 'success' });
            })
            .catch((e) => {
                console.log("request error : ", e);
                return res.json({ data: [], message: 'error' });
            })
    }
    catch (e) {
        console.log("try catch error : ", e)
    }
}

const storeIssues = async (req, res) => {
    const { token, repoInfo, daoId, issueList, linkOb } = req.body;
    const result = await createWebhook(token, repoInfo);

    if (result) {
        if (issueList.length > 0) {
            let arr = [];
            try {
                let insertMany = await Task.insertMany(issueList, async function (error, docs) {
                    for (let i = 0; i < docs.length; i++) {
                        arr.push(docs[i]._id);
                    }
                    if (arr.length > 0) {
                        const dao = await DAO.findOne({ _id: daoId });
                        if (dao) {

                            let tempLink = linkOb.link;
                            if (tempLink.indexOf('https://') === -1 && tempLink.indexOf('http://') === -1) {
                                tempLink = 'https://' + linkOb.link;
                            }

                            await DAO.findOneAndUpdate(
                                { _id: daoId },
                                {
                                    [`github.${repoInfo}`]: { 'webhookId': result.id.toString() },
                                    $addToSet: {
                                        tasks: { $each: arr },
                                        links: { title: linkOb.title, link: tempLink }
                                    },
                                }
                            )
                        }

                        const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: "owners members members.member tasks transactions project metadata" } })

                        return res.status(200).json({ dao: d });
                    }
                })
            }
            catch (e) {
                console.log("error : ", e);
            }
        }
        else {
            console.log("no issues present")
            const dao = await DAO.findOne({ _id: daoId });
            if (dao) {

                await DAO.findOneAndUpdate(
                    { _id: daoId },
                    {
                        [`github.${repoInfo}`]: { 'webhookId': result.id.toString() },
                    }
                )
            }

            const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: "owners members members.member tasks transactions project metadata" } })

            return res.status(200).json({ dao: d });
        }
    }
}

const issuesListener = async (req, res) => {
    const payload = req.body;
    console.log("github issue listener: ", payload);

    if (payload.action === 'opened') {
        let daoIds = await DAO.find({
            [`github.${payload.repository.full_name}`]: { $ne: null }
        })

        daoIds = daoIds.map(d => d._id);

        for (let i = 0; i < daoIds.length; i++) {
            // create task with daoId

            let task = new Task({
                daoId: daoIds[i],
                provider: 'Github',
                metaData: {
                    externalId: payload.issue.id.toString(),
                    repoUrl: new URL(payload.issue.html_url).origin + '/' + new URL(payload.issue.html_url).pathname.split("/")[1] + '/' + new URL(payload.issue.html_url).pathname.split("/")[2]
                },
                name: payload.issue.title,
                description: payload.issue.body,
                creator: null,
                members: [],
                project: null,
                discussionChannel: payload.issue.html_url,
                deadline: null,
                submissionLink: payload.issue.html_url,
                compensation: null,
                reviewer: null,
                contributionType: 'open',
                createdAt: payload.issue.created_at,
                draftedAt: Date.now(),
            })

            task = await task.save();
            if (task) {
                // update dao
                let dao = await DAO.findOne({ _id: daoIds[i] });
                if (dao) {
                    dao.tasks.push(task._id);
                    dao = await dao.save();
                }
            }
        }
    }

    else if (payload.action === 'reopened') {
        console.log("reopened");
        try {
            await Task.findOneAndUpdate(
                { "metaData.externalId": payload.issue.id.toString() },
                {
                    reopenedAt: Date.now(),
                    deletedAt: null
                }
            );
        } catch (error) {
            console.log("error : ", error)
        }
    }

    else if (payload.action === 'edited') {
        console.log("edited");
        try {
            await Task.updateMany(
                { "metaData.externalId": payload.issue.id.toString() },
                {
                    name: payload.issue.title,
                    description: payload.issue.body
                }
            )
        } catch (error) {
            console.log("error : ", error)
        }
    }

    else if (payload.action === 'closed') {
        console.log("closed");
        try {
            await Task.findOneAndUpdate(
                { "metaData.externalId": payload.issue.id.toString() },
                {
                    deletedAt: Date.now(),
                }
            );
        } catch (error) {
            console.log("error : ", error)
        }
    }

    // else if(payload.action === 'assigned'){}
    // else if(payload.action === 'deleted'){}
}

const createWebhook = async (token, repoInfo) => {
    let _body = {
        name: 'web',
        active: true,
        config: {
            url: `${config.baseUrlWithExt}/v1/utility/github/issues-listener`,
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

    try {
        return axios.post(`https://api.github.com/repos/${repoInfo}/hooks`, JSON.stringify(_body), {
            headers: {
                "Authorization": `token ${token}`,
                "cache-control": "no-cache"
            }
        })
            .then((response) => {
                return response.data;
            })
            .catch(async (e) => {
                console.log("error : ", typeof (e.response.status));
                if (e.response.status === 422) {
                    const dao = await DAO.findOne({ [`github.${repoInfo}`]: { $ne: null } });
                    if (dao) {
                        const githubOb = _.get(dao, 'github', null);
                        if (githubOb) {
                            if (_.get(dao, `github.${repoInfo}`, null)) {
                                return { id: _.get(dao, `github.${repoInfo}`, null).webhookId }
                            }
                            else {
                                console.log("doesnt exists")
                            }
                        }
                    }
                    else {
                        console.log("NF")
                    }
                }
            })
    } catch (error) {
        console.log("try catch error : ", e)
    }
}

module.exports = { getUploadURL, checkLomadsBot, encryptData, syncMetadata, createNotification, getGithubAccessToken, getUserData, getIssues, storeIssues, createWebhook, issuesListener };