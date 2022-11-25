const mongoose = require("mongoose");

const TxLabel = new mongoose.Schema({
    safeAddress: { type: String },
    safeTxHash: { type: String },
    recipient: { type: String },
    label: { type: String },
    sweatConversion: { type: mongoose.Schema.Types.Boolean, default: false },
});

module.exports = mongoose.model("TxLabel", TxLabel);
