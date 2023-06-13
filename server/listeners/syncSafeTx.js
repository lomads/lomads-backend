const GnosisSafeTx = require('../modules/gnosisSafeTx/gnosisSafeTx.model')
const GnosisSafeTxSyncTracker  = require('../modules/gnosisSafeTx/gnosisSafeTxSyncTracker.model')
const Safe = require('../modules/safe/safe.model');
const { GNOSIS_API_ENDPOINT } = require('../../config/constants')
const axios = require('axios');
const config = require('@config/config')
const moment = require('moment')

module.exports = {
  handle: async () => {
    if(config.env === 'local') return;
    console.log("30s")
    const safe = await GnosisSafeTxSyncTracker.findOne({ chainId: { $ne: null } }).sort({ lastSync: 1 })
    console.log(safe)
    if(safe.chainId) {
      if(!safe.lastSync) {
        axios.get(`${GNOSIS_API_ENDPOINT[safe.chainId]}/api/v1/safes/${safe?.safeAddress}/all-transactions/?limit=10000&offset=0`)
        .then(async res => {
          if(res.data && res.data.results && res.data.results.length > 0) {
            const txns = res.data.results.map(tx => { return { safeAddress: safe?.safeAddress, rawTx: tx } })
            await GnosisSafeTx.create(txns)
          }
        })
        .finally(async () => {
          await GnosisSafeTxSyncTracker.findOneAndUpdate({ _id: safe._id }, { $set: { lastSync: moment().utc().toDate() } })
        })
      } else {
        axios.get(`${GNOSIS_API_ENDPOINT[safe.chainId]}/api/v1/safes/${safe?.safeAddress}/multisig-transactions/?modified__gte=${moment(safe.lastSync).toISOString()}&limit=10000&offset=0`)
        .then(async res => {
          for (let index = 0; index < res.data.results.length; index++) {
            const tx = res.data.results[index];
            const gstx = await GnosisSafeTx.findOne({ 'rawTx.safeTxHash': tx.safeTxHash, safeAddress: safe?.safeAddress })
            if(gstx) {
              gstx.rawTx = tx
              await gstx.save()
            } else {
              await GnosisSafeTx.create({ safeAddress: safe?.safeAddress, rawTx: tx })
            }
          }
          await GnosisSafeTxSyncTracker.findOneAndUpdate({ _id: safe._id }, { $set: { lastSync: moment().utc().toDate() } })
        })
        .finally(async () => {
          await GnosisSafeTxSyncTracker.findOneAndUpdate({ _id: safe._id }, { $set: { lastSync: moment().utc().toDate() } })
        })
      }
    }
  }
}