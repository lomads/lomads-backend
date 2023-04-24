const _ = require('lodash');
const axios = require('axios');
const DAO = require('@server/modules/dao/dao.model')
const Task = require('@server/modules/task/task.model')
const Project = require('@server/modules/project/project.model')
const Member = require('@server/modules/member/member.model')
const Safe = require('@server/modules/safe/safe.model')
const ObjectId = require('mongodb').ObjectID;
const { daoMemberAdded } = require('@server/events');
const moment = require('moment')
const { toChecksumAddress, checkAddressChecksum } = require('ethereum-checksum-address')
const { getGuild, hasNecessaryPermissions, getGuildRoles, getGuildMembers, createGuildRole, createChannelInvite, memberHasRole, attachGuildMemberRole } = require('@services/discord');
const { date } = require('joi');

const loadAll = async (req, res) => {
    const { skip = 0, limit = 50 } = req.query;
    const dao = await DAO.find({ deletedAt: null })
        .lean()
        .populate({ path: 'safe projects' })
        .sort({ createdAt: -1 })
        .skip(+skip)
        .limit(+limit)
        .exec()
    const total = await DAO.countDocuments({ deletedAt: null });
    const data = { data: dao, itemCount: total, totalPages: total > limit ? Math.ceil(total / limit) : 1 };
    return res.status(200).json(data)
}

const load = async (req, res) => {
    const { _id } = req.user;
    const { chainId = 5 } = req.query;
    try {
        const dao = await DAO.find({ deletedAt: null, 'members.member': { $in: [ObjectId(_id)] } }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } }).exec()
        console.log("DAO : ", dao);
        return res.status(200).json(dao)
    }
    catch (e) {
        console.error("dao.controller::load::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const create = async (req, res, next) => {
    const { _id, wallet } = req.user;
    const { contractAddress = "", url = null, name, description = null, image, members = [], safe = null, chainId = 5 } = req.body;
    if (!name)
        return res.status(400).json({ message: 'Organisation name is required' })
    let mMembers = []
    try {
        for (let index = 0; index < members.length; index++) {
            const member = members[index];
            const filter = { wallet: { $regex: new RegExp(`^${member.address}$`, "i") } }
            let m = await Member.findOne(filter);
            if (!m) {
                m = new Member({ wallet: toChecksumAddress(member.address), name: member.name })
                m = await m.save();
            }
            console.log(m)
            //const m = await Member.findOneAndUpdate(filter, { wallet: member.address }, { new: true, upsert: true })
            mMembers.push({ ...m, _doc: { ...m._doc, role: member.role } })
        }
        mMembers = mMembers.map(m => m._doc)
        let newSafe = null;
        let O = [];
        if (safe) {
            let { name, address, owners } = safe;
            O = owners.map(o => o.toLowerCase())
            newSafe = new Safe({ chainId: safe?.chainId, name, address: address, owners: mMembers.filter(m => O.indexOf(m.wallet.toLowerCase()) > -1).map(m => m._id) })
            newSafe = await newSafe.save();
        }

        let mem = mMembers.map(m => {
            return { member: m._id, creator: _.find(members, mem => mem.address.toLowerCase() === m.wallet.toLowerCase()).creator, role: _.get(m, 'role', 'role4') }
        })

        let daoURL = url;

        let dao = new DAO({
            contractAddress,
            url: daoURL,
            name,
            description,
            image,
            members: mem,
            safe: newSafe._id,
            chainId,
            dummyProjectFlag: true,
            dummyTaskFlag: true,
        })

        dao = await dao.save();

        let kraOb = {
            frequency: '',
            results: [],
            tracker: [{
                start: moment().startOf('day').unix(),
                end: moment().startOf('day').add(1, 'month').endOf('day').unix(),
                results: []
            }]
        }

        let project = new Project({
            daoId: dao._id,
            isDummy: true,
            provider: 'Lomads',
            name: 'Dummy Workspace',
            description: "To discover Lomad's system",
            members: [_id],
            tasks: [],
            links: [],
            milestones: [],
            compensation: null,
            kra: kraOb,
            creator: wallet,
            inviteType: 'Open',
            validRoles: []
        })

        project = await project.save();

        let task1 = new Task({
            daoId: dao._id,
            isDummy: true,
            name: 'Dummy Task 1',
            description: '',
            creator: _id,
            members: [],
            project: project._id,
            discussionChannel: '',
            deadline: null,
            submissionLink: '',
            compensation: null,
            reviewer: _id,
            contributionType: 'open',
            createdAt: Date.now(),
        })

        task1 = await task1.save();

        let task2 = new Task({
            daoId: dao._id,
            isDummy: true,
            name: 'Dummy Task 2',
            description: '',
            creator: _id,
            members: [],
            project: project._id,
            discussionChannel: '',
            deadline: null,
            submissionLink: '',
            compensation: null,
            reviewer: _id,
            contributionType: 'open',
            createdAt: Date.now(),
        })

        task2 = await task2.save();

        await DAO.findOneAndUpdate(
            { _id: dao._id },
            {
                $addToSet: {
                    tasks: { $each: [task1._id, task2._id] },
                    projects: project._id
                },
            }
        )
        await Project.findOneAndUpdate(
            { _id: project._id },
            {
                $addToSet: {
                    tasks: { $each: [task1._id, task2._id] },
                },
            }
        )
        console.log("DAO and project updated...");

        await Safe.findByIdAndUpdate(newSafe._id, { dao: dao._id }, { new: true })

        return res.status(200).json({ message: 'DAO created successfully' })
    }
    catch (e) {
        console.error("dao.controller::create::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const updateDetails = async (req, res) => {
    const { url } = req.params;
    try {

        let dao = await DAO.findOne({ deletedAt: null, url });
        if (!dao)
            return res.status(404).json({ message: 'DAO not found' })

        await DAO.findOneAndUpdate(
            { deletedAt: null, url },
            { ...req.body }
        )

        console.log("REQ BODY : ", req.body);

        const d = await DAO.findOne({ url }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        return res.status(200).json(d);
    }
    catch (e) {
        console.error("dao.updateDaoDetails::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const getByUrl = async (req, res) => {
    const { url } = req.params;
    try {
        const dao = await DAO.findOne({ url }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        if (!dao)
            return res.status(404).json({ message: 'DAO not found' })
        return res.status(200).json(dao)
    }
    catch (e) {
        console.error("dao.controller::get::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const addDaoMember = async (req, res) => {

    const { _id } = req.user;
    const { url } = req.params;
    const { name, address, role = "role4" } = req.body;

    try {
        //const dao = await DAO.findOne({ deletedAt: null, url, 'members.member': { $in: [ObjectId(_id)] } })
        const dao = await DAO.findOne({ deletedAt: null, url })
        if (!dao)
            return res.status(404).json({ message: 'DAO not found' })

        const filter = { wallet: { $regex: new RegExp(`^${address}$`, "i") } }
        let m = await Member.findOne(filter);
        if (!m) {
            m = new Member({ wallet: toChecksumAddress(address), name })
            m = await m.save();
        }
        const userExistInDao = await DAO.findOne({ deletedAt: null, url, 'members.member': { $in: [m._id] } })
        if (userExistInDao)
            return res.status(500).json({ message: 'Member already exists in DAO' })

        await DAO.findOneAndUpdate(
            { _id: dao._id },
            { $addToSet: { members: { member: m._id, creator: false, role } } }
        )
        const d = await DAO.findOne({ url }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        daoMemberAdded.emit({ $dao: d, $members: [m._id] })
        return res.status(200).json(d)
    }
    catch (e) {
        console.error("dao.addDaoMember::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const createOption = async (req, res) => {

    const { url } = req.params;
    const { newOption } = req.body;

    try {
        await DAO.findOneAndUpdate(
            { url },
            { $addToSet: { options: newOption } }
        )
        const d = await DAO.findOne({ url }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        return res.status(200).json(d)
    }
    catch (e) {
        console.error("dao.addDaoMember::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const addDaoMemberList = async (req, res) => {
    const { url } = req.params;
    const { list } = req.body;

    let mMembers = [];
    try {
        const dao = await DAO.findOne({ deletedAt: null, url })
        if (!dao)
            return res.status(404).json({ message: 'DAO not found' })

        for (let i = 0; i < list.length; i++) {
            let user = list[i];

            const filter = { wallet: { $regex: new RegExp(`^${user.address}$`, "i") } }
            let m = await Member.findOne(filter);
            if (!m) {
                m = new Member({ wallet: toChecksumAddress(user.address), name: user.name })
                m = await m.save();
            }
            mMembers.push({ ...m, _doc: { ...m._doc, role: user.role } })
        }

        mMembers = mMembers.map(m => m._doc);

        let mem = mMembers.map(m => {
            return { member: m._id, creator: false, role: _.get(m, 'role', 'role4') }
        })

        await DAO.findOneAndUpdate(
            { deletedAt: null, url },
            {
                $addToSet: { members: { $each: mem } },
            }
        )

        //daoMemberAdded.emit({ $dao: d, $members: mem.map(m => m._id) })

        const d = await DAO.findOne({ url }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } });
        daoMemberAdded.emit({ $dao: d, $members: mMembers.map(m => m._id) })
        return res.status(200).json(d);

    }
    catch (e) {
        console.error("dao.addDaoMemberList::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const manageDaoMember = async (req, res) => {
    const { url } = req.params;
    const { deleteList, updateList } = req.body;

    console.log("Deleted array : ", deleteList)
    console.log("updated array : ", updateList)

    try {
        const dao = await DAO.findOne({ deletedAt: null, url })
        if (!dao)
            return res.status(404).json({ message: 'DAO not found' })

        // let members = dao.members;
        let members = [];
        console.log("members before : ", members);
        for (var i = 0; i < dao.members.length; i++) {
            var user = dao.members[i];

            // if included in delete array
            if (deleteList.includes(user.member.toString())) {
                console.log(user.member, " to be deleted")
                // members.splice(i, 1);
            }

            // if included in update array
            else if (updateList.some((ob) => ob.id === user._id.toString()) === true && deleteList.includes(user.member.toString()) === false) {
                console.log(user, " to be updated")
                const index = updateList.map(object => object.id).indexOf(user._id.toString());
                // members[i].role = updateList[index].role.toString();
                user.role = updateList[index].role.toString();
                members.push(user);
            }

            else {
                members.push(user);
            }
        }
        console.log("members after : ", members);
        await DAO.findOneAndUpdate({ url }, { members });

        const d = await DAO.findOne({ url }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } });
        return res.status(200).json(d);
    }

    catch (e) {
        console.error("dao.manageDaoMember::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const addDaoLinks = async (req, res) => {
    const { url } = req.params;
    const { title, link } = req.body;
    console.log("link details : ", title, link);
    try {

        let dao = await DAO.findOne({ deletedAt: null, url });
        if (!dao)
            return res.status(404).json({ message: 'DAO not found' })

        dao.links.push({ title, link });
        dao = await dao.save();

        const d = await DAO.findOne({ url }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        return res.status(200).json(d);
    }
    catch (e) {
        console.error("dao.addDaoLinks::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const updateDaoLinks = async (req, res) => {
    const { url } = req.params;
    const { links } = req.body;
    console.log("links : ", links);
    try {

        let dao = await DAO.findOne({ deletedAt: null, url });
        if (!dao)
            return res.status(404).json({ message: 'DAO not found' })

        let tempArray = [];
        for (var i = 0; i < links.length; i++) {
            let tempLink = links[i];
            if (tempLink.link.indexOf('https://') === -1 && tempLink.link.indexOf('http://') === -1) {
                tempLink.link = 'https://' + tempLink.link;
            }
            tempArray.push(tempLink);
        }

        await DAO.findOneAndUpdate(
            { deletedAt: null, url },
            { links: tempArray }
        )

        const d = await DAO.findOne({ url }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        return res.status(200).json(d);
    }
    catch (e) {
        console.error("dao.addDaoLinks::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const deleteDaoLink = async (req, res) => {
    const { url } = req.params;
    const { link, repoInfo, webhookId, token } = req.body;
    try {

        let dao = await DAO.findOne({ deletedAt: null, url });
        if (!dao)
            return res.status(404).json({ message: 'DAO not found' })

        // remove link from the array
        let linkArray = [...dao.links];
        linkArray = linkArray.filter((item) => item.link !== link.link);
        // remove repoInfo from github object
        let githubOb = { ...dao.github };
        delete githubOb[`${repoInfo}`];

        let daoIds = await DAO.find({
            [`github.${repoInfo}`]: { $ne: null }
        })

        daoIds = daoIds.map(d => d._id);

        if (daoIds.length === 1) {
            // delete webhook
            console.log("only one dao");
            await axios.delete(`https://api.github.com/repos/${repoInfo}/hooks/${webhookId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "cache-control": "no-cache"
                }
            })
                .then((r) => {
                    console.log("340 r : ", r);
                })
                .catch((e) => {
                    console.log("343 e : ", e);
                })
        }

        try {
            await DAO.findOneAndUpdate(
                { url },
                {
                    links: linkArray,
                    github: githubOb
                }
            )
        }
        catch (e) {
            console.log("error : ", e);
        }

        const d = await DAO.findOne({ url }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        return res.status(200).json(d);
    }
    catch (e) {
        console.error("dao.deleteDaoLink::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const updateSweatPoints = async (req, res) => {
    const { url } = req.params;
    const { status } = req.body;
    try {
        await DAO.findOneAndUpdate({ url }, { sweatPoints: status })
        const d = await DAO.findOne({ url }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        return res.status(200).json(d);
    }
    catch (e) {
        console.error("dao.updateSweatPoints::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const syncSafeOwners = async (req, res) => {
    const { url } = req.params;
    const owners = req.body;
    const dao = await DAO.findOne({ url }).populate({ path: 'members.member', populate: { path: 'owners members members.member' } })
    if (!dao)
        return res.status(404).json({ message: 'DAO not found' })
    let members = []
    for (let index = 0; index < dao.members.length; index++) {
        let member = dao.members[index];
        if (member.role === 'role1') {
            if (owners.indexOf(toChecksumAddress(member.member.wallet)) === -1) {
                member.role = 'role4'
            }
        } else {
            if (owners.indexOf(toChecksumAddress(member.member.wallet)) > -1) {
                member.role = 'role1'
            }
        }
        members.push(member)
    }
    dao.members = members;
    await dao.save();

    for (let index = 0; index < owners.length; index++) {
        const owner = owners[index];
        let exists = _.find(members, m => toChecksumAddress(m.member.wallet) === owner)
        if (!exists) {
            const filter = { wallet: { $regex: new RegExp(`^${owner}$`, "i") } }
            let m = await Member.findOne(filter);
            if (!m) {
                m = new Member({ wallet: toChecksumAddress(owner), name: '' })
                m = await m.save();
            }
            await DAO.findOneAndUpdate(
                { _id: dao._id },
                { $addToSet: { members: { member: m._id, creator: false, role: 'role1' } } }
            )
        }
    }

    let iMembers = await Member.find({ wallet: { $in: owners.map(o => toChecksumAddress(o)) } })
    await Safe.updateOne({ dao: dao._id }, { owners: iMembers })

    const d = await DAO.findOne({ url }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
    return res.status(200).json(d);
}

const updateUserDiscord = async (req, res) => {
    try {
        const { url } = req.params;
        const { userId, discordId, daoId } = req.body;
        let dao = await DAO.findOne({ url })
        if (!dao)
            return res.status(404).json({ message: 'DAO not found' })
        await DAO.findOneAndUpdate(
            {
                url: url,
                members: { $elemMatch: { member: userId } }
            },
            { $set: { "members.$.discordId": discordId } }
        )

        for (let index = 0; index < dao.links.length; index++) {
            const link = dao.links[index];
            if (link.link.indexOf('discord.') > -1) {
                const url = new URL(link.link)
                const guildId = url.pathname.split('/')[2]
                await hasNecessaryPermissions(guildId);
                let guildRoles = await getGuildRoles(guildId);
                let guildMembers = await getGuildMembers(guildId);
                guildMembers = JSON.parse(JSON.stringify(guildMembers))
                await DAO.findOneAndUpdate({ _id: daoId }, {
                    $set: {
                        [`discord.${guildId}.roles`]: guildRoles.filter(gr => gr.name !== '@everyone' && !_.get(gr, 'tags.botId', null)).map(gr => { return { id: gr.id, name: gr.name, roleColor: gr.color ? `#${gr.color.toString(16)}` : `#99aab5` } }),
                        [`discord.${guildId}.members`]: guildMembers.map(gm => { return { userId: gm.userId, roles: gm.roles, displayName: gm.displayName } }),
                    }
                })
                let daoIds = await DAO.find({ "links.link": { "$regex": guildId, "$options": "i" } })
                daoIds = daoIds.map(d => d._id)
                let proj = await Project.find({ "links.link": { "$regex": guildId, "$options": "i" } })
                daoIds = daoIds.concat(proj.map(p => p.daoId))
                daoIds = _.uniq(daoIds)
                daoIds.push(daoId)
                for (let index = 0; index < guildMembers.length; index++) {
                    const guildMember = guildMembers[index];
                    console.log(guildId, guildMember.roles)
                    const up = await DAO.updateMany(
                        {
                            _id: { $in: daoIds },
                            members: { $elemMatch: { $or: [{ "discordId": guildMember.userId }, { "discordId": guildMember.displayName }] } }
                        }
                        ,
                        { $set: { [`members.$.discordRoles.${guildId}`]: guildMember.roles } }
                    )
                }
            }
        }

        return res.status(200).json({ message: 'Success' });
    } catch (e) {
        console.log(e)
    }
}



const generateInvoice = async (req, res) => {
    const { url } = req.params;
    const daoObj = await DAO.findOne({ url })
    const newInvoiceArray = req.body.map((item) => {
        let invoiceNumber = ''
        let lastInvoiceKey = daoObj?.invoice?.findLast(invoice => invoice.flag === item.flag)?.generalInfo?.invoiceNumber
        if (lastInvoiceKey) {
            const splittedInvoice = lastInvoiceKey.split(`/${item.flag}/`)
            const newVal = parseInt(splittedInvoice[splittedInvoice.length - 1]) + 1
            invoiceNumber = moment().format('YYYYMMDD') + '/' + item.flag + '/' + newVal
        } else {
            invoiceNumber = moment().format('YYYYMMDD') + '/' + item.flag + '/1'
        }

        return {
            ...item,
            generalInfo: {
                ...item.generalInfo,
                _id: new ObjectId(),
                invoiceNumber
            },
            paymentInfo: {
                ...item.paymentInfo,
                createdAt: new Date(),
                executedAt: new Date()
            }
        }
    })
    console.log(newInvoiceArray, '....newInvoiceArray....')
    try {
        await DAO.findOneAndUpdate({ url }, {
            $addToSet: {
                invoice: {
                    $each: newInvoiceArray
                }
            }
        })
        const updated_d = await DAO.findOne({ url }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        return res.status(200).json(updated_d);
    }
    catch (e) {
        console.error("dao.addDaoLinks::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const editInvoice = async (req, res) => {
    const { url } = req.params;
    const { title, link } = req.body;
    console.log("link details : ", title, link);
    try {
        // let dao = await DAO.findOne({ deletedAt: null, url });
        // if (!dao)
        //     return res.status(404).json({ message: 'DAO not found' })

        // dao.links.push({ title, link });
        // dao = await dao.save();

        const d = await DAO.findOne({ url }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        return res.status(200).json(d);
    }
    catch (e) {
        console.error("dao.addDaoLinks::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

module.exports = { loadAll, updateUserDiscord, syncSafeOwners, load, create, updateDetails, getByUrl, addDaoMember, addDaoMemberList, manageDaoMember, addDaoLinks, updateDaoLinks, updateSweatPoints, deleteDaoLink, createOption, generateInvoice, editInvoice };
