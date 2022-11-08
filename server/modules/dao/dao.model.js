const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');

/**
 * Dao Schema
 */
const DAOSchema = new mongoose.Schema({
  chainId: {
    type: Number,
    default: 5,
    required: true
  },
  contractAddress: {
    type: String,
    default: null,
    required: false
  },
  url: {
    type: String,
    default: null,
    required: false
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: null,
    required: false
  },
  image: {
    type: String,
    default: null,
    required: false
  },
  safe: { type: mongoose.Schema.Types.ObjectId, ref: 'Safe' },
  sbt: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' },
  members: [{
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    creator: { type: mongoose.Schema.Types.Boolean, default: false },
    joined: { type: Date, default: Date.now },
    role: { type: String }
  }],
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  links: {
    type: Array,
    default: [],
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
DAOSchema.method({
});

/**
 * Statics
 */
DAOSchema.statics = {

};

/**
 * @typedef DAO
 */
module.exports = mongoose.model('DAO', DAOSchema);
