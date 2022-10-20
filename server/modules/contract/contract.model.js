const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');

/**
 * Safe Schema
 */
const ContractSchema = new mongoose.Schema({
  name: { type: String },
  image: { type: String },
  tokenSuppy: { type: Number },
  whitelisted: { type: mongoose.Schema.Types.Boolean, default: false },
  address: { type: String },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  metadata: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Metadata' }],
  contactDetail: { type: Array },
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
ContractSchema.method({
});

/**
 * Statics
 */
ContractSchema.statics = {

};

/**
 * @typedef DAO
 */
module.exports = mongoose.model('Contract', ContractSchema);
