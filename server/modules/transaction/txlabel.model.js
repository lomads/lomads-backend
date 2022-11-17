const mongoose = require("mongoose");

const TxLabel = new mongoose.Schema({
    safeAddress: { type: String },
    safeTxHash: { type: String },
    recipient: { type: String },
    label: { type: String }
});

module.exports = mongoose.model("TxLabel", TxLabel);
