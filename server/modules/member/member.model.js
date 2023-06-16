const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');

/**
 * User Schema
 */
const MemberSchema = new mongoose.Schema({
  platformRole: {
    type: String,
    required: false,
    default: "member",
  },
  name: {
    type: String,
    required: false,
    default: "",
  },
  image: {
    type: String,
    required: false,
    default: null,
  },
  wallet: {
    type: String,
    unique: true,
    required: true,
  },
  onboardingViewCount: {
    type: [{ type: mongoose.Schema.Types.ObjectId }],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  sbtTokens: [{ type: mongoose.Schema.Types.ObjectId, ref: "Contract" }],
  sbtMetaData: [{ type: mongoose.Schema.Types.ObjectId, ref: "Metadata" }],
  notionUserId: {
    type: String,
    required: false,
    default: null,
  },
  earnings: {
    type: [
      {
        symbol: String, 
        currency: String,
        value: Number,
        daoId: { type: mongoose.Schema.Types.ObjectId, ref: "DAO" },
      },
    ],
    default: [],
  },
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

MemberSchema.index({ wallet: 'text' });

/**
 * @typedef User
 */
module.exports = mongoose.model('Member', MemberSchema);
