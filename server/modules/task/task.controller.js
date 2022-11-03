const Project = require('@server/modules/project/project.model');
const Task = require('@server/modules/task/task.model');
const Member = require('@server/modules/member/member.model');
const DAO = require('@server/modules/dao/dao.model')
const Metadata = require('@server/modules/metadata/metadata.model');
const { find, get, uniqBy } = require('lodash');
const ObjectId = require('mongodb').ObjectID;

const getById = async (req, res) => {
    const { taskId } = req.params;
    try {
        const task = await Task.findOne({ _id: taskId }).populate({ path: 'members.member', populate: { path: 'members' } });
        return res.status(200).json(task)
    }
    catch (e) {
        console.error("task.controller::get::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const create = async (req, res) => {
    const { _id, wallet } = req.user;
    const {
        daoId,
        name,
        description,
        applicant,
        projectId,
        discussionChannel,
        deadline,
        submissionLink,
        compensation,
        reviewer,
        contributionType,
        isSingleContributor,
        isFilterRoles,
        validRoles,
    } = req.body;
    try {

        let task = new Task({
            name,
            description,
            members: applicant ? [{ member: applicant._id, isApproved: true }] : [],
            creator: wallet,
            project: projectId,
            discussionChannel,
            deadline,
            submissionLink,
            compensation,
            reviewer,
            contributionType,
            isSingleContributor,
            isFilterRoles,
            validRoles
        })

        task = await task.save();

        // update project
        if (projectId) {
            console.log("update project : ", projectId);
            let project = await Project.findOne({ _id: projectId });
            if (project) {
                project.tasks.push(task._id);
                project = await project.save();
            }
        }

        // update dao
        let dao = await DAO.findOne({ _id: daoId });
        if (dao) {
            dao.tasks.push(task._id);
            dao = await dao.save();
        }

        const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: "owners members transactions" } })
        // update sbt

        if (d.sbt && applicant) {
            console.log("update sbt");
            const filter = { 'attributes.value': { $regex: new RegExp(`^${applicant.address}$`, "i") }, contract: d.sbt._id }
            const metadata = await Metadata.findOne(filter)
            if (metadata) {
                let attrs = [...metadata._doc.attributes];
                if (!find(attrs, attr => attr.trait_type === 'tasks')) {
                    attrs.push({ trait_type: 'tasks', value: task._id.toString() })
                } else {
                    attrs = attrs.map(attr => {
                        if (attr.trait_type === 'tasks') {
                            return { ...attr._doc, value: [...get(attr, 'value', '').toString().split(','), task._id.toString()].join(',') }
                        }
                        return attr
                    })
                }
                if (!find(attrs, attr => attr.trait_type === 'task_names')) {
                    attrs.push({ trait_type: 'task_names', value: task._id.toString() })
                } else {
                    attrs = attrs.map(attr => {
                        if (attr.trait_type === 'task_names') {
                            return { ...attr._doc, value: [...get(attr, 'value', '').toString().split(','), task.name.toString()].join(',') }
                        }
                        return attr
                    })
                }
                console.log("attrs", attrs);
                metadata._doc.attributes = attrs;
                await metadata.save();
            }
        }

        return res.status(200).json(d);
    }
    catch (e) {
        console.error("task.controller::create::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}



module.exports = { getById, create };