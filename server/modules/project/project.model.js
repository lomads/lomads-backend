const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');
const { encrypt } = require('@server/services/aes')

/**
 * Safe Schema
 */
const ProjectSchema = new mongoose.Schema({
    daoId: { type: mongoose.Schema.Types.ObjectId, ref: 'DAO' },
    name: { type: String },
    description: { type: String },
    creator: { type: String },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
    links: {
        type: Array,
        default: [],
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
