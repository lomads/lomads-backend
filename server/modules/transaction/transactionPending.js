import mongoose from "mongoose";

const TransactionPending = new mongoose.Schema({
  position: {
    type: Number || null,
  },
  results: {
    type: [] || null,
  },
});

module.exports = mongoose.model("TransactionPending", TransactionPending);
