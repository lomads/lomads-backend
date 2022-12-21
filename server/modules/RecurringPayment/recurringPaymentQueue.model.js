const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');
const { encrypt } = require('@server/services/aes')

/**
 * Safe Schema
 */
const RecurringPaymentQueueSchema = new mongoose.Schema({
    recurringPayment: { type: mongoose.Schema.Types.ObjectId, ref: 'RecurringPayment' },
    safeAddress: { type: String, default: null},
    moduleTxnHash: { type: String, default: null},
    nonce: { type: Number, default: null},
    safeTxnHash: { type: String, default: null},
    createdAt: { type: Date, default: Date.now },
    archivedAt: { type: Date, default: null },
    updatedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null }
});

module.exports = mongoose.model('RecurringPaymentQueue', RecurringPaymentQueueSchema);
