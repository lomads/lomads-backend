const Project = require('@server/modules/project/project.model');
const Member = require('@server/modules/member/member.model');
const Metadata = require('@server/modules/metadata/metadata.model');
const DAO = require('@server/modules/dao/dao.model')
const { find, get } = require('lodash');
const ObjectId = require('mongodb').ObjectID;

const getById = async (req, res) => {
    const { projectId } = req.params;
    try {
        const project = await Project.findOne({ _id: projectId }).populate({ path: 'members', populate: { path: 'members' } });
        return res.status(200).json(project)
    }
    catch (e) {
        console.error("project.controller::get::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const create = async (req, res) => {
    const { name, description, members, links, daoId } = req.body;
    console.log("data : ", name, description, members, links, daoId);
    let mMembers = [];
    try {

        for (let index = 0; index < members.length; index++) {
            const member = members[index];
            const filter = { wallet: { $regex: new RegExp(`^${member.address}$`, "i") } }
            let m = await Member.findOne(filter);
            if (!m) {
                m = new Member({ wallet: member.address, name: member.name })
                m = await m.save();
            }
            mMembers.push(m);
        }

        let mem = mMembers.map(m => {
            return m._id
        })

        let project = new Project({
            name, description, members: mem, links
        })

        project = await project.save();

        let dao = await DAO.findOne({ _id: daoId });
        if (dao) {
            dao.projects.push(project._id);
            dao = await dao.save();
        }

        const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects', populate: { path: "owners members transactions" } })

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
                                return { ...attr, value: [...get(attr, 'value', '').toString().split(','), project._id.toString()].join(',') }
                            }
                            return attr
                        })
                    }
                    metadata._doc.attributes = attrs;
                    await metadata.save();
                }
            }
        }

        return res.status(200).json(d);
    }
    catch (e) {
        console.error("project.controller::create::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const addProjectMember = async (req, res) => {
    const { daoUrl } = req.query;
    const { projectId } = req.params;
    const { name, address } = req.body;
    console.log("member details : ", name, address);
    try {

        let project = await Project.findOne({ _id: projectId });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }
        const filter = { wallet: { $regex: new RegExp(`^${address}$`, "i") } }
        let m = await Member.findOne(filter);
        if (!m) {
            m = new Member({ wallet: address, name })
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
                { $addToSet: { members: { member: m._id, creator: false, role: 'CORE_CONTRIBUTOR' } } }
            )
        }
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects', populate: { path: 'owners members transactions' } })

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
                            return { ...attr, value: [...get(attr, 'value', '').toString().split(','), project._id.toString()].join(',') }
                        return attr
                    })
                }
                metadata._doc.attributes = attrs;
                await metadata.save();
            }
        }

        const p = await Project.findOne({ _id: projectId }).populate({ path: 'members', populate: { path: 'members' } })
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

        const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects', populate: { path: 'owners members transactions' } })

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
                                return { ...attr, value: [...get(attr, 'value', '').toString().split(','), project._id.toString()].join(',') }
                            return attr
                        })
                    }
                    console.log(attrs)
                    metadata._doc.attributes = attrs;
                    await metadata.save();
                }
            }
        }

        const p = await Project.findOne({ _id: projectId }).populate({ path: 'members', populate: { path: 'members' } })
        return res.status(200).json(p);
    }
    catch (e) {
        console.error("project.updateProjectMember::", e)
        return res.status(500).json({ message: 'Something went wrong' })
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
        const p = await Project.findOne({ _id: projectId }).populate({ path: 'members', populate: { path: 'members' } })

        if(daoId){
            const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects', populate: { path: 'owners members transactions' } })
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
                                if (attr.trait_type === 'projects' && attr.value && attr.value.length > 1)
                                    return { ...attr, value: [...get(attr, 'value', '').toString().split(',')].filter(p => p !== p._id.toString()).join(',') }
                                return attr
                            })
                        }
                        metadata._doc.attributes = attrs;
                        await metadata.save();
                    }
                }
            }
        }

        return res.status(200).json(p);
    }
    catch (e) {
        console.error("project.updateProjectMember::", e)
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
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects', populate: { path: 'owners members transactions' } })
        const p = await Project.findOne({ _id: projectId }).populate({ path: 'members', populate: { path: 'members' } })
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
        await Project.findOneAndUpdate(
            { _id: projectId },
            {
                deletedAt: Date.now(),
            }
        )
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects', populate: { path: 'owners members transactions' } })
        const p = await Project.findOne({ _id: projectId }).populate({ path: 'members', populate: { path: 'members' } })
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
    const { title, link, accessControl, guildId = null, id } = req.body;
    console.log("link details : ", title, link);
    try {

        let project = await Project.findOne({ _id: projectId });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }
        project.links.push({ id, title, link, accessControl, guildId, unlocked: [] });
        project = await project.save();

        const p = await Project.findOne({ _id: projectId }).populate({ path: 'members', populate: { path: 'members' } })
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects', populate: { path: 'owners members transactions' } })
        return res.status(200).json({ project: p, dao: d });
    }
    catch (e) {
        console.error("project.addProjectLinks::", e)
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

        const p = await Project.findOne({ _id: projectId }).populate({ path: 'members', populate: { path: 'members' } })
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects', populate: { path: 'owners members transactions' } })
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
            'links.platformId': discordServerId
        })
        if(!project)
            return res.status(200).json(null)
    
        const guildId = get(find(project.links, l => l.platformId === discordServerId), 'guildId', null)
        return res.status(200).json(guildId)
    }
    catch (e) {
        console.error("project.checkDiscordServerExists::", e)
        return res.status(200).json(null)
    }
}

module.exports = { checkDiscordServerExists, getById, create, addProjectMember, updateProjectMember, deleteProjectMember, archiveProject, deleteProject, addProjectLinks, updateProjectLink };