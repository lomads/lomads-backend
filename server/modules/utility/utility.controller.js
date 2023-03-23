const AWS = require('@config/aws');
const config = require('@config/config');
const axios = require('axios');
const _ = require('lodash');
const moment = require('moment')
const util = require('@metamask/eth-sig-util')
const Notification = require('@server/modules/notification/notification.model');
const Member = require('@server/modules/member/member.model');
const Safe = require('@server/modules/safe/safe.model');
const Metadata = require('@server/modules/metadata/metadata.model');
const { toChecksumAddress, checkAddressChecksum } = require('ethereum-checksum-address')
const ObjectId = require('mongodb').ObjectID;
const { projectCreated } = require('@events')
const { find, get, uniqBy } = require('lodash');

const CLIENT_ID = "8472b2207a0e12684382";
const CLIENT_SECRET = "03aea473a13431fdfea15a2dfe105d47701f30cb";

const Task = require('@server/modules/task/task.model');
const Project = require('@server/modules/project/project.model');
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

    fetch("https://github.com/login/oauth/access_token" + params, {
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
                console.log("request error 280 : ", e);
                return res.json({ data: [], message: 'error' });
            })
    }
    catch (e) {
        console.log("try catch error 285 : ", e)
    }
}

const storeIssues = async (req, res) => {
    const { token, repoInfo, daoId, issueList, linkOb } = req.body;

    let tempLink = linkOb.link;
    if (tempLink.indexOf('https://') === -1 && tempLink.indexOf('http://') === -1) {
        tempLink = 'https://' + linkOb.link;
    }
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
                console.log("error 328: ", e);
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
                        $addToSet: {
                            links: { title: linkOb.title, link: tempLink }
                        },
                    }
                )
            }

            const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: "owners members members.member tasks transactions project metadata" } })

            return res.status(200).json({ dao: d });
        }
    }
    else {
        console.log("Cannot create webhook ... just pull issues");
        let arr = [];
        try {
            let insertMany = await Task.insertMany(issueList, async function (error, docs) {
                for (let i = 0; i < docs.length; i++) {
                    arr.push(docs[i]._id);
                }
                if (arr.length > 0) {
                    const dao = await DAO.findOne({ _id: daoId });
                    if (dao) {
                        await DAO.findOneAndUpdate(
                            { _id: daoId },
                            {
                                [`github.${repoInfo}`]: { 'webhookId': '' },
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
            console.log("error 328: ", e);
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
                updatedAt: Date.now()
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
                    $set: {
                        reopenedAt: moment().toDate(),
                        updatedAt: moment().toDate(),
                        deletedAt: null,
                        archivedAt: null
                    }
                }
            );
            const tsk = await Task.findOne({ "metaData.externalId": payload.issue.id.toString() })
            console.log(tsk)
        } catch (error) {
            console.log("error 420 : ", error)
        }
    }

    else if (payload.action === 'edited') {
        console.log("edited");
        try {
            await Task.updateMany(
                { "metaData.externalId": payload.issue.id.toString() },
                {
                    name: payload.issue.title,
                    description: payload.issue.body,
                    updatedAt: Date.now()
                }
            );
            const tsk = await Task.findOne({ "metaData.externalId": payload.issue.id.toString() })
            console.log(tsk)
        } catch (error) {
            console.log("error 438 : ", error)
        }
    }

    else if (payload.action === 'closed') {
        console.log("closed");
        try {
            await Task.findOneAndUpdate(
                { "metaData.externalId": payload.issue.id.toString() },
                {
                    $set: {
                        archivedAt: moment().toDate(),
                        updatedAt: moment().toDate()
                    }
                }
            );
            const tsk = await Task.findOne({ "metaData.externalId": payload.issue.id.toString() })
            console.log(tsk)
        } catch (error) {
            console.log("error 457 : ", error)
        }
    }

    else if (payload.action === 'deleted') {
        console.log("deleted");
        try {
            await Task.findOneAndUpdate(
                { "metaData.externalId": payload.issue.id.toString() },
                {
                    $set: {
                        deletedAt: moment().toDate(),
                        updatedAt: moment().toDate()
                    }
                }
            );
            const tsk = await Task.findOne({ "metaData.externalId": payload.issue.id.toString() })
            console.log(tsk)
        } catch (error) {
            console.log("error 476 : ", error)
        }
    }

    // else if(payload.action === 'assigned'){}
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
                "Authorization": `Bearer ${token}`,
                "cache-control": "no-cache"
            }
        })
            .then((response) => {
                return response.data;
            })
            .catch(async (e) => {
                console.log("517 response : ", e);
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
                                return null;
                            }
                        }
                    }
                    else {
                        console.log("NF");
                        return null;
                    }
                }
                else {
                    return null;
                }
            })
    } catch (error) {
        console.log("try catch error 537 : ", e)
    }
}


const getTrelloOrganization = async (req, res) => {
    const { accessToken } = req.query;
    try {
        // getting member information for all the organizations
        axios.get(`https://api.trello.com/1/members/me/?key=${config.trelloApiKey}&token=${accessToken}`)
            .then(async (response) => {
                if (response.data && response.data.idOrganizations.length > 0) {
                    let organizationArray = [];
                    let organizationIds = response.data.idOrganizations;
                    for (let i = 0; i < organizationIds.length; i++) {
                        let id = organizationIds[i];

                        // fetching organization one by one
                        const org = await axios.get(`https://api.trello.com/1/organizations/${id}?key=${config.trelloApiKey}&token=${accessToken}`);
                        if (org) {
                            organizationArray.push(org.data);
                        }
                    }
                    return res.json({ type: 'success', message: 'Organizations found', data: organizationArray });
                }
                else {
                    return res.json({ type: 'error', message: 'No organization found', data: null });
                }
            })
            .catch(async (e) => {
                console.log("error 567 : ", e);
                return res.json({ type: 'error', message: 'Something went wrong!', data: null });
            })
    } catch (error) {
        console.log("try catch error 571 : ", e)
    }
}

const getTrelloBoards = async (req, res) => {
    const { orgId, accessToken } = req.query;
    try {
        //fetching all the boards in an organization
        axios.get(`https://api.trello.com/1/organizations/${orgId}/boards?key=${config.trelloApiKey}&token=${accessToken}`)
            .then(async (response) => {
                if (response.data && response.data.length > 0) {
                    return res.json({ type: 'success', message: 'Boards found', data: response.data });
                }
                else {
                    return res.json({ type: 'error', message: 'No boards found', data: null });
                }
            })
            .catch(async (e) => {
                console.log("error 590 : ", e);
                return res.json({ type: 'error', message: 'Something went wrong!', data: null });
            })
    } catch (error) {
        console.log("try catch error 594 : ", e)
    }
}

const trelloListener = async (req, res) => {
    const payload = req.body;
    console.log("trello listener: ", payload);
    return res.status(200).json({ success: true });
}

const syncTrelloData = async (req, res) => {
    const { boardsArray, daoId,user, accessToken, idModel } = req.body;

    // {
    //     123456 : {
    //         webhookId:'13451356',
    //         boards:{
    //             7263762737:{webhookId:2e82y8u3}
    //             7263762737:{webhookId:2e82y8u3}
    //             7263762737:{webhookId:2e82y8u3}
    //         }
    //     }
    // }

    const result = await createTrelloWebhook(accessToken, idModel);
    if(result){
        // console.log("webhook created...getting all cards : ",result.id);
        await DAO.findOneAndUpdate(
            { _id: daoId },
            {
                [`trello.${idModel}`]: { 
                    'webhookId': result.id.toString(),
                    'boards':{}
                },
            }
        )

        for (let i = 0; i < boardsArray.length; i++){
        
            let board = boardsArray[i];
            console.log("Board",i+1);
            console.log("Board name & Id : ",board.name,board.id);

            let kraOb = {
                frequency : '',
                results : [],
                tracker: [{
                    start: moment().startOf('day').unix(),
                    end: moment().startOf('day').add(1,'month').endOf('day').unix(),
                    results: []
                }]
            }

            let project = new Project({
                daoId, 
                name : board.name, 
                description : board.desc, 
                members: [user.id], 
                tasks:[],
                links:[], 
                milestones:[], 
                compensation:null, 
                kra: kraOb, 
                creator: user.address, 
                inviteType:'Open', 
                validRoles:[]
            })
    
            project = await project.save();
            console.log("Project created...")
            
            const boardWebhook = await createTrelloWebhook(accessToken, board.id);
            if(boardWebhook){
                console.log("Board webhook created...");
                console.log("Fetching board cards...");
                let cardsArray = [];
                const cards = await axios.get(`https://api.trello.com/1/boards/${board.id}/cards?key=${config.trelloApiKey}&token=${accessToken}`);
                if(cards && cards.data && cards.data.length > 0){
                    console.log("Cards found...")
                    cardsArray = [...cardsArray,...cards.data];

                    var tasksArray = cardsArray.map((i) => (
                        {
                            daoId: daoId,
                            provider: 'Trello',
                            metaData: {
                                externalId: i.id.toString(),
                                cardUrl: i.url
                            },
                            name: i.name,
                            description: i.desc,
                            creator: null,
                            members: [],
                            project: project._id,
                            discussionChannel: i.url,
                            deadline: null,
                            submissionLink: i.url,
                            compensation: null,
                            reviewer: null,
                            contributionType: 'open',
                            createdAt: Date.now(),
                            draftedAt: Date.now(),
                        }
                    ))

                    // store draft task and update dao
                    let arr = [];
                    try {
                        let insertMany = await Task.insertMany(tasksArray, async function (error, docs) {
                            for (let i = 0; i < docs.length; i++) {
                                arr.push(docs[i]._id);
                            }
                            if (arr.length > 0) {
                                const dao = await DAO.findOne({ _id: daoId });
                                if (dao) {
                                    await DAO.findOneAndUpdate(
                                        { _id: daoId },
                                        {
                                            [`trello.${idModel}.boards.${board.id}`]: { 'webhookId': boardWebhook.id.toString() },
                                            $addToSet: {
                                                tasks: { $each: arr },
                                                projects: project._id
                                            },
                                        }
                                    )
                                }
                                await Project.findOneAndUpdate(
                                    { _id: project._id },
                                    {
                                        $addToSet: {
                                            tasks: { $each: arr },
                                        },
                                    }
                                )

                                const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: "owners members members.member tasks transactions project metadata" } })
                                //update metadata

                                let members = [user];

                                if (d.sbt) {
                                    for (let index = 0; index < members.length; index++) {
                                        const member = members[index];
                                        const filter = { 'attributes.value': { $regex: new RegExp(`^${member.address}$`, "i") }, contract: d.sbt._id }
                                        const metadata = await Metadata.findOne(filter)
                                        if (metadata) {
                                            let attrs = [...metadata._doc.attributes];
                                            if (!find(attrs, attr => attr.trait_type === 'projects')) {
                                                attrs.push({ trait_type: 'projects', value: project._id.toString() })
                                            } else {
                                                attrs = attrs.map(attr => {
                                                    if (attr.trait_type === 'projects') {
                                                        return { ...attr._doc, value: [...get(attr, 'value', '').split(','), project._id.toString()].join(',') }
                                                    }
                                                    return attr
                                                })
                                            }
                                            if (!find(attrs, attr => attr.trait_type === 'project_names')) {
                                                attrs.push({ trait_type: 'project_names', value: `${project.name} (${project._id})` })
                                            } else {
                                                attrs = attrs.map(attr => {
                                                    if (attr.trait_type === 'project_names') {
                                                        return { ...attr._doc, value: [...get(attr, 'value', '').toString().split(','), `${project.name} (${project._id})`].join(',') }
                                                    }
                                                    return attr
                                                })
                                            }
                                            console.log("attrs", attrs);
                                            metadata._doc.attributes = attrs;
                                            await metadata.save();
                                        }
                                    }
                                }
                                projectCreated.emit(project)
                                
                            }
                        })
                    }
                    catch (e) {
                        console.log("error 710: ", e);

                    }
                } 
                
                else{
                    console.log("No cards found in the board...simply update dao")
                    const dao = await DAO.findOne({ _id: daoId });
                    if (dao) {
                        await DAO.findOneAndUpdate(
                            { _id: daoId },
                            {
                                [`trello.${idModel}.boards.${board.id}`]: { 'webhookId': boardWebhook.id.toString() },
                                $addToSet: {
                                    projects: project._id
                                },
                            }
                        )
                    }

                    const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: "owners members members.member tasks transactions project metadata" } })
                    //update metadata

                    let members = [user];

                    if (d.sbt) {
                        for (let index = 0; index < members.length; index++) {
                            const member = members[index];
                            const filter = { 'attributes.value': { $regex: new RegExp(`^${member.address}$`, "i") }, contract: d.sbt._id }
                            const metadata = await Metadata.findOne(filter)
                            if (metadata) {
                                let attrs = [...metadata._doc.attributes];
                                if (!find(attrs, attr => attr.trait_type === 'projects')) {
                                    attrs.push({ trait_type: 'projects', value: project._id.toString() })
                                } else {
                                    attrs = attrs.map(attr => {
                                        if (attr.trait_type === 'projects') {
                                            return { ...attr._doc, value: [...get(attr, 'value', '').split(','), project._id.toString()].join(',') }
                                        }
                                        return attr
                                    })
                                }
                                if (!find(attrs, attr => attr.trait_type === 'project_names')) {
                                    attrs.push({ trait_type: 'project_names', value: `${project.name} (${project._id})` })
                                } else {
                                    attrs = attrs.map(attr => {
                                        if (attr.trait_type === 'project_names') {
                                            return { ...attr._doc, value: [...get(attr, 'value', '').toString().split(','), `${project.name} (${project._id})`].join(',') }
                                        }
                                        return attr
                                    })
                                }
                                console.log("attrs", attrs);
                                metadata._doc.attributes = attrs;
                                await metadata.save();
                            }
                        }
                    }
                    projectCreated.emit(project)
                }
            }
        }

        const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: "owners members members.member tasks transactions project metadata" } })

        return res.status(200).json({ dao: d });

    }
}

const createTrelloWebhook = async (accessToken, idModel) => {
    let callbackURL = `${config.baseUrlWithExt}/v1/utility/trello/trello-listener`;
    try{
        return axios.post(`https://api.trello.com/1/webhooks/?callbackURL=${callbackURL}&idModel=${idModel}&key=${config.trelloApiKey}&token=${accessToken}`)
        .then((response) => {
            console.log("667 response : ",response);
            return response.data;
        })
        .catch(async (e) => {
            console.log("673 error response : ", e);
            return null;
        })
    }
    catch (error) {
        console.log("try catch error 678 : ", e)
    }
}

module.exports = {
    getUploadURL,
    checkLomadsBot,
    encryptData,
    syncMetadata,
    createNotification,
    getGithubAccessToken,
    getIssues,
    storeIssues,
    createWebhook,
    issuesListener,
    getTrelloOrganization,
    getTrelloBoards,
    trelloListener,
    syncTrelloData
};
