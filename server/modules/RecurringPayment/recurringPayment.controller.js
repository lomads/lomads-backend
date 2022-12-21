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
    deleteRecurringTxn,
    completeQueuePayment,
    rejectRecurringPayment
};
