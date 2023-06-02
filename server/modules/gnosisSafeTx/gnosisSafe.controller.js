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

module.exports = { load };
