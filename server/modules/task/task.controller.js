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
const { taskCreated, taskAssigned, taskApplied, taskSubmitted, taskSubmissionApprove, taskSubmissionRejected, taskDeleted } = require('@server/events');

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
        provider,
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
        invitations,
    } = req.body;
    try {

        let task = new Task({
            daoId,
            provider,
            // taskStatus: applicant ? 'assigned' : 'open',
            taskStatus: 'open',
            name,
            description,
            // members: applicant ? [{ member: applicant._id, status: 'approved' }] : [],
            members: [],
            creator: _id,
            project: projectId,
            invitations,
            discussionChannel,
            deadline,
            submissionLink,
            compensation,
            reviewer,
            contributionType,
            isSingleContributor,
            isFilterRoles,
            validRoles,
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
            dao.dummyTaskFlag = false;
            dao = await dao.save();
        }

        const p = await Project.findOne({ _id: projectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } });
        const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe safes sbt members.member projects tasks', populate: { path: "owners members members.member tasks transactions project metadata" } })
        // update sbt

        // if (d.sbt && applicant) {
        //     console.log("update sbt");
        //     const filter = { 'attributes.value': { $regex: new RegExp(`^${applicant.address}$`, "i") }, contract: d.sbt._id }
        //     const metadata = await Metadata.findOne(filter)
        //     if (metadata) {
        //         let attrs = [...metadata._doc.attributes];
        //         if (!find(attrs, attr => attr.trait_type === 'tasks')) {
        //             attrs.push({ trait_type: 'tasks', value: task._id.toString() })
        //         } else {
        //             attrs = attrs.map(attr => {
        //                 if (attr.trait_type === 'tasks') {
        //                     return { ...attr._doc, value: [...get(attr, 'value', '').toString().split(','), task._id.toString()].join(',') }
        //                 }
        //                 return attr
        //             })
        //         }
        //         if (!find(attrs, attr => attr.trait_type === 'task_names')) {
        //             attrs.push({ trait_type: 'task_names', value: task._id.toString() })
        //         } else {
        //             attrs = attrs.map(attr => {
        //                 if (attr.trait_type === 'task_names') {
        //                     return { ...attr._doc, value: [...get(attr, 'value', '').toString().split(','), task.name.toString()].join(',') }
        //                 }
        //                 return attr
        //             })
        //         }
        //         console.log("attrs", attrs);
        //         metadata._doc.attributes = attrs;
        //         await metadata.save();
        //     }
        // }

        const tsk = await Task.findOne({ _id: task._id }).populate({ path: 'project members.member' })
        taskCreated.emit(tsk);
        return res.status(200).json({ project: p, dao: d });
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
        provider,
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
        invitations,
    } = req.body;
    try {

        let task = new Task({
            daoId,
            provider,
            // taskStatus: applicant ? 'assigned' : 'open',
            taskStatus: 'open',
            name,
            description,
            // members: applicant ? [{ member: applicant._id, status: 'approved' }] : [],
            members: [],
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
            invitations,
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
            dao.dummyTaskFlag = false;
            dao = await dao.save();
        }

        const p = await Project.findOne({ _id: projectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } });
        const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe safes sbt members.member projects tasks', populate: { path: "owners members members.member tasks transactions project metadata" } })
        // update sbt

        // if (d.sbt && applicant) {
        //     console.log("update sbt");
        //     const filter = { 'attributes.value': { $regex: new RegExp(`^${applicant.address}$`, "i") }, contract: d.sbt._id }
        //     const metadata = await Metadata.findOne(filter)
        //     if (metadata) {
        //         let attrs = [...metadata._doc.attributes];
        //         if (!find(attrs, attr => attr.trait_type === 'tasks')) {
        //             attrs.push({ trait_type: 'tasks', value: task._id.toString() })
        //         } else {
        //             attrs = attrs.map(attr => {
        //                 if (attr.trait_type === 'tasks') {
        //                     return { ...attr._doc, value: [...get(attr, 'value', '').toString().split(','), task._id.toString()].join(',') }
        //                 }
        //                 return attr
        //             })
        //         }
        //         if (!find(attrs, attr => attr.trait_type === 'task_names')) {
        //             attrs.push({ trait_type: 'task_names', value: task._id.toString() })
        //         } else {
        //             attrs = attrs.map(attr => {
        //                 if (attr.trait_type === 'task_names') {
        //                     return { ...attr._doc, value: [...get(attr, 'value', '').toString().split(','), task.name.toString()].join(',') }
        //                 }
        //                 return attr
        //             })
        //         }
        //         console.log("attrs", attrs);
        //         metadata._doc.attributes = attrs;
        //         await metadata.save();
        //     }
        // }

        return res.status(200).json({ project: p, dao: d });
    }
    catch (e) {
        console.error("task.controller::draft::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const storeGithubIssues = async (req, res) => {
    const { _id, wallet } = req.user;
    const { daoId, issueList } = req.body;
    try {

        let result = await Task.insertMany(issueList, async function (error, docs) {
            let arr = [];
            for (let i = 0; i < docs.length; i++) {
                arr.push(docs[i]._id);
            }
            await DAO.findOneAndUpdate(
                { _id: daoId },
                {
                    dummyTaskFlag: false,
                    $addToSet: { tasks: { $each: arr } },
                }
            )
        })

        const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe safes sbt members.member projects tasks', populate: { path: "owners members members.member tasks transactions project metadata" } })

        return res.status(200).json({ dao: d });
    }
    catch (e) {
        console.error("task.controller::storeGithubIssues::", e)
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
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe safes sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })

        taskApplied.emit(t)
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
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe safes sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })

        // if (d.sbt) {
        //     const member = await Member.findOne({ _id: memberId })
        //     const filter = { 'attributes.value': { $regex: new RegExp(`^${member.wallet}$`, "i") }, contract: d.sbt._id }
        //     const metadata = await Metadata.findOne(filter)
        //     if (metadata) {
        //         let attrs = [...metadata._doc.attributes];
        //         if (!find(attrs, attr => attr.trait_type === 'tasks')) {
        //             attrs.push({ trait_type: 'tasks', value: task._id.toString() })
        //         } else {
        //             attrs = attrs.map(attr => {
        //                 if (attr.trait_type === 'tasks') {
        //                     return { ...attr._doc, value: [...get(attr, 'value', '').toString().split(','), task._id.toString()].join(',') }
        //                 }
        //                 return attr
        //             })
        //         }
        //         if (!find(attrs, attr => attr.trait_type === 'task_names')) {
        //             attrs.push({ trait_type: 'task_names', value: task._id.toString() })
        //         } else {
        //             attrs = attrs.map(attr => {
        //                 if (attr.trait_type === 'task_names') {
        //                     return { ...attr._doc, value: [...get(attr, 'value', '').toString().split(','), task.name.toString()].join(',') }
        //                 }
        //                 return attr
        //             })
        //         }
        //         console.log("attrs", attrs);
        //         metadata._doc.attributes = attrs;
        //         await metadata.save();
        //     }
        // }

        const tsk = await Task.findOne({ _id: task._id }).populate({ path: 'project members.member' })
        const member = await Member.findOne({ _id: memberId })
        taskAssigned.emit({ $task: tsk, $member: member })
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
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe safes sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
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
        if (task) {
            console.log(taskId)
            console.log(_id)
            if (task.contributionType === 'assign' || (task.isSingleContributor === true && task.contributionType === 'open')) {
                const taskContributor = _.find(task.members, m => m.member.toString() === _id.toString() && m.status === 'approved')
                if (taskContributor) {
                    await Task.updateOne(
                        {
                            _id: taskId,
                            'members.member': _id
                        },
                        {
                            'taskStatus': 'submitted',
                            'members.$.submission': {
                                submittedAt: moment().utc().toDate(),
                                submissionLink: submissionLink,
                                note,
                            }
                        }
                    )
                } else {
                    return res.status(500).json({ message: 'Not permitted' })
                }
            }
            else if (task.isSingleContributor === false && task.contributionType === 'open') {
                // if (task.isFilterRoles) {
                //     const roles = _.get(task, 'validRoles', [])
                //     const eligible = _.find(_.get(dao, 'members', []), m => m.member.toString() === _id.toString() && roles.indexOf(m.role) > -1)
                //     if (!eligible)
                //         return res.status(500).json({ message: 'Not permitted' })

                // }
                await Task.updateOne({ _id: taskId }, {
                    $addToSet: {
                        members: {
                            member: _id,
                            status: 'approved',
                            submission: {
                                submittedAt: moment().utc().toDate(),
                                submissionLink: submissionLink,
                                note,
                            }
                        }
                    },
                })

            }
            else {
                return res.status(500).json({ message: 'Not permitted' })
            }
            const t = await Task.findOne({ _id: taskId }).populate({ path: 'members.member project reviewer', populate: { path: 'members' } });
            const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe safes sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })

            taskSubmitted.emit({ $task: t, $member: req.user })

            return res.status(200).json({ task: t, dao: d });
        }
        return res.status(500).json({ message: 'Task not found' })
    }
    catch (e) {
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
        if (offChainPayload) {
            const offChainTx = await OffChain.create(offChainPayload);
            chainTxnHash = offChainTx.safeTxHash;
        }
        if (!(task.isSingleContributor === false && task.contributionType === 'open')) {
            await Task.findOneAndUpdate(
                { _id: taskId },
                {
                    taskStatus: 'approved',
                    'compensation.delta': compensationDelta,
                    'compensation.recipient': recipient,
                    'compensation.txnHash': chainTxnHash,
                    'compensation.onChain': onChainSafeTxHash ? true : false
                }
            )
        }
        await Task.findOneAndUpdate(
            { _id: taskId, 'members.member._id': recipient },
            {
                'members.$.status': 'approved'
            }
        )
        await Task.updateOne(
            {
                _id: taskId,
                'members.member': recipient
            },
            {
                'members.$.status': 'submission_accepted'
            }
        )


        const t = await Task.findOne({ _id: taskId }).populate({ path: 'members.member project reviewer', populate: { path: 'members' } });
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe safes sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        const m = await Member.findOne({ _id: recipient })

        if (d.sbt) {
            const filter = { 'attributes.value': { $regex: new RegExp(`^${m.wallet}$`, "i") }, contract: d.sbt._id }
            const metadata = await Metadata.findOne(filter)
            console.log("metadata====>", metadata)
            if (metadata) {
                let attrs = [...metadata._doc.attributes];
                if (!find(attrs, attr => attr.trait_type === 'tasks')) {
                    attrs.push({ trait_type: 'tasks', value: t._id.toString() })
                } else {
                    attrs = attrs.map(attr => {
                        if (attr.trait_type === 'tasks') {
                            return { ...attr._doc, value: [...get(attr, 'value', '').split(','), t._id.toString()].join(',') }
                        }
                        return attr
                    })
                }
                if (!find(attrs, attr => attr.trait_type === 'task_names')) {
                    attrs.push({ trait_type: 'task_names', value: `${t.name} (${t._id})` })
                } else {
                    attrs = attrs.map(attr => {
                        if (attr.trait_type === 'task_names') {
                            return { ...attr._doc, value: [...get(attr, 'value', '').split(','), `${t.name} (${t._id})`].join(',') }
                        }
                        return attr
                    })
                }
                console.log("attrs", attrs);
                metadata._doc.attributes = attrs;
                await metadata.save();
            }
        }

        taskSubmissionApprove.emit({ $task: t, $member: m })
        return res.status(200).json({ task: t, dao: d });
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const rejectTask = async (req, res) => {
    const { _id } = req.user;
    const { daoUrl } = req.query;
    const { taskId } = req.params;
    const { reopen, rejectionNote, contributionType, isSingleContributor, newContributorId, rejectUser } = req.body;
    try {
        console.log("DATA : ", daoUrl, taskId, reopen, contributionType);
        let task = await Task.findOne({ _id: taskId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' })
        }
        // CASE 1 --- if contributionType is open && only single contributor allowed && admin wants to reopen the task --- 
        // reset data of the task,
        // change task status to open, 
        // change the approved user status to 'submission rejected'
        // store rejection note (if any)
        // update reopenedAt with current date
        if (contributionType === 'open' && isSingleContributor && reopen) {
            console.log("CASE 1")
            let newMembers = [];
            task.taskStatus = 'open';
            task.reopenedAt = Date.now();
            let user = _.find(_.get(task, 'members', []), m => m.status === 'approved')
            user.status = 'submission_rejected';
            user.rejectionNote = rejectionNote;
            newMembers.push(user);
            task.members = newMembers;
            console.log("new task : ", task);
            // save task now
            await task.save();

        }
        // CASE 2 --- if contributionType is open && only single contributor allowed && admin does not wants to reopen the task ---
        // simply reject the approved user's submission --- 'submission_rejected'
        // store rejection note (if any)
        // task status to 'rejected'
        else if (contributionType === 'open' && isSingleContributor && !reopen) {
            console.log("CASE 2")
            let newMembers = task.members;
            for (var i = 0; i < newMembers.length; i++) {
                if (newMembers[i].status === 'approved') {
                    newMembers[i].status = 'submission_rejected';
                    newMembers[i].rejectionNote = rejectionNote;
                }
            }
            task.members = newMembers;
            task.taskStatus = 'rejected';
            console.log("new task : ", task);
            await task.save();
        }
        // CASE 3 --- if contributionType is open && multiple contributors ---
        // simply reject the approved user's submission --- 'submission_rejected'
        // store rejection note (if any)
        // task status to 'rejected'
        else if (contributionType === 'open' && !isSingleContributor) {
            console.log("CASE 3 : ", rejectUser);
            let newMembers = task.members;
            for (var i = 0; i < newMembers.length; i++) {
                if (newMembers[i].member._id.toString() === rejectUser) {
                    newMembers[i].status = 'submission_rejected';
                    newMembers[i].rejectionNote = rejectionNote;
                }
            }
            task.members = newMembers;
            console.log("new task : ", task);
            await task.save();
        }


        // CASE 4 --- if contributionType is assigned && admin wants to change the contributor ---
        // reject approved user's submission --- 'submission_rejected'
        // store rejection note (if any)
        // add new contributor id to member list with status --- 'approved'
        else if (contributionType === 'assign' && newContributorId) {
            console.log("CASE 4")
            let newMembers = task.members;
            for (var i = 0; i < newMembers.length; i++) {
                if (newMembers[i].status === 'approved') {
                    newMembers[i].status = 'submission_rejected';
                    newMembers[i].rejectionNote = rejectionNote;
                }
            }
            let user = {};
            user.member = newContributorId;
            user.status = 'approved';
            newMembers.push(user);
            task.members = newMembers;
            task.taskStatus = 'assigned';
            console.log("new task : ", task);
            await task.save();
        }
        // CASE 5 --- if contributionType is assigned && admin does not wants to change the contributor ---
        // simply reject the approved user's submission --- 'submission_rejected'
        // store rejection note (if any)
        // task status to 'rejected'
        else if (contributionType === 'assign' && !newContributorId) {
            console.log("CASE 5")
            let newMembers = task.members;
            for (var i = 0; i < newMembers.length; i++) {
                if (newMembers[i].status === 'approved') {
                    newMembers[i].status = 'submission_rejected';
                    newMembers[i].rejectionNote = rejectionNote;
                }
            }
            task.members = newMembers;
            task.taskStatus = 'rejected';
            console.log("new task : ", task);
            await task.save();
        }

        const t = await Task.findOne({ _id: taskId }).populate({ path: 'members.member project reviewer', populate: { path: 'members' } });
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe safes sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })

        const m = await Member.findOne({ _id: rejectUser })

        taskSubmissionRejected.emit({ $task: t, $member: m })

        return res.status(200).json({ task: t, dao: d });
    }
    catch (e) {
        console.error("task.rejectTask::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const archiveTask = async (req, res) => {
    const { daoUrl } = req.query;
    const { taskId } = req.params;
    try {
        let task = await Task.findOne({ _id: taskId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' })
        }
        await Task.findOneAndUpdate(
            { _id: taskId },
            {
                archivedAt: Date.now(),
            }
        )
        const p = await Project.findOne({ _id: task.project }).populate({ path: 'tasks members', populate: { path: 'members.member' } });
        const t = await Task.findOne({ _id: taskId }).populate({ path: 'members.member project reviewer', populate: { path: 'members' } });
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe safes sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        taskDeleted.emit({ $task: t, $status: 'Closed' })
        return res.status(200).json({ task: t, dao: d, project: p });
    }
    catch (e) {
        console.error("task.archiveTask::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const deleteTask = async (req, res) => {
    const { daoUrl } = req.query;
    const { taskId } = req.params;
    try {
        let task = await Task.findOne({ _id: taskId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' })
        }
        await Task.findOneAndUpdate(
            { _id: taskId },
            {
                deletedAt: Date.now(),
            }
        )
        const t = await Task.findOne({ _id: taskId }).populate({ path: 'members.member project reviewer', populate: { path: 'members' } });
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe safes sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })

        taskDeleted.emit({ $task: t, $status: 'Deleted' })

        return res.status(200).json({ task: t, dao: d });
    }
    catch (e) {
        console.error("task.deleteTask::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const editTask = async (req, res) => {
    const { daoUrl } = req.query;
    const { taskId } = req.params;
    const {
        name,
        description,
        project,
        discussionChannel,
        deadline,
        submissionLink,
        compensation,
        contributionType,
        isSingleContributor,
        isFilterRoles,
        validRoles,
        members,
        invitations,
        reviewer
    } = req.body;

    console.log("invitations : ", req.body.invitations);

    let taskStatus = contributionType === 'open' ? 'open' : 'assigned';

    console.log("req body : ", req.body)
    try {
        let task = await Task.findOne({ _id: taskId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' })
        }

        //check if projectId has changed
        let prevProjectId = task.project;
        let projectId = project;
        if (projectId && prevProjectId && prevProjectId.toString() !== projectId) {
            console.log("ProjectId has changed")
            // add task in new project
            let projectNew = await Project.findOne({ _id: projectId });
            if (projectNew) {
                projectNew.tasks.push(taskId);
                projectNew = await projectNew.save();
            }
            // remove task from old project
            let projectOld = await Project.findOne({ _id: prevProjectId });
            if (projectOld) {
                let tempTasks = projectOld.tasks;
                tempTasks = tempTasks.filter(e => e.toString() !== taskId)
                projectOld.tasks = tempTasks;
                projectOld = await projectOld.save();
            }
        }

        await Task.findOneAndUpdate(
            { _id: taskId },
            {
                ...req.body,
                taskStatus,
                updatedAt: Date.now(),
            }
        )
        const p = await Project.findOne({ _id: prevProjectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } });
        const t = await Task.findOne({ _id: taskId }).populate({ path: 'members.member project reviewer', populate: { path: 'members' } });
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe safes sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        return res.status(200).json({ task: t, dao: d, project: p });
    }
    catch (e) {
        console.error("task.editTask::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const editDraftTask = async (req, res) => {
    const { daoUrl } = req.query;
    const { taskId } = req.params;
    console.log("Task id : ", taskId)
    const {
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
        invitations,
    } = req.body;
    try {
        let task = await Task.findOne({ _id: taskId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' })
        }

        //check if projectId has changed
        let prevProjectId = task.project;
        if (projectId && prevProjectId && prevProjectId.toString() !== projectId) {
            // add task in new project
            let projectNew = await Project.findOne({ _id: projectId });
            if (projectNew) {
                projectNew.tasks.push(taskId);
                projectNew = await projectNew.save();
            }
            // remove task from old project
            let projectOld = await Project.findOne({ _id: prevProjectId });
            if (projectOld) {
                let tempTasks = projectOld.tasks;
                tempTasks = tempTasks.filter(e => e.toString() !== taskId)
                projectOld.tasks = tempTasks;
                projectOld = await projectOld.save();
            }
        }
        await Task.findOneAndUpdate(
            { _id: taskId },
            {
                // taskStatus: applicant?._id ? 'assigned' : 'open',
                taskStatus: 'open',
                name,
                description,
                // members: applicant?._id ? [{ member: applicant._id, status: 'approved', appliedAt: Date.now(), note: '', rejectionNote: '', links: [] }] : [],
                members: [],
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
                invitations,
                updatedAt: Date.now(),
                draftedAt: Date.now()
            }
        )
        const p = await Project.findOne({ _id: prevProjectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } });
        const t = await Task.findOne({ _id: taskId }).populate({ path: 'members.member project reviewer', populate: { path: 'members' } });
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe safes sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        return res.status(200).json({ task: t, dao: d, project: p });
    }
    catch (e) {
        console.error("task.editDraftTask::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const convertDraftTask = async (req, res) => {
    const { daoUrl } = req.query;
    const { taskId } = req.params;
    const { _id, wallet } = req.user;
    const {
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
        invitations,
    } = req.body;
    try {
        let task = await Task.findOne({ _id: taskId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' })
        }

        //check if projectId has changed
        let prevProjectId = task.project;
        if (projectId && prevProjectId && prevProjectId.toString() !== projectId) {
            // add task in new project
            let projectNew = await Project.findOne({ _id: projectId });
            if (projectNew) {
                projectNew.tasks.push(taskId);
                projectNew = await projectNew.save();
            }
            // remove task from old project
            let projectOld = await Project.findOne({ _id: prevProjectId });
            if (projectOld) {
                let tempTasks = projectOld.tasks;
                tempTasks = tempTasks.filter(e => e.toString() !== taskId)
                projectOld.tasks = tempTasks;
                projectOld = await projectOld.save();
            }
        }
        await Task.findOneAndUpdate(
            { _id: taskId },
            {
                // taskStatus: applicant?._id ? 'assigned' : 'open',
                taskStatus: 'open',
                name,
                description,
                // members: applicant?._id ? [{ member: applicant._id, status: 'approved', appliedAt: Date.now(), note: '', rejectionNote: '', links: [] }] : [],
                members: [],
                project: projectId,
                discussionChannel,
                deadline,
                submissionLink,
                compensation,
                reviewer,
                creator: _id,
                contributionType,
                isSingleContributor,
                isFilterRoles,
                validRoles,
                invitations,
                updatedAt: Date.now(),
                draftedAt: null
            }
        )
        const p = await Project.findOne({ _id: prevProjectId }).populate({ path: 'tasks members', populate: { path: 'members.member' } });
        const t = await Task.findOne({ _id: taskId }).populate({ path: 'members.member project reviewer', populate: { path: 'members' } });
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe safes sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        return res.status(200).json({ task: t, dao: d, project: p });
    }
    catch (e) {
        console.error("task.convertTask::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}


module.exports = { getById, storeGithubIssues, create, draftTask, applyTask, assignTask, rejectTaskMember, submitTask, approveTask, rejectTask, archiveTask, deleteTask, editTask, editDraftTask, convertDraftTask };