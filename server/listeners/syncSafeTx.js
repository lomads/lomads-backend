const GnosisSafeTx = require('../modules/gnosisSafeTx/gnosisSafeTx.model')
const _ = require('lodash')
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
    if(safe.chainId && safe.safeAddress) {
      // if(!safe.lastSync) {
        const localTxns = await GnosisSafeTx.find({ 'safeAddress': safe?.safeAddress })
        axios.get(`${GNOSIS_API_ENDPOINT[safe.chainId]}/api/v1/safes/${safe?.safeAddress}/all-transactions/?limit=10000&offset=0`)
        .then(async res => {
          let atxn = [ ...res.data.results ]
          // const { data } = await axios.get(`${GNOSIS_API_ENDPOINT[safe.chainId]}/api/v1/safes/${safe?.safeAddress}/incoming-transfers/`)
          // //console.log("incoming", data.results)
          // atxn = [ ...atxn, ...data.results ]
          if(atxn.length > 0) {
            let Alltxns = atxn.map(tx => { return { safeAddress: safe?.safeAddress, rawTx: tx } })
            let txns = Alltxns.filter(tx => { 
              if(tx.rawTx.txType === "ETHEREUM_TRANSACTION")
                return !Boolean(_.find(localTxns, ltxn => (ltxn?._doc?.rawTx?.txHash === tx?.rawTx?.txHash))?._doc?.rawTx?.txHash)
              if(tx?.rawTx?.safeTxHash)
                return !Boolean(_.find(localTxns, ltxn => (ltxn?._doc?.rawTx?.safeTxHash === tx?.rawTx?.safeTxHash))?._doc?.rawTx?.safeTxHash) 
              if(tx?.rawTx?.transactionHash)
                return !Boolean(_.find(localTxns, ltxn => (ltxn?._doc?.rawTx?.transactionHash === tx?.rawTx?.transactionHash))?._doc?.rawTx?.transactionHash) 
            })
            if(txns.length > 0)
              await GnosisSafeTx.create(txns)
            let existingtxns = Alltxns.filter(tx => { 
              if(tx?.rawTx?.safeTxHash)
                return _.find(localTxns, ltxn => (ltxn?._doc?.rawTx?.safeTxHash === tx?.rawTx?.safeTxHash))
              if(tx?.rawTx?.transactionHash)
                return _.find(localTxns, ltxn => (ltxn?._doc?.rawTx?.transactionHash === tx?.rawTx?.transactionHash))
              if(tx?.rawTx?.txHash)
                return _.find(localTxns, ltxn => (ltxn?._doc?.rawTx?.txHash === tx?.rawTx?.txHash))
            })
            if(existingtxns.length > 0) {
              for (let index = 0; index < existingtxns.length; index++) {
                const exTxn = existingtxns[index];
                if(exTxn?.rawTx?.safeTxHash)
                  await GnosisSafeTx.findOneAndUpdate({'rawTx.safeTxHash': exTxn?.rawTx?.safeTxHash , safeAddress: safe?.safeAddress }, { rawTx: exTxn.rawTx })
                else if(exTxn?.rawTx?.txHash)
                  await GnosisSafeTx.findOneAndUpdate({'rawTx.txHash': exTxn?.rawTx?.txHash , safeAddress: safe?.safeAddress }, { rawTx: exTxn.rawTx })
                else if(exTxn?.rawTx?.transactionHash)
                  await GnosisSafeTx.findOneAndUpdate({'rawTx.transactionHash': exTxn?.rawTx?.transactionHash , safeAddress: safe?.safeAddress }, { rawTx: exTxn.rawTx })
              }
            }
            console.log("localTxns", localTxns.length, "receivedTxns", atxn.length,  "creatingTxns", txns.length, "updatingTxns", existingtxns.length)
          }
        })
        .catch(e => {
          console.log(e) 
        })
        .finally(async () => {
          await GnosisSafeTxSyncTracker.findOneAndUpdate({ _id: safe._id }, { $set: { lastSync: moment().utc().toDate() } })
        })
      // } else {
      //   axios.get(`${GNOSIS_API_ENDPOINT[safe.chainId]}/api/v1/safes/${safe?.safeAddress}/multisig-transactions/?modified__gte=${moment(safe.lastSync).toISOString()}&limit=10000&offset=0`)
      //   .then(async res => {
      //     for (let index = 0; index < res.data.results.length; index++) {
      //       const tx = res.data.results[index];
      //       const gstx = await GnosisSafeTx.findOne({ 'rawTx.safeTxHash': tx.safeTxHash, safeAddress: safe?.safeAddress })
      //       if(gstx) {
      //         gstx.rawTx = tx
      //         await gstx.save()
      //       } else {
      //         await GnosisSafeTx.create({ safeAddress: safe?.safeAddress, rawTx: tx })
      //       }
      //     }
      //     await GnosisSafeTxSyncTracker.findOneAndUpdate({ _id: safe._id }, { $set: { lastSync: moment().utc().toDate() } })
      //   })
      //   .finally(async () => {
      //     await GnosisSafeTxSyncTracker.findOneAndUpdate({ _id: safe._id }, { $set: { lastSync: moment().utc().toDate() } })
      //   })
      // }
    }
  }
}