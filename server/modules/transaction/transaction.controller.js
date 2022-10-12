const Transaction = require('@server/modules/transaction/transaction.model');
const Safe = require('@server/modules/safe/safe.model');

const load = async (req, res) => {
    const { _id } = req.user;
    try {
        let txns = await Transaction.find({})
        return res.status(200).json(txns)
    }
    catch(e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const create = async (req, res) => {
    const { _id } = req.user;
    try {
        let txn = new Transaction({ ...req.body })
        txn = await txn.save()
        const safe = await Safe.updateMany(
            { address: req.body.safeAddress },
            { $addToSet: { transactions: txn._id } }
        )
        return res.status(200).json({ message: 'Txn created successfully' })
    }
    catch(e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const update = async (req, res) => {
    const { _id } = req.user;
    console.log(req.body)
    const { safeTxHash, reason, recipient } = req.body;
    try {
        let txn = await Transaction.findOne({ safeTxHash: { $regex: new RegExp(`^${safeTxHash}$`, "i") } })
        if(!txn)
            return res.status(404).json({ message: 'Transaction not found' })
        txn.data = txn.data.map(d => {
            if(d.recipient.toLowerCase() === recipient.toLowerCase())
                return { ...d, reason }
            return d;
        })
        txn = await txn.save();
        txn = await Transaction.findOne({ safeTxHash: { $regex: new RegExp(`^${safeTxHash}$`, "i") } })
        return res.status(200).json(txn)
    }
    catch(e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

module.exports = {load, create, update };
