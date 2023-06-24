const mongoose = require("mongoose");

const GnosisSafeTx = new mongoose.Schema({
    chainId: { type: Number },
    safeAddress: { type: String },
    rawTx: { type: Object },
    daoId: { type: mongoose.Schema.Types.ObjectId, ref: 'DAO', default: null },
    metadata: { type: Object }
});
module.exports = mongoose.model("GnosisSafeTx", GnosisSafeTx);
