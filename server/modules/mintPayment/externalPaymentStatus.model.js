const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');
const { encrypt } = require('@server/services/aes')

/**
 * Safe Schema
 */
const ExternalPaymentStatusSchema = new mongoose.Schema({
    response: { type: Object },
    provider: { type: String },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
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

module.exports = mongoose.model('ExternalPaymentStatus', ExternalPaymentStatusSchema);
