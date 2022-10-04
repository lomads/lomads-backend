const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');

/**
 * Safe Schema
 */
const MetadataSchema = new mongoose.Schema({
  description: { type: String },
  name: { type: String },
  image: { type: String },
  attributes : [{
    trait_type : String,
    value : mongoose.Schema.Types.Mixed
  }],
  contract : {type: mongoose.Schema.Types.ObjectId, ref: 'Contract'},
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
 MetadataSchema.method({
});

/**
 * Statics
 */
 MetadataSchema.statics = {

};

/**
 * @typedef DAO
 */
module.exports = mongoose.model('Metadata', MetadataSchema);
