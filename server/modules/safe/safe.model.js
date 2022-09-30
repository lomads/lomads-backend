const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');

/**
 * Safe Schema
 */
const SafeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  dao: { type: mongoose.Schema.Types.ObjectId, ref: 'DAO' },
  owners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
  token: {
    type: String,
    required: false,
    default: null
  },
  balance: {
    type: String,
    required: false,
    default: null
  },
  transactions: [{ type: String }],
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
 SafeSchema.method({
});

/**
 * Statics
 */
 SafeSchema.statics = {

};

/**
 * @typedef DAO
 */
module.exports = mongoose.model('Safe', SafeSchema);
