const Transaction = require('@server/modules/transaction/transaction.model');

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
        return res.status(200).json({ message: 'Txn created successfully' })
    }
    catch(e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const update = async (req, res) => {
    const { _id } = req.user;
    const { rejectTxHash, nonce } = req.body;
    try {
        await Transaction.updateMany({ nonce: nonce }, { rejectTxHash: rejectTxHash })
        return res.status(200).json({ message: 'Txn updated successfully' })
    }
    catch(e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

module.exports = {load, create, update };
