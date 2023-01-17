const Project = require('@server/modules/project/project.model');
const Member = require('@server/modules/member/member.model');
const Metadata = require('@server/modules/metadata/metadata.model');
const DAO = require('@server/modules/dao/dao.model');
const Task = require('@server/modules/task/task.model');
const { find, get, uniqBy } = require('lodash');
const moment = require('moment')
const ObjectId = require('mongodb').ObjectID;
const URL = require('url');
const axios = require('axios')
const { projectCreated, memberInvitedToProject, projectDeleted, projectMemberRemoved, daoMemberAdded } = require('@events')
const { checkSpaceAdminStatus, findNotionUserByEmail, getSpaceByDomain, prepareInviteObject, inviteUserToNotionBlock, removeUserFromNotionBlock } = require('@services/notion')

const getById = async (req, res) => {
    const { projectId } = req.params;
    try {
        const project = await Project.findOne({ _id: projectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } });
        return res.status(200).json(project)
    }
    catch (e) {
        console.error("project.controller::get::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const create = async (req, res) => {
    const { _id, wallet } = req.user;
    const { name, description, members, links, milestones, compensation, kra, daoId } = req.body;
    let mMembers = [];
    try {

        for (let index = 0; index < members.length; index++) {
            const member = members[index];
            const filter = { wallet: { $regex: new RegExp(`^${member.address}$`, "i") } }
            let m = await Member.findOne(filter);
            if (!m) {
                m = new Member({ wallet: toChecksumAddress(member.address), name: member.name })
                m = await m.save();
            }
            mMembers.push(m);
        }

        let mem = uniqBy(mMembers.map(m => m._id))

        let kra1 = {
            ...kra,
            tracker: [{
                start: moment().startOf('day').unix(),
                end: moment().startOf('day').add(1, kra.frequency === 'daily' ? 'day' : kra.frequency === 'weekly' ? 'week' : kra.frequency === 'monthly' ? 'month' : 'month').endOf('day').unix(),
                results: kra.results.map(result => {
                    return {
                        ...result, progress: 0, color: "#FFCC18"
                    }
                })
            }]
        }

        let project = new Project({
            daoId, name, description, members: mem, links, milestones, compensation, kra: kra1, creator: wallet
        })

        project = await project.save();

        project.kra

        let dao = await DAO.findOne({ _id: daoId });
        if (dao) {
            dao.projects.push(project._id);
            dao = await dao.save();
        }

        const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: "owners members members.member tasks transactions project metadata" } })

        //update metadata

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
        return res.status(200).json(d);
    }
    catch (e) {
        console.error("project.controller::create::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const updateProjectDetails = async (req, res) => {
    const { daoUrl } = req.query;
    const { projectId } = req.params;
    const { name, description } = req.body;
    try {

        let project = await Project.findOne({ _id: projectId });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        await Project.findOneAndUpdate(
            { _id: projectId },
            { name, description }
        )

        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        const p = await Project.findOne({ _id: projectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } })
        return res.status(200).json({ project: p, dao: d });
    }
    catch (e) {
        console.error("dao.updateProjectDetails::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const addProjectMember = async (req, res) => {
    const { daoUrl } = req.query;
    const { projectId } = req.params;
    const { name, address, role = "role4" } = req.body;
    console.log("member details : ", name, address);
    try {

        let project = await Project.findOne({ _id: projectId });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }
        const filter = { wallet: { $regex: new RegExp(`^${address}$`, "i") } }
        let m = await Member.findOne(filter);
        if (!m) {
            m = new Member({ wallet: toChecksumAddress(address), name })
            m = await m.save();
        }
        console.log("Member found in collection");
        const userExistInProject = await Project.findOne({ deletedAt: null, _id: projectId, 'members': { $in: [m._id] } })
        if (userExistInProject) {
            console.log("member exists in project");
            return res.status(500).json({ message: 'Member already exists in Project' })
        }
        console.log("member doesnt exists in project .... adding");
        project.members.push(m._id);
        project = await project.save();

        const userExistInDao = await DAO.findOne({ deletedAt: null, url: daoUrl, 'members.member': { $in: [m._id] } })
        if (!userExistInDao) {
            await DAO.findOneAndUpdate(
                { url: daoUrl },
                { $addToSet: { members: { member: m._id, creator: false, role } } }
            )
        }
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        daoMemberAdded.emit({ $dao: d, $members: [m._id] })
        if (d.sbt) {
            const filter = { 'attributes.value': { $regex: new RegExp(`^${address}$`, "i") }, contract: d.sbt._id }
            const metadata = await Metadata.findOne(filter)
            if (metadata) {
                let attrs = [...metadata._doc.attributes];
                if (!find(attrs, attr => attr.trait_type === 'projects')) {
                    attrs.push({ trait_type: 'projects', value: project._id.toString() })
                } else {
                    attrs = attrs.map(attr => {
                        if (attr.trait_type === 'projects' && attr.value.indexOf(project._id))
                            return { ...attr._doc, value: [...get(attr, 'value', '').split(','), project._id.toString()].join(',') }
                        return attr
                    })
                }
                if (!find(attrs, attr => attr.trait_type === 'project_names')) {
                    attrs.push({ trait_type: 'project_names', value: `${project.name} (${project._id})` })
                } else {
                    attrs = attrs.map(attr => {
                        if (attr.trait_type === 'project_names' && attr.value.indexOf(project._id))
                            return { ...attr._doc, value: [...get(attr, 'value', '').split(','), `${project.name} (${project._id})`].join(',') }
                        return attr
                    })
                }
                metadata._doc.attributes = attrs;
                await metadata.save();
            }
        }

        const p = await Project.findOne({ _id: projectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } })
        return res.status(200).json({ project: p, dao: d });
    }
    catch (e) {
        console.error("project.addProjectMember::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const updateProjectMember = async (req, res) => {
    const { projectId } = req.params;
    const { memberList, daoId } = req.body;
    console.log("Member List : ", memberList);
    try {
        let project = await Project.findOne({ _id: projectId });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }
        console.log("Project found")
        await Project.findOneAndUpdate(
            { _id: projectId },
            {
                $addToSet: { members: { $each: memberList } },
            }
        )

        const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })

        if (d.sbt) {
            for (let index = 0; index < memberList.length; index++) {
                const memberid = memberList[index];
                const member = await Member.findOne({ _id: memberid })
                const filter = { 'attributes.value': { $regex: new RegExp(`^${member.wallet}$`, "i") }, contract: d.sbt._id }
                const metadata = await Metadata.findOne(filter)
                if (metadata) {
                    let attrs = [...metadata._doc.attributes];
                    if (!find(attrs, attr => attr.trait_type === 'projects')) {
                        attrs.push({ trait_type: 'projects', value: projectId })
                    } else {
                        attrs = attrs.map(attr => {
                            if (attr.trait_type === 'projects')
                                return { ...attr._doc, value: [...get(attr, 'value', '').toString().split(','), project._id.toString()].join(',') }
                            return attr
                        })
                    }
                    if (!find(attrs, attr => attr.trait_type === 'project_names')) {
                        attrs.push({ trait_type: 'project_names', value: `${project.name} (${project._id})` })
                    } else {
                        attrs = attrs.map(attr => {
                            if (attr.trait_type === 'project_names')
                                return { ...attr._doc, value: [...get(attr, 'value', '').toString().split(','), `${project.name} (${project._id})`].join(',') }
                            return attr
                        })
                    }
                    console.log(attrs)
                    metadata._doc.attributes = attrs;
                    await metadata.save();
                }
            }
        }

        const p = await Project.findOne({ _id: projectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } })

        memberInvitedToProject.emit({ project: p, members: memberList })

        return res.status(200).json(p);
    }
    catch (e) {
        console.error("project.updateProjectMember::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const removeNotionUser = async (p) => {
    try {
        for (let index = 0; index < p.links.length; index++) {
            const link = p.links[index];
            if (link.provider.indexOf('notion.') > -1) {
                for (let index = 0; index < memberList.length; index++) {
                    const account = memberList[index];
                    const member = await Member.findOne({ _id: account })
                    let accountUnlocked = link.unlocked.map(l => l.toLowerCase()).indexOf(member.wallet.toLowerCase()) > -1
                    if (accountUnlocked) {
                        if (member && member.notionUserId) {
                            const notionUID = member.notionUserId;
                            if (notionUID) {
                                const space = await getSpaceByDomain(link.spaceDomain)
                                if (space && space.spaceId) {
                                    let url = URL.parse(link.link);
                                    const pathname = url.pathname;
                                    let blockId = null;
                                    if (pathname.indexOf('-') == -1) {
                                        blockId = pathname.replace('/', '')
                                    } else {
                                        let path = pathname.split('-');
                                        blockId = path[path.length - 1]
                                    }
                                    blockId = `${blockId.substring(0, 8)}-${blockId.substring(8, 12)}-${blockId.substring(12, 16)}-${blockId.substring(16, 20)}-${blockId.substring(20, blockId.length)}`
                                    const spaceId = space.spaceId
                                    await removeUserFromNotionBlock({ spaceId, blockId, inviteeId: notionUID })
                                }
                            }
                        }
                    }
                }
            }
            return;
        }
    } catch (e) {
        console.log(e)
        return;
    }
}

const deleteProjectMember = async (req, res) => {
    const { projectId } = req.params;
    const { memberList, daoId } = req.body;
    console.log("Member List : ", memberList);
    try {
        let project = await Project.findOne({ _id: projectId });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }
        await Project.findOneAndUpdate(
            { _id: projectId },
            {
                $pull: {
                    members: {
                        $in: memberList.map(m => ObjectId(m))
                    }
                },
            }
        )
        const p = await Project.findOne({ _id: projectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } })

        projectMemberRemoved.emit({ $project: p, $memberList: memberList })

        if (daoId) {
            const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
            if (d.sbt) {
                const members = await Member.find({ _id: { $in: memberList } })
                for (let index = 0; index < members.length; index++) {
                    const member = members[index];
                    const filter = { 'attributes.value': { $regex: new RegExp(`^${member.wallet}$`, "i") }, contract: d.sbt._id }
                    const metadata = await Metadata.findOne(filter)
                    if (metadata) {
                        let attrs = [...metadata._doc.attributes];
                        if (find(attrs, attr => attr.trait_type === 'projects')) {
                            attrs = attrs.map(attr => {
                                if (attr.trait_type === 'projects' && attr.value && attr.value.length > 1) {
                                    console.log("n { ...attr._", [...(get(attr, 'value', '').split(','))].filter(prj => prj !== String(p._id)).join(','))
                                    return { ...attr._doc, value: [...(get(attr, 'value', '').split(','))].filter(prj => prj !== String(p._id)).join(',') }
                                }
                                return attr
                            })
                        }
                        if (find(attrs, attr => attr.trait_type === 'project_names')) {
                            attrs = attrs.map(attr => {
                                if (attr.trait_type === 'project_names' && attr.value && attr.value.length > 1)
                                    return { ...attr._doc, value: [...(get(attr, 'value', '').split(','))].filter(prj => prj !== `${p.name} (${p._id})`).join(',') }
                                return attr
                            })
                        }
                        metadata._doc.attributes = attrs;
                        await metadata.save();
                    }
                }
            }
        }

        removeNotionUser(p);

        return res.status(200).json(p);
    }
    catch (e) {
        console.error("project.updateProjectMember::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const editProjectMember = async (req, res) => {
    const { projectId } = req.params;
    const { memberList, daoId } = req.body;
    try {
        let project = await Project.findOne({ _id: projectId });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        let newMembers = [];
        let deletedMembers = [];

        // getting new members
        for (var i = 0; i < memberList.length; i++) {
            let person = memberList[i];
            if (project.members.indexOf(person) === -1) {
                newMembers.push(person);
            }
        }

        // getting old members who are getting removed
        for (var i = 0; i < project.members.length; i++) {
            let person = project.members[i].toString();
            if (memberList.indexOf(person) === -1) {
                deletedMembers.push(person);
            }
        }
        await Project.findOneAndUpdate(
            { _id: projectId },
            {
                members: memberList
            }
        )

        if (daoId) {
            const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
            if (d.sbt) {

                // for removing members
                const members = await Member.find({ _id: { $in: deletedMembers } })
                for (let index = 0; index < members.length; index++) {
                    const member = members[index];
                    const filter = { 'attributes.value': { $regex: new RegExp(`^${member.wallet}$`, "i") }, contract: d.sbt._id }
                    const metadata = await Metadata.findOne(filter)
                    if (metadata) {
                        let attrs = [...metadata._doc.attributes];
                        if (find(attrs, attr => attr.trait_type === 'projects')) {
                            attrs = attrs.map(attr => {
                                if (attr.trait_type === 'projects' && attr.value && attr.value.length > 1) {
                                    console.log("n { ...attr._", [...(get(attr, 'value', '').split(','))].filter(prj => prj !== String(p._id)).join(','))
                                    return { ...attr._doc, value: [...(get(attr, 'value', '').split(','))].filter(prj => prj !== String(p._id)).join(',') }
                                }
                                return attr
                            })
                        }
                        if (find(attrs, attr => attr.trait_type === 'project_names')) {
                            attrs = attrs.map(attr => {
                                if (attr.trait_type === 'project_names' && attr.value && attr.value.length > 1)
                                    return { ...attr._doc, value: [...(get(attr, 'value', '').split(','))].filter(prj => prj !== `${p.name} (${p._id})`).join(',') }
                                return attr
                            })
                        }
                        metadata._doc.attributes = attrs;
                        await metadata.save();
                    }
                }

                // for adding new members
                for (let index = 0; index < newMembers.length; index++) {
                    const memberid = newMembers[index];
                    const member = await Member.findOne({ _id: memberid })
                    const filter = { 'attributes.value': { $regex: new RegExp(`^${member.wallet}$`, "i") }, contract: d.sbt._id }
                    const metadata = await Metadata.findOne(filter)
                    if (metadata) {
                        let attrs = [...metadata._doc.attributes];
                        if (!find(attrs, attr => attr.trait_type === 'projects')) {
                            attrs.push({ trait_type: 'projects', value: projectId })
                        } else {
                            attrs = attrs.map(attr => {
                                if (attr.trait_type === 'projects')
                                    return { ...attr._doc, value: [...get(attr, 'value', '').toString().split(','), project._id.toString()].join(',') }
                                return attr
                            })
                        }
                        if (!find(attrs, attr => attr.trait_type === 'project_names')) {
                            attrs.push({ trait_type: 'project_names', value: `${project.name} (${project._id})` })
                        } else {
                            attrs = attrs.map(attr => {
                                if (attr.trait_type === 'project_names')
                                    return { ...attr._doc, value: [...get(attr, 'value', '').toString().split(','), `${project.name} (${project._id})`].join(',') }
                                return attr
                            })
                        }
                        console.log(attrs)
                        metadata._doc.attributes = attrs;
                        await metadata.save();
                    }
                }
            }
        }

        const p = await Project.findOne({ _id: projectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } })

        memberInvitedToProject.emit({ project: p, members: newMembers })
        projectMemberRemoved.emit({ $project: p, $memberList: deletedMembers })
        removeNotionUser(p);

        return res.status(200).json(p);
    }
    catch (e) {
        console.error("project.editProjectMember::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const archiveProject = async (req, res) => {
    const { daoUrl } = req.query;
    const { projectId } = req.params;
    try {
        let project = await Project.findOne({ _id: projectId });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }
        await Project.findOneAndUpdate(
            { _id: projectId },
            {
                archivedAt: Date.now(),
            }
        )
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        const p = await Project.findOne({ _id: projectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } })
        removeNotionUser(p)
        return res.status(200).json({ project: p, dao: d });
    }
    catch (e) {
        console.error("project.archiveProject::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const deleteProject = async (req, res) => {
    const { daoUrl } = req.query;
    const { projectId } = req.params;
    try {
        let project = await Project.findOne({ _id: projectId });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }
        console.log(project.tasks);
        await Task.updateMany(
            { _id: { $in: project.tasks } },
            { $set: { deletedAt: Date.now() } },
        )
        await Project.findOneAndUpdate(
            { _id: projectId },
            {
                deletedAt: Date.now(),
            }
        )
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        const p = await Project.findOne({ _id: projectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } })
        removeNotionUser(p)
        projectDeleted.emit(project)
        return res.status(200).json({ project: p, dao: d });
    }
    catch (e) {
        console.error("project.archiveProject::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const addProjectLinks = async (req, res) => {
    const { daoUrl } = req.query;
    const { projectId } = req.params;
    const { title, link, accessControl, spaceDomain, roleId = null, guildId = null, id, platformId } = req.body;
    console.log("link details : ", title, link);
    try {

        let project = await Project.findOne({ _id: projectId });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }
        project.links.push({ id, title, link, spaceDomain, roleId, accessControl, guildId, platformId, unlocked: [] });
        project = await project.save();

        const p = await Project.findOne({ _id: projectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } })
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        return res.status(200).json({ project: p, dao: d });
    }
    catch (e) {
        console.error("project.addProjectLinks::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const editProjectLinks = async (req, res) => {
    const { daoUrl } = req.query;
    const { projectId } = req.params;
    const { resourceList } = req.body;
    try {

        let project = await Project.findOne({ _id: projectId });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        await Project.findOneAndUpdate(
            { _id: projectId },
            { links: resourceList }
        )

        const p = await Project.findOne({ _id: projectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } })
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        return res.status(200).json({ project: p, dao: d });
    }
    catch (e) {
        console.error("project.editProjectLinks::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const updateProjectLink = async (req, res) => {
    const { wallet } = req.user;
    const { daoUrl } = req.query;
    const { projectId } = req.params;
    const { id } = req.body;
    try {

        let project = await Project.findOne({ _id: projectId });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }
        if (!id) {
            return res.status(404).json({ message: 'Link not found' })
        }
        project.links = project.links.map(l => {
            if (l.id === id)
                return { ...l, unlocked: [...(l.unlocked ? l.unlocked : []), wallet.toLowerCase()] }
            return l
        })
        project = await project.save();

        const p = await Project.findOne({ _id: projectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } })
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        return res.status(200).json({ project: p, dao: d });
    }
    catch (e) {
        console.error("project.addProjectLinks::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const checkDiscordServerExists = async (req, res) => {
    const { discordServerId } = req.params;
    try {
        let project = await Project.findOne({
            'links.platformId': `${discordServerId}`
        })
        if (!project)
            return res.status(200).json(null)

        const guildId = get(find(project.links, l => l.platformId === `${discordServerId}`), 'guildId', null)
        return res.status(200).json(guildId)
    }
    catch (e) {
        console.error("project.checkDiscordServerExists::", e)
        return res.status(200).json(null)
    }
}

const checkNotionSpaceAdminStatus = async (req, res) => {
    const { domain = '' } = req.query;
    try {
        const status = await checkSpaceAdminStatus(domain)
        return res.status(200).json(status)
    } catch (e) {
        console.log(e)
        return res.status(200).json({ status: false, message: 'Something went wrong. try again' })
    }
}

const getNotionUser = async (req, res) => {
    const { email = '' } = req.query;
    try {
        const user = await findNotionUserByEmail(email)
        return res.status(200).json(user)
    } catch (e) {
        console.log(e)
        return res.status(200).json(null)
    }
}

const addNotionUserRole = async (req, res) => {
    const { notionUserId, linkId, projectId, account } = req.body;
    try {
        const project = await Project.findOne({ _id: projectId })
        if (project) {
            let link = find(project.links, link => link.id === linkId);
            const space = await getSpaceByDomain(link.spaceDomain)
            if (space && space.spaceId) {
                console.log(link.link)
                let url = URL.parse(link.link);
                const pathname = url.pathname;
                let blockId = null;
                if (pathname.indexOf('-') == -1) {
                    blockId = pathname.replace('/', '')
                } else {
                    let path = pathname.split('-');
                    blockId = path[path.length - 1]
                }
                blockId = `${blockId.substring(0, 8)}-${blockId.substring(8, 12)}-${blockId.substring(12, 16)}-${blockId.substring(16, 20)}-${blockId.substring(20, blockId.length)}`
                const spaceId = space.spaceId
                console.log(spaceId, blockId, notionUserId)
                await inviteUserToNotionBlock({ spaceId, blockId, inviteeId: notionUserId })
                return res.status(200).json({ message: "User added to notion page" })
            }
        }
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: 'something went wrong' })
    }
}

const joinDiscordQueue = async (req, res) => {
    try {
        const { wallet } = req.user;
        const { daoUrl } = req.query;
        const { projectId } = req.params;
        const { id, discordMemberId } = req.body;
        if (!id) {
            return res.status(404).json({ message: 'Link not found' })
        }
        project.links = project.links.map(l => {
            if (l.id === id && (!l.discordJoinQueue || l.discordJoinQueue && l.discordJoinQueue.indexOf(discordMemberId) == -1)) {
                return { ...l, discordJoinQueue: [...(l.discordJoinQueue ? l.discordJoinQueue : []), discordMemberId] }
            }
            return l
        })
        project = await project.save();

        const p = await Project.findOne({ _id: projectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } })
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        return res.status(200).json({ project: p, dao: d });
    }
    catch (e) {
        console.error("project.addProjectLinks::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const updateProjectKRAReview = async (req, res) => {
    const { daoUrl } = req.query;
    const { projectId } = req.params;
    const { kra } = req.body;
    try {

        let project = await Project.findOne({ _id: projectId });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        await Project.findOneAndUpdate(
            { _id: projectId },
            { kra }
        )

        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        const p = await Project.findOne({ _id: projectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } })
        return res.status(200).json({ project: p, dao: d });
    }
    catch (e) {
        console.error("dao.updateProjectKraReview::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const editProjectKRA = async (req, res) => {
    const { daoUrl } = req.query;
    const { projectId } = req.params;
    const { frequency, results } = req.body;
    try {

        let project = await Project.findOne({ _id: projectId });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        let ob = { ...project.kra };
        ob.frequency = frequency;
        ob.results = results;

        await Project.findOneAndUpdate(
            { _id: projectId },
            { kra: ob }
        )

        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        const p = await Project.findOne({ _id: projectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } })
        return res.status(200).json({ project: p, dao: d });
    }
    catch (e) {
        console.error("dao.updateProjectKraReview::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const updateProjectMilestones = async (req, res) => {
    const { daoUrl } = req.query;
    const { projectId } = req.params;
    const { milestones } = req.body;
    try {

        let project = await Project.findOne({ _id: projectId });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        await Project.findOneAndUpdate(
            { _id: projectId },
            { milestones }
        )

        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        const p = await Project.findOne({ _id: projectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } })
        return res.status(200).json({ project: p, dao: d });
    }
    catch (e) {
        console.error("dao.updateProjectMilestones::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

module.exports = {
    checkDiscordServerExists, getById, create, addProjectMember, updateProjectMember, deleteProjectMember, editProjectMember, archiveProject, deleteProject, addProjectLinks, updateProjectLink,
    checkNotionSpaceAdminStatus, getNotionUser, addNotionUserRole, updateProjectDetails, updateProjectKRAReview, editProjectKRA, updateProjectMilestones, joinDiscordQueue, editProjectLinks
};
