const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');

/**
 * Safe Schema
 */
const TransactionSchema = new mongoose.Schema({
  safeTransactionHash: {
    type: String,
    required: true
  },
  rejectTransactionHash: {
    type: String,
    default: null,
    required: false
  },
  nonce: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  recipient: {
     type: mongoose.Schema.Types.ObjectId, ref: 'Member'
  },
  paymentReason: {
    type: String,
    default: null,
    required: false
  },
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
