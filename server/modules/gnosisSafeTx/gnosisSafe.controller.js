const gnosisSafeTxModel = require("./gnosisSafeTx.model");
const gnosisSafeTxSyncTrackerModel = require("./gnosisSafeTxSyncTracker.model");
const Member = require('@server/modules/member/member.model');
const Task = require('@server/modules/task/task.model');
const { taskPaid } = require('@server/events');
const _ = require('lodash')

const get = async (req, res) => {
    try {
        const { safeTxHash } = req.params;
        const { safeAddress } = req.query;
        const txn = await gnosisSafeTxModel.findOne({ safeAddress, 'rawTx.safeTxHash' : safeTxHash })
        return res.status(200).json(txn)
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: e })
    }
}

const load = async (req, res) => {
    try {
        const { safes } = req.query;
        console.log(safes)
        const txns = await gnosisSafeTxModel.find({ safeAddress: { $in: safes.split(',') } }).sort({ "rawTx.executionDate": 1, "rawTx.submissionDate": 1 })
        return res.status(200).json(txns)
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: e })
    }
}

const create = async (req, res) => {
    try {
        const txn = await gnosisSafeTxModel.create(req.body)
        return res.status(200).json(txn)
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: e })
    }
}

const update = async (req, res) => {
    const { safeAddress, rawTx, offChainTxHash = null } = req.body
    try {
        const txn = await gnosisSafeTxModel.findOneAndUpdate({ safeAddress, 'rawTx.safeTxHash': offChainTxHash ? offChainTxHash : rawTx.safeTxHash }, { $set: { rawTx } })
        const txnResponse = await gnosisSafeTxModel.findOne({ safeAddress, 'rawTx.safeTxHash': rawTx.safeTxHash })
        return res.status(200).json(txnResponse)
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: e })
    }
}

const updateTxLabel = async (req, res) => {
    const { safeAddress, safeTxHash, label, tag, recipient } = req.body;
    try {
        if(label){
            await gnosisSafeTxModel.findOneAndUpdate(
                { safeAddress, 'rawTx.safeTxHash': safeTxHash },
                { $set: { [`metadata.${recipient}.label`]: label } }
            )
        }
        if(tag){
            await gnosisSafeTxModel.findOneAndUpdate(
                { safeAddress, 'rawTx.safeTxHash': safeTxHash },
                { $set: { [`metadata.${recipient}.tag`]: tag } }
            )
        }
        const gTx = await gnosisSafeTxModel.findOne({ safeAddress, 'rawTx.safeTxHash': safeTxHash })
        return res.status(200).json(gTx)
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const confirmOffChainTxn = async (req, res) => {
    const { safeTxHash } = req.params;
    const { safeAddress, confirmation } = req.body;
    try {
        let offChainTx = await gnosisSafeTxModel.findOneAndUpdate(
            { safeAddress, 'rawTx.safeTxHash': safeTxHash },
            { $addToSet: { 'confirmations': req.body.confirmation } }
        );
        offChainTx = await gnosisSafeTxModel.findOne(
            { safeAddress, 'rawTx.safeTxHash': safeTxHash }
        );
        return res.status(200).json(offChainTx)
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const postExecution = async (req, res) => {
    const { safeTxHash } = req.params;
    try {
        const actionList = req.body;
        for (let index = 0; index < actionList.length; index++) {
            const actions = actionList[index];
            console.log(actions)
            if(actions?.UPDATE_EARNING) {
                let { user: recipient, daoId, symbol, value, currency } = actions?.UPDATE_EARNING;
                if(value && currency && !isNaN(value) && symbol) {
                    let user = await Member.findOne({ wallet: { $regex: new RegExp(`^${recipient || '0x'}$`, "i") } })
                    if(user) {
                        let earnings = user.earnings
                        const symbolExists = _.find(earnings, e => e.symbol === symbol && String(e.daoId) === daoId)
                        console.log("symbolExists", earnings, symbolExists)
                        if(symbolExists) {
                            earnings = earnings.map(e => {
                                console.log("symbolExists", e.symbol === symbol && String(e.daoId) === daoId)
                                if(e.symbol === symbol && String(e.daoId) === daoId){
                                    return { ...e._doc, value: +e.value + (+value) }
                                }
                                return e
                            }) 
                        } else {
                            earnings.push({
                                symbol: symbol,
                                value: +value,
                                currency: currency,
                                daoId
                            })
                        }
                        await Member.findOneAndUpdate(
                            { _id: user?._id },
                            { earnings }
                        )
                    }
                }

            } 
            
            if (actions?.RESET_SWEAT) {
                let { user: recipient, daoId } = actions?.RESET_SWEAT;
                let user = await Member.findOne({ wallet: { $regex: new RegExp(`^${recipient || '0x'}$`, "i") } })
                if(user) {
                    let earnings = user.earnings;
                    earnings = earnings.map(e => {
                        if(e.symbol === 'SWEAT' && String(e.daoId) === daoId) {
                            return { ...e._doc, value: 0 }
                        }
                        return e
                    }) 
                    await Member.findOneAndUpdate(
                        { _id: user?._id },
                        { earnings }
                    )
                }
            }

            if(actions?.TASK_PAID) {
                let { taskId, user: recipient } = actions?.TASK_PAID;
                let user = await Member.findOne({ wallet: { $regex: new RegExp(`^${recipient || '0x'}$`, "i") } })
                let task = await Task.findOne({ $or: [{ _id: taskId }, { 'compensation.txnHash': safeTxHash }] })
                if(user && task && ((task.contributionType !== 'open') || (task.contributionType === 'open' && task.isSingleContributor === true))){
                    task.taskStatus = 'paid'
                    await task.save()
                    taskPaid.emit({ $task: task, $member: user })
                }
            }
        }
        return res.status(200).json({ message: 'Success' })
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const syncSafe = async (req, res) => {
    const { safes } = req.body;
    try {
        await gnosisSafeTxSyncTrackerModel.findOneAndUpdate({ safeAddress: { $in: safes } }, { $set: { lastSync: null } })
        return res.status(200).json({ message: "Sync triggered. Safe will sync in few seconds.. " })
    } catch (e) {
        console.log(e)
    }
}

module.exports = { syncSafe, get, load, create, update, updateTxLabel, confirmOffChainTxn, postExecution };
