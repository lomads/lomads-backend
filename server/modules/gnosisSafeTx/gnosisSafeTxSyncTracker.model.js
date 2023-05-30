const mongoose = require("mongoose");

const GnosisSafeTxSyncTracker = new mongoose.Schema({
    safeAddress: { type: String },
    chainId: { type: Number },
    lastSync: { type: Date, default: null }
});
module.exports = mongoose.model("GnosisSafeTxSyncTracker", GnosisSafeTxSyncTracker);
