const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');

/**
 * Safe Schema
 */
const NotificationSchema = new mongoose.Schema({
  daoId: { type: mongoose.Schema.Types.ObjectId, ref: 'DAO' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  type: { type: String },
  title: { type: String },
  notification: { type: String },
  model: { type: String },
  callToAction: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
  read: [{type: mongoose.Schema.Types.ObjectId, ref: 'Member'}],
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
 NotificationSchema.method({
});

/**
 * Statics
 */
 NotificationSchema.statics = {

};

/**
 * @typedef DAO
 */
module.exports = mongoose.model('Notification', NotificationSchema);
