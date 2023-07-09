const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');

/**
 * Safe Schema
 */
const StripeAccountSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.Object },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
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
 * @typedef DAO
 */
module.exports = mongoose.model('StripeAccount', StripeAccountSchema);
