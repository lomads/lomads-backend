const RecurringPayment = require('@server/modules/RecurringPayment/recurringPayment.model');
const RecurringPaymentQueue = require('@server/modules/RecurringPayment/recurringPaymentQueue.model');
const moment = require('moment')

const load = async (req, res, next) => {
    const { _id } = req.user;
    const { safeAddress } = req.query;
    try {
        const queue = await RecurringPayment.find({ safeAddress, deletedAt: null }).populate({ path: 'queue receiver delegate' })
        if(queue)
            return res.status(200).json(queue) 
        return res.status(500).json({ message: 'Something went wrong' }) 
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' }) 
    }
}

const create = async (req, res, next) => {
    const { _id } = req.user;
    try {
        let recurringPayment = await RecurringPayment.create(req.body)
        if(recurringPayment) {
            // let nextDate = moment(recurringPayment.startDate).startOf('day').utc().toDate()
            // const q = await RecurringPaymentQueue.create({ safeAddress: recurringPayment.safeAddress, recurringPayment: recurringPayment._id,  nonce: `${moment(nextDate).unix()}`})
            // await RecurringPayment.updateOne({ _id: recurringPayment._id }, { $set: { nextDate: nextDate }, $addToSet: { queue: q._id } })
            return res.status(200).json(recurringPayment) 
        }
        return res.status(500).json({ message: 'Something went wrong' }) 
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' }) 
    }
}

const update = async (req, res) => {
    const { recurringTxId } = req.params;
    try {

        const oldrp = await RecurringPayment.findOne({ _id: recurringTxId })
        const rp =  await RecurringPayment.findOneAndUpdate({ _id: recurringTxId }, { $set: { ...req.body } })

        if(rp.active == true) {

            if(oldrp.startDate !== req.body.startDate) {
                console.log("oldrp.frequency", req.body.startDate)
                await RecurringPaymentQueue.deleteOne({ recurringPayment: recurringTxId, moduleTxnHash:  null })
                let nextNonce = moment(req.body.startDate).unix();
                const q = await RecurringPaymentQueue.create({ recurringPayment: recurringTxId, nonce: nextNonce })
                await RecurringPayment.updateOne({ _id: recurringTxId },{ $set: { nextDate: moment.unix(nextNonce).toDate() }, $addToSet: { queue: q._id } })
            }

            if(oldrp.frequency !== req.body.frequency) {
                const lastPayment = await RecurringPaymentQueue.findOne({ recurringPayment: recurringTxId, moduleTxnHash: { $ne: null } }).sort({ nonce: 'desc' }).exec()
                await RecurringPaymentQueue.deleteOne({ recurringPayment: recurringTxId, moduleTxnHash:  null })
                let nextNonce = moment(req.body.startDate).unix();
                if(lastPayment)
                    nextNonce = moment.unix(lastPayment.nonce).add(1, req.body.frequency === 'weekly' ? 'week' : 'month').unix();
                const q = await RecurringPaymentQueue.create({ recurringPayment: recurringTxId, nonce: nextNonce })
                await RecurringPayment.updateOne({ _id: recurringTxId },{ $set: { nextDate: moment.unix(nextNonce).toDate() }, $addToSet: { queue: q._id } })
            }

            if(req.body.ends.key === 'AFTER') {
                const occurances = await RecurringPaymentQueue.find({ recurringPayment: recurringTxId, moduleTxnHash: { $ne: null } })
                console.log(occurances)
                if(occurances.length >= req.body.ends.value) {
                    await RecurringPaymentQueue.deleteMany({ recurringPayment: recurringTxId, moduleTxnHash: null })
                    rp.nextDate = null
                    await rp.save()
                }
            } else if (req.body.ends.key === 'ON') {
                const queueP = await RecurringPaymentQueue.findOne({ recurringPayment: recurringTxId, moduleTxnHash: null })
                if(moment.unix(queueP.nonce).startOf('day').isAfter(moment(req.body.ends.value, 'YYYY-MM-DD').startOf('day'))) {
                    console.log(queueP)
                    await RecurringPaymentQueue.deleteMany( { recurringPayment: recurringTxId, moduleTxnHash: null } )
                    rp.nextDate = null
                    await rp.save()
                }
            }
        }
        const rps = await RecurringPayment.find({ _id: recurringTxId, deletedAt: null }).populate({ path: 'queue receiver delegate' })
        return res.status(200).json(rps) 
    } catch(e) {
        console.log(e)
    }
}

const deleteRecurringTxn = async (req, res, next) => {
    const { txId } = req.params;
    try {
        const rp = await RecurringPayment.findOne({ _id: txId })
        if(!rp)
            return res.status(404).json({ message: 'Txn not found' }) 
        if(rp.active) {
            await RecurringPayment.findOneAndUpdate(
                { _id: txId, deletedAt: null },
                { $set: { nextDate: null } }
                //{ $set: { deletedAt: moment().utc().toDate() } }
            )
        } else {
            await RecurringPayment.findOneAndUpdate(
                { _id: txId, deletedAt: null },
                { $set: { deletedAt: moment().utc().toDate() } }
            )
        }
        await RecurringPaymentQueue.deleteMany(
            { recurringPayment: txId, moduleTxnHash: null },
        )
        const queue = await RecurringPayment.find({ safeAddress: rp.safeAddress, deletedAt: null }).populate({ path: 'queue receiver delegate' })
        if(queue)
            return res.status(200).json(queue) 
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' }) 
    }
}

const rejectRecurringPayment = async (req, res, next) => {
    const { txHash } = req.body;
    try {
        const rp = await RecurringPayment.findOne({ allowanceTxnHash: txHash })
        if(rp) {
            await RecurringPayment.findOneAndUpdate(
                { _id: rp._id, deletedAt: null },
                { $set: { deletedAt: moment().utc().toDate() } }
            )
            await RecurringPaymentQueue.deleteMany(
                { recurringPayment: rp._id, moduleTxnHash: null },
            )
        }
        return res.status(200).json({message: 'Success'}) 
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' }) 
    }
}

const completeQueuePayment = async (req, res, next) => {
    const { queueId } = req.params;
    const { txHash } = req.body
    try {
        let queue = await RecurringPaymentQueue.findOne({ _id: queueId })
        if(queue) {
            queue.moduleTxnHash = txHash
            queue = await queue.save()
        }
        
        const recurringPayment = await RecurringPayment.findOne({ _id: queue.recurringPayment, deletedAt: null })
        const nextPayment = moment.unix(queue.nonce).startOf('day').add(1, recurringPayment.frequency === 'weekly' ? 'week': 'month').toDate()
        if(recurringPayment.ends && recurringPayment.ends.key !== 'NEVER') {
            if(recurringPayment.ends.key === "ON") {
                if(moment(nextPayment).utc().isSameOrAfter(moment(recurringPayment.ends.value, 'YYYY-MM-DD').endOf('day').utc())) {
                    const rp = await RecurringPayment.find({ deletedAt: null, safeAddress: recurringPayment.safeAddress }).populate({ path: 'queue receiver delegate' })
                    return res.status(200).json(rp) 
                }
            } else if(recurringPayment.ends.key === "AFTER") {
                const queues = await RecurringPaymentQueue.find({ recurringPayment: recurringPayment._id })
                if(queues.length >= recurringPayment.ends.value) {
                    const rp = await RecurringPayment.find({ deletedAt: null, safeAddress: recurringPayment.safeAddress }).populate({ path: 'queue receiver delegate' })
                    return res.status(200).json(rp)   
                }
            }
        }
        const q = await RecurringPaymentQueue.create({ recurringPayment: recurringPayment._id, nonce: `${moment(nextPayment).unix()}`})
        await RecurringPayment.updateOne({ _id: recurringPayment._id },{ $set: { nextDate: nextPayment }, $addToSet: { queue: q._id } })
        const rp = await RecurringPayment.find({ deletedAt: null, safeAddress: recurringPayment.safeAddress }).populate({ path: 'queue receiver delegate' })
        if(rp)
            return res.status(200).json(rp) 
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' }) 
    }
}

module.exports = {
    load,
    create,
    update,
    deleteRecurringTxn,
    completeQueuePayment,
    rejectRecurringPayment
};
