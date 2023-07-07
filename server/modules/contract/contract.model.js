const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('@server/helpers/APIError');

/**
 * Safe Schema
 */
const ContractSchema = new mongoose.Schema({
  chainId: { type: Number },
  name: { type: String },
  token: { type: String },
  image: { type: String },
  tokenSupply: { type: Number },
  whitelisted: { type: mongoose.Schema.Types.Boolean, default: false },
  master: { type: String, default: null },
  address: { type: String },
  treasury: { type: String },
  mintPrice: { type: String },
  nonPayingMembers: [{ type: String }],
  discountCodes: [{ type: mongoose.Schema.Types.Object }],
  mintPriceToken: { type: String, default: "0x0000000000000000000000000000000000000000" },
  version: { type: String, default: "1" },
  membersList: [{ type: mongoose.Schema.Types.Object }],
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  metadata: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Metadata' }],
  contactDetail: { type: Array },
  redirectUrl: { type: String },
  gasless: { type: mongoose.Schema.Types.Boolean, default: false },
  gasConfig: { type: mongoose.Schema.Types.Object },
  externalPaymentProvider: { type: mongoose.Schema.Types.Object, 
    default: {
      paymentLink: 'https://buy.onramper.com',
      provider: 'on-ramper'
    } 
  },
  stripeAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'StripeAccount' },
  mintPageConfig: { type: mongoose.Schema.Types.Object, 
    default: {
      metamask: true,
      overrideDisplayPrice: false,
      mintSuccessMessage: null,
      discordLink: null
    } 
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
ContractSchema.method({
});

/**
 * Statics
 */
ContractSchema.statics = {

};

/**
 * @typedef DAO
 */
module.exports = mongoose.model('Contract', ContractSchema);
