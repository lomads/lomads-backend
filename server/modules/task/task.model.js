const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');

/**
 * Safe Schema
 */
const TaskSchema = new mongoose.Schema({
    taskStatus: { type: String, default: 'open' },
    name: { type: String },
    description: { type: String },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    members: [{
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
        appliedAt: { type: Date, default: Date.now },
        status: { type: String, default: 'pending' },
        note: { type: String, default: '' },
        rejectionNote: { type: String, default: '' },
        links: { type: Array, default: [] },
        submission: { type: Object }
    }],
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    discussionChannel: { type: String },
    deadline: {
        type: Date,
        default: null
    },
    submissionLink: { type: String },
    compensation: { type: mongoose.Schema.Types.Mixed },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    contributionType: { type: String },
    isSingleContributor: { type: Boolean, default: false },
    isFilterRoles: { type: Boolean, default: false },
    validRoles: { type: Array, default: [] },
    createdAt: {
        type: Date,
        default: Date.now
    },
    reopenedAt: {
        type: Date,
        default: null
    },
    archivedAt: {
        type: Date,
        default: null
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    draftedAt: {
        type: Date,
        default: null
    },
    deletedAt: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model('Task', TaskSchema);
