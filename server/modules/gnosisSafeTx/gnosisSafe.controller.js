const gnosisSafeTxModel = require("./gnosisSafeTx.model");

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
    const { safeAddress, rawTx } = req.body
    try {
        const txn = await gnosisSafeTxModel.findOneAndUpdate({ safeAddress, 'rawTx.safeTxHash': rawTx.safeTxHash }, { $set: { rawTx } })
        const txnResponse = await gnosisSafeTxModel.findOne({ safeAddress, 'rawTx.safeTxHash': rawTx.safeTxHash })
        return res.status(200).json(txnResponse)
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: e })
    }
}

const updateTxLabel = async (req, res) => {
    console.log(req.body)
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

module.exports = { load, create, update, updateTxLabel };
