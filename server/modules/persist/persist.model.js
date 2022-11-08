const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');

/**
 * Safe Schema
 */
const PersistSchema = new mongoose.Schema({
  id: { type: String },
  key: { type: String },
  value: { type: mongoose.Schema.Types.Object },
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
 PersistSchema.method({
});

/**
 * Statics
 */
 PersistSchema.statics = {

};

/**
 * @typedef DAO
 */
module.exports = mongoose.model('Persist', PersistSchema);
