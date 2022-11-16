const Project = require('@server/modules/project/project.model');
const Task = require('@server/modules/task/task.model');
const OffChain = require('@server/modules/transaction/offchain.model');
const Member = require('@server/modules/member/member.model');
const DAO = require('@server/modules/dao/dao.model')
const Metadata = require('@server/modules/metadata/metadata.model');
const { find, get, uniqBy } = require('lodash');
const ObjectId = require('mongodb').ObjectID;
const _ = require('lodash');
const moment = require('moment');

const getById = async (req, res) => {
    const { taskId } = req.params;
    try {

        const task = await Task.findOne({ _id: taskId }).populate({ path: 'members.member project reviewer', populate: { path: 'members' } });
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
            taskStatus: applicant ? 'assigned' : 'open',
            name,
            description,
            members: applicant ? [{ member: applicant._id, status: 'approved' }] : [],
            creator: _id,
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

        const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: "owners members members.member transactions project" } })
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

const draftTask = async (req, res) => {
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
            taskStatus: applicant ? 'assigned' : 'open',
            name,
            description,
            members: applicant ? [{ member: applicant._id, status: 'approved' }] : [],
            creator: _id,
            project: projectId,
            discussionChannel,
            deadline,
            submissionLink,
            compensation,
            reviewer,
            contributionType,
            isSingleContributor,
            isFilterRoles,
            validRoles,
            draftedAt: Date.now(),
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

        const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: "owners members members.member transactions project" } })
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
        console.error("task.controller::draft::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const applyTask = async (req, res) => {
    const { _id } = req.user;
    const { daoUrl } = req.query;
    const { taskId } = req.params;
    const { note, resourceList } = req.body;
    try {

        let task = await Task.findOne({ _id: taskId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' })
        }

        await Task.findOneAndUpdate(
            { _id: taskId },
            { $addToSet: { members: { member: _id, note, links: resourceList } } }
        )

        const t = await Task.findOne({ _id: taskId }).populate({ path: 'members.member project reviewer', populate: { path: 'members' } });
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member transactions project' } })
        return res.status(200).json({ task: t, dao: d });
    }
    catch (e) {
        console.error("task.applyTask::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const assignTask = async (req, res) => {
    const { _id } = req.user;
    const { daoUrl } = req.query;
    const { taskId } = req.params;
    const { memberId } = req.body;
    try {

        let task = await Task.findOne({ _id: taskId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' })
        }
        let members = task.members;
        for (var i = 0; i < members.length; i++) {
            if (members[i].member.toString() === memberId) {
                members[i].status = 'approved'
            }
            else {
                members[i].status = 'rejected'
            }
        }
        task.members = members;
        task.taskStatus = "assigned";
        await task.save();
        const t = await Task.findOne({ _id: taskId }).populate({ path: 'members.member project reviewer', populate: { path: 'members' } });
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member transactions project' } })
        return res.status(200).json({ task: t, dao: d });
    }
    catch (e) {
        console.error("task.assignTask::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const rejectTaskMember = async (req, res) => {
    const { _id } = req.user;
    const { daoUrl } = req.query;
    const { taskId } = req.params;
    const { memberId } = req.body;
    try {

        let task = await Task.findOne({ _id: taskId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' })
        }
        let members = task.members;
        for (var i = 0; i < members.length; i++) {
            if (members[i].member.toString() === memberId) {
                members[i].status = 'rejected'
            }
        }
        task.members = members;
        await task.save();
        const t = await Task.findOne({ _id: taskId }).populate({ path: 'members.member project reviewer', populate: { path: 'members' } });
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member transactions project' } })
        return res.status(200).json({ task: t, dao: d });
    }
    catch (e) {
        console.error("task.assignTask::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const submitTask = async (req, res) => {
    const { _id } = req.user;
    const { taskId } = req.params;
    const { daoUrl } = req.query;
    const { submissionLink, note } = req.body;
    try {
        const dao = await DAO.findOne({ url: daoUrl })
        const task = await Task.findOne({ _id: taskId })
        if(task){
            console.log(taskId)
            console.log(_id)
            if(task.contributionType === 'assign' || (task.isSingleContributor === true && task.contributionType === 'open')) {
                const taskContributor = _.find(task.members, m => m.member.toString() === _id.toString() && m.status === 'approved')
                if(taskContributor) {
                    let members = task.members;
                    for (var i = 0; i < members.length; i++) {
                        if (members[i]._id === taskContributor._id) {
                            members[i].submission = {
                                submittedAt: moment().utc().toDate(),
                                submissionLink: submissionLink,
                                note
                            }
                        }
                    }
                    task.taskStatus = 'submitted'
                    task.members = members;
                    await task.save();
                } else {
                    return res.status(500).json({ message: 'Not permitted' }) 
                }
            } else if(task.isSingleContributor === false && task.contributionType === 'open') {
                if(task.isFilterRoles) {
                    const roles = task.validRoles.map(r => r.replace(' ', '_').toUpperCase())
                    const eligible = _.find(_.get(dao, 'members', []), m => m.member.toString() === _id.toString() && roles.indexOf(m.role) > -1)
                    if(!eligible)
                        return res.status(500).json({ message: 'Not permitted' })

                    await Task.updateOne({ _id: taskId }, {
                        $addToSet: { members: {
                            member: _id,
                            status: 'approved',
                            submission: {
                                submittedAt: moment().utc().toDate(),
                                submissionLink: submissionLink,
                                note
                            }
                        } },
                    })

                }
            } else {
                return res.status(500).json({ message: 'Not permitted' }) 
            }
            const t = await Task.findOne({ _id: taskId }).populate({ path: 'members.member project reviewer', populate: { path: 'members' } });
            const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member transactions project' } })
            return res.status(200).json({ task: t, dao: d });
        }
        return res.status(500).json({ message: 'Task not found' }) 
    }
    catch(e) {
        console.error("task.assignTask::", e)
        return res.status(500).json({ message: 'Something went wrong' }) 
    }
}

const approveTask = async (req, res) => {
    const { _id } = req.user;
    const { taskId } = req.params;
    const { daoUrl } = req.query;
    const { compensationDelta = 0, offChainPayload, onChainSafeTxHash, recipient } = req.body;
    try {
        const task = await Task.findOne({ _id: taskId })
        let chainTxnHash = onChainSafeTxHash;
        if(offChainPayload) {
            const offChainTx = await OffChain.create(offChainPayload);
            chainTxnHash = offChainTx.safeTxHash;
        }
        await Task.findOneAndUpdate(
            { _id: taskId },
            {
                taskStatus: 'approved',
                'compensation.delta':compensationDelta,
                'compensation.recipient': recipient,
                'compensation.txnHash': chainTxnHash,
                'compensation.onChain': onChainSafeTxHash ? true : false
            }  
        )
        await Task.findOneAndUpdate(
            { _id: taskId, 'members.member._id': recipient },
            {
                'members.$.status': 'approved'
            }  
        )
        // const user = await Member.findOne({ _id: recipient })
        // let earnings = user.earnings
        // const symbol = _.find(earnings, e => e.symbol === task.compensation.symbol)
        
        // if(symbol) {
        //     earnings = earnings.map(e => {
        //         if(e.symbol === task.compensation.symbol)
        //             return { ...e._doc, value: +e.value + (+task.compensation.amount) }
        //         return e
        //     })
        //     console.log(earnings)
        // } else {
        //     earnings.push({
        //         symbol: task.compensation.symbol,
        //         value: task.compensation.amount,
        //         currency: task.compensation.currency
        //     })
        // }

        // await Member.findByIdAndUpdate(
        //     {_id: recipient},
        //     { earnings }
        // )

        const t = await Task.findOne({ _id: taskId }).populate({ path: 'members.member project reviewer', populate: { path: 'members' } });
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member transactions project' } })
        return res.status(200).json({ task: t, dao: d });
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: 'Something went wrong' }) 
    }
}


module.exports = { getById, create, draftTask, applyTask, assignTask, rejectTaskMember, submitTask, approveTask };