const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');
const { encrypt } = require('@server/services/aes');
const { number } = require('joi');

/**
 * Safe Schema
 */
const ProjectSchema = new mongoose.Schema({
    daoId: { type: mongoose.Schema.Types.ObjectId, ref: 'DAO' },
    isDummy: { type: Boolean, default: false },
    provider: { type: String, default: 'Lomads' },
    metaData: { type: mongoose.Schema.Types.Mixed, default: null },
    viewers : {
        type: Array,
        default: []
    },
    name: { type: String },
    description: { type: String },
    creator: { type: String },
    inviteType: {
        type: String,
        default: 'Open'
    },
    validRoles: {
        type: Array,
        default: []
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    links: {
        type: Array,
        default: [],
    },
    compensation: {
        type: Object
    },
    milestones: {
        type: Array,
        default: [],
    },
    kra: {
        frequency: { type: String },
        results: [{
            _id: { type: String },
            name: { type: String, default: '' }
        }],
        tracker: [
            {
                results: [{ type: mongoose.Schema.Types.Object }],
                start: { type: Number },
                end: { type: Number },
            }
        ]
    },
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

module.exports = mongoose.model('Project', ProjectSchema);
