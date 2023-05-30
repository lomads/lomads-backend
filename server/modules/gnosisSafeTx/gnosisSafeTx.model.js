const mongoose = require("mongoose");

const GnosisSafeTx = new mongoose.Schema({
    safeAddress: { type: String },
    rawTx: { type: Object },
});
module.exports = mongoose.model("GnosisSafeTx", GnosisSafeTx);
