import mongoose from "mongoose";

const TransactionResult = new mongoose.Schema({
  baseGas: {
    type: Number,
  },
  blockNumber: {
    type: Number || null,
  },
  confirmations: {
    type: [],
  },
  confirmationsRequired: {
    type: Object || Array || String || Number || Boolean || null,
  },
  data: {
    type: String || null,
  },
  dataDecoded: {
    type: Object || null,
  },
  ethGasPrice: {
    type: Number || String || null,
  },
  executionDate: {
    type: String || null,
  },
  executor: {
    type: String || null,
  },
  fee: {
    type: String || Number || null,
  },
  gasPrice: {
    type: String || Number || null,
  },
  gasToken: {
    type: String || null,
  },
  gasUsed: {
    type: String || Number || null,
  },
  isExecuted: {
    type: Boolean,
  },
  isSuccessful: {
    type: Boolean || null,
  },
  maxFeePerGas: {
    type: String || Number || null,
  },
  maxPriorityFeePerGas: {
    type: String || Number || null,
  },
  modified: {
    type: String || Number || null,
  },
  nonce: {
    type: Number,
  },
  operation: {
    type: Number,
  },
  origin: {
    type: String || Object || null,
  },
  refundReceiver: {
    type: String || null,
  },
  safe: {
    type: String || null,
  },
  safeTxGas: {
    type: String || null,
  },
  safeTxHash: {
    type: String || null,
  },
  signatures: {
    type: Object || Array || String || Number || null,
  },
  submissionDate: {
    type: String || null,
  },
  to: {
    type: String || null,
  },
  transactionHash: {
    type: String || null,
  },
  trusted: {
    type: Boolean || null,
  },
  value: {
    type: String || null,
  },
});
module.exports = mongoose.model("TransactionResult", TransactionResult);
