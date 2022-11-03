const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');

/**
 * Safe Schema
 */
const TaskSchema = new mongoose.Schema({
    name: { type: String },
    description: { type: String },
    creator: { type: String },
    members: [{
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
        appliedAt: { type: Date, default: Date.now },
        isApproved: { type: Boolean, default: false },
        note: { type: String, default: '' },
        links: { type: Array, default: [] }
    }],
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    discussionChannel: { type: String },
    deadline: {
        type: Date,
        default: null
    },
    submissionLink: { type: String },
    compensation: { type: mongoose.Schema.Types.Mixed },
    reviewer: { type: String },
    contributionType: { type: String },
    isSingleContributor: { type: Boolean, default: false },
    isFilterRoles: { type: Boolean, default: false },
    validRoles: { type: Array, default: [] },
    createdAt: {
        type: Date,
        default: Date.now
    },
    archivedAt: {
        type: Date,
        default: null
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

module.exports = mongoose.model('Task', TaskSchema);
