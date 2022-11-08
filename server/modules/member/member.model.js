const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');

/**
 * User Schema
 */
const MemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    default: ''
  },
  image: {
    type: String,
    required: false,
    default: null
  },
  wallet: {
    type: String,
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
  },
  sbtMetaData: {
    type: Array,
    default: []
  },
  notionUserId: {
    type: String,
    required: false,
    default: null
  },
  earnings: {
    type: [{
      currency: String,
      value: Number,
    }],
    default: []
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
MemberSchema.method({
});

/**
 * Statics
 */
MemberSchema.statics = {

};

/**
 * @typedef User
 */
module.exports = mongoose.model('Member', MemberSchema);
