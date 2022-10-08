const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');

/**
 * Safe Schema
 */
const TransactionSchema = new mongoose.Schema({
  safeTxHash: {
    type: String,
    required: true
  },
  rejectTxHash: {
    type: String,
    default: null,
    required: false
  },
  nonce: {
    type: String,
    required: true
  },
  data: [{ type: mongoose.Schema.Types.Object }],
  status: {
    type: Number,
    default: -1,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date,
    default: null
  }
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
 TransactionSchema.method({
});

/**
 * Statics
 */
 TransactionSchema.statics = {

};

/**
 * @typedef DAO
 */
module.exports = mongoose.model('Transaction', TransactionSchema);
