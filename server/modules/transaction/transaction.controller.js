const Transaction = require('@server/modules/transaction/transaction.model');
const Safe = require('@server/modules/safe/safe.model');
const _ = require('lodash');
const axios = require('axios');

const load = async (req, res) => {
    const { _id } = req.user;
    try {
        let txns = await Transaction.find({})
        return res.status(200).json(txns)
    }
    catch (e) {
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
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const update = async (req, res) => {
    const { _id } = req.user;
    const { safeTxHash, reason, recipient, txType = null, safeAddress, chainId = 5 } = req.body;
    try {
        let txn = await Transaction.findOne({ safeTxHash: { $regex: new RegExp(`^${safeTxHash}$`, "i") } })
        console.log("TXN : ", txn)
        if (!txn) {
            if (txType === 'ETHEREUM_TRANSACTION') {
                let txn = new Transaction({
                    safeAddress,
                    safeTxHash: safeTxHash,
                    rejectTxHash: null,
                    data: [{ reason, recipient }],
                    nonce: '0',
                })
                txn = await txn.save();
                const safe = await Safe.updateMany(
                    { address: safeAddress },
                    { $addToSet: { transactions: txn._id } }
                )
                txn = await Transaction.findOne({ safeTxHash: { $regex: new RegExp(`^${safeTxHash}$`, "i") } })
                return res.status(200).json(txn)
            }

            let url = `https://safe-transaction-goerli.safe.global/api/v1/multisig-transactions/${safeTxHash}/`;
            if(+chainId === 137)
                url = `https://safe-transaction-polygon.safe.global/api/v1/multisig-transactions/${safeTxHash}/`

            const safeTxn = await axios.get(url)
            if (safeTxn && safeTxn.data) {
                let txn = new Transaction({
                    safeAddress: safeTxn.data.safe,
                    safeTxHash: safeTxHash,
                    rejectTxHash: null,
                    data: [{ reason, recipient: _.get(safeTxn.data, 'dataDecoded.parameters[0].value', _.get(safeTxn.data, 'to', '')) }],
                    nonce: safeTxn.data.nonce,
                })
                txn = await txn.save();
                const safe = await Safe.updateMany(
                    { address: safeTxn.data.safe },
                    { $addToSet: { transactions: txn._id } }
                )
                txn = await Transaction.findOne({ safeTxHash: { $regex: new RegExp(`^${safeTxHash}$`, "i") } })
                return res.status(200).json(txn)
            }
            else {
                return res.status(404).json({ message: 'Transaction not found' })
            }
        }

        let rec = _.find(txn.data, t => t.recipient.toLowerCase() === recipient.toLowerCase())

        if(rec) {
            txn.data = txn.data.map(d => {
                if (d.recipient.toLowerCase() === recipient.toLowerCase())
                    return { ...d, reason }
                return d;
            })
        } else {
            txn.data = [ ...txn.data, { recipient, reason } ] 
        }
        txn = await txn.save();
        txn = await Transaction.findOne({ safeTxHash: { $regex: new RegExp(`^${safeTxHash}$`, "i") } })
        return res.status(200).json(txn)
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

module.exports = { load, create, update };
