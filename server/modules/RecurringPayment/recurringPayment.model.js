const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');
const { encrypt } = require('@server/services/aes')

/**
 * Safe Schema
 */
const RecurringPaymentSchema = new mongoose.Schema({
    daoId: { type: mongoose.Schema.Types.ObjectId, ref: 'DAO' },
    safeAddress: { type: String },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    delegate: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    compensation: { type: mongoose.Schema.Types.Mixed },
    frequency: { type: String, enum : ['weekly','monthly'], default: 'weekly' },
    startDate: { type: Date, default: Date.now },
    nextDate: { type: Date, default: Date.now },
    ends: { type: mongoose.Schema.Types.Object, default: null },
    queue: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RecurringPaymentQueue' }],
    allowanceTxnHash: { type: String, default: null },
    active: { type: mongoose.Schema.Types.Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    archivedAt: { type: Date, default: null },
    updatedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null }
});

module.exports = mongoose.model('RecurringPayment', RecurringPaymentSchema);
