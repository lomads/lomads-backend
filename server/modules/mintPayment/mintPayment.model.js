const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');
const { encrypt } = require('@server/services/aes')

/**
 * Safe Schema
 */
const MintPaymentSchema = new mongoose.Schema({
    contract: { type: String },
    txnReference: { type: String },
    account: { type: String },
    paymentType: { type: String, default: 'crypto' },
    chainId: { type: String },
    verified: { type: Boolean, default: false },
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

module.exports = mongoose.model('MintPayment', MintPaymentSchema);
