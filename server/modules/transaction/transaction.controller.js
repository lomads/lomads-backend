const Transaction = require('@server/modules/transaction/transaction.model');
const OffChain = require('@server/modules/transaction/offchain.model');
const Member = require('@server/modules/member/member.model');
const Task = require('@server/modules/task/task.model');
const Safe = require('@server/modules/safe/safe.model');
const txLabel = require('@server/modules/transaction/txlabel.model');
const _ = require('lodash');
const axios = require('axios');
const moment = require('moment')
const ObjectId = require('mongodb').ObjectID;

const load = async (req, res) => {
    const { _id } = req.user;
    try {
        let txns = await Transaction.find({})
        return res.status(200).json(txns)
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const loadOffChain = async (req, res) => {
    const { daoId } = req.query;
    try {
        let txns = await OffChain.find({ daoId, offChain: true })
        return res.status(200).json(txns)
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const createOffChainTransaction = async (req, res) => {
    try {
        const offChainTx = await OffChain.create(req.body);
        if(offChainTx)
            return res.status(200).json(offChainTx)
        return res.status(500).json({ message: 'Something went wrong' })
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const deleteOffChainTransaction = async (req, res) => {
    const { safeTxHash } = req.params;
    try {
        await OffChain.deleteOne({ safeTxHash });
        return res.status(200).json({ message: 'Txn deleted' })
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const moveTxToOnChain = async (req, res) => {
    const { safeTxHash } = req.params;
    const { onChainTxHash, taskId } = req.body;
    try {
        await OffChain.findOneAndUpdate(
            { safeTxHash },
            { safeTxHash: onChainTxHash, offChain: false }
        )
        if(taskId) {
            await Task.findOneAndUpdate(
                { _id: ObjectId(taskId) },
                { 
                    'compensation.txnHash': onChainTxHash,
                    'compensation.onChain': true
                }
            )
        }

        await txLabel.updateMany({ safeTxHash }, { safeTxHash: onChainTxHash })

        return res.status(200).json({ message: 'success' })
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const approveOffChainTransaction = async (req, res) => {
    const { safeTxHash } = req.params;
    try {
        let offChainTx = await OffChain.findOne({ safeTxHash });
        if(!offChainTx)
            return res.status(500).json({ message: 'Txn not found' })
        await OffChain.updateMany(
            { safeTxHash },
            { $addToSet: { 'confirmations': req.body.confirmations[0] } }
        )
        offChainTx = await OffChain.findOne({ safeTxHash }); 
        return res.status(200).json(offChainTx)  
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const executedOnChain = async (req, res) => {
    const { safeTx } = req.body;
    const { daoId } = req.query;
    try {
        let task = await Task.findOne({ 'compensation.txnHash': safeTx.safeTxHash })
        if(task && task.contributionType !== 'open' && task.isSingleContributor === false){
            task.taskStatus = 'paid'
            await task.save()
        }
        let transfers = []
        let parameters = [];
        if(_.get(safeTx, 'dataDecoded.method' , '') === 'multiSend')
            parameters = _.get(safeTx, 'dataDecoded.parameters[0].valueDecoded', [])
        else if (_.get(safeTx, 'dataDecoded.method', '') === 'transfer')
            parameters = [{ dataDecoded: safeTx.dataDecoded }]
        else {
            parameters = [{ to: _.get(safeTx, 'to', ''), value: _.get(safeTx, 'value', '') }]
        }

        const txl = await txLabel.findOne({ safeTxHash: safeTx.safeTxHash });

        for (let index = 0; index < parameters.length; index++) {
            const parameter = parameters[index];
            const recipient = _.get(_.find(_.get(parameter, 'dataDecoded.parameters', []),  p => p.name === 'to'), 'value', _.get(parameter, 'to', null))
            const amount = _.get(_.find(_.get(parameter, 'dataDecoded.parameters', []),  p => p.name === 'value'), 'value', _.get(parameter, 'value', null))
            transfers.push({
                to: recipient,
                value: amount
            })
            console.log(recipient, amount)
            if(recipient) {
                const user = await Member.findOne({ wallet: { $regex: new RegExp(`^${recipient}$`, "i") } })
                let earnings = user.earnings
                const symbol = _.find(earnings, e => e.symbol === _.get(safeTx, 'token.symbol', '') && e.daoId.toString() === daoId.toString())
                console.log("symbol---------->", symbol)
                if(symbol) {
                    earnings = earnings.map(e => {
                        if(e.symbol === _.get(safeTx, 'token.symbol', 'SWEAT') && e.daoId.toString() === daoId.toString()){
                            return { ...e._doc, value: +e.value + (amount / 10 ** _.get(safeTx, 'token.decimals', 18)) }
                        }
                        return e
                    }) 
                } else {
                    earnings.push({
                        symbol: _.get(safeTx, 'token.symbol', 'SWEAT'),
                        value: amount / 10 ** _.get(safeTx, 'token.decimals', 18),
                        currency: _.get(safeTx, 'token.tokenAddress', 'SWEAT'),
                        daoId
                    })
                }

                if(txl && txl.sweatConversion) { 
                    earnings = earnings.map(e => {
                        console.log(e)
                        console.log(e.symbol === 'SWEAT' && e.daoId.toString() === daoId.toString())
                        if(e.symbol === 'SWEAT' && e.daoId.toString() === daoId.toString()) {
                            console.log({ ...e._doc, value: 0 })
                            return { ...e._doc, value: 0 }
                        }
                        return e
                    }) 
                }

                await Member.findByIdAndUpdate(
                    { _id: user._id },
                    { earnings }
                )
            }
        }
        
        return res.status(200).json({ message: 'success' })
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const executeOffChainTransaction = async (req, res) => {
    const { safeTxHash } = req.params;
    const { rejectedTxn = null, decimals = 18 } = req.query;
    const { daoId } = req.query;
    
    console.log(rejectedTxn, "==>", typeof rejectedTxn)
    try {
        let offChainTx = await OffChain.findOne({ safeTxHash });
        if(!offChainTx)
            return res.status(500).json({ message: 'Txn not found' })

        let transfers = []
        let parameters = [];
        if(_.get(offChainTx, 'dataDecoded.method' , '') === 'multiSend')
            parameters = _.get(offChainTx, 'dataDecoded.parameters[0].valueDecoded', [])
        else if (_.get(offChainTx, 'dataDecoded.method', '') === 'transfer')
            parameters = [{ dataDecoded: offChainTx.dataDecoded }]

        for (let index = 0; index < parameters.length; index++) {
            const parameter = parameters[index];
            const recipient = _.get(_.find(parameter.dataDecoded.parameters,  p => p.name === 'to'), 'value', null)
            const amount = _.get(_.find(parameter.dataDecoded.parameters,  p => p.name === 'value'), 'value', null)
            transfers.push({
                to: recipient,
                value: amount
            })
            console.log(recipient, amount)
            if(!rejectedTxn || (rejectedTxn && rejectedTxn === null)) {
                if(recipient) {
                    const user = await Member.findOne({ wallet: { $regex: new RegExp(`^${recipient}$`, "i") } })
                    let earnings = user.earnings
                    const symbol = _.find(earnings, e => e.symbol === _.get(offChainTx, 'token.symbol', '') && e.daoId.toString() === daoId.toString())
    
                    if(symbol) {
                        earnings = earnings.map(e => {
                            if(e.symbol === _.get(offChainTx, 'token.symbol', 'SWEAT') && e.daoId.toString() === daoId.toString())
                                return { ...e._doc, value: +e.value + (amount / 10 ** (+decimals)) }
                            return e
                        }) 
                    } else {
                        earnings.push({
                            symbol: _.get(offChainTx, 'token.symbol', 'SWEAT'),
                            value: amount / 10 ** (+decimals),
                            currency: _.get(offChainTx, 'token.tokenAddress', 'SWEAT'),
                            daoId
                        })
                    }
                    console.log("earnings", earnings)
                    await Member.findByIdAndUpdate(
                        { _id: user._id },
                        { earnings }
                    )
                }
            }
        }
        

        await OffChain.findOneAndUpdate(
            { safeTxHash },
            { 
                isExecuted: true, 
                isSuccessful: true,
                executionDate: moment().utc().toDate(),
                transfers,
                txType: "MULTISIG_TRANSACTION",
                confirmations: rejectedTxn && rejectedTxn !== null ? rejectedTxn.confirmations : offChainTx.confirmations,
                ...(rejectedTxn && rejectedTxn !== null  ? { dataDecoded: null, } : { rejectedTxn: null })
            }
        )

        if(!rejectedTxn){
            let task = await Task.findOne({ 'compensation.txnHash': safeTxHash })
            if(task){
                task.taskStatus = 'paid'
                await task.save()
            }
        }

        let oct = await OffChain.findOne({ safeTxHash });

        return res.status(200).json(oct)  
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const rejectOffChainTransaction = async (req, res) => {
    const { nonce } = req.params;
    try {
        let offChainTx = await OffChain.findOne({ nonce });
        if(!offChainTx)
            return res.status(500).json({ message: 'Txn not found' })
        if(!offChainTx.rejectedTxn) {
            offChainTx.rejectedTxn = req.body
            offChainTx = await offChainTx.save()
        } else {
            await OffChain.updateMany(
                { nonce },
                { $addToSet: { 'rejectedTxn.confirmations': req.body.confirmations[0] } }
            )
        }
        offChainTx = await OffChain.findOne({ nonce }); 
        return res.status(200).json(offChainTx)  
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const create = async (req, res) => {
    const { _id } = req.user;
    try {
        console.log(req.body)
        let txn = new Transaction({ ...req.body })
        txn = await txn.save()
        const safe = await Safe.updateMany(
            { address: req.body.safeAddress },
            { $addToSet: { transactions: txn._id } }
        )
        return res.status(200).json({ message: 'Txn created successfully' })
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const update = async (req, res) => {
    const { _id } = req.user;
    let { safeTxHash, reason, recipient = '', txType = null, safeAddress, chainId = 5 } = req.body;
    recipient = recipient === "" ? safeAddress : recipient;
    try {
        let txn = await Transaction.findOne({ safeTxHash: { $regex: new RegExp(`^${safeTxHash}$`, "i") } })
        console.log("TXN : ", txn)
        if (!txn) {
            if (txType === 'ETHEREUM_TRANSACTION') {
                let txn = new Transaction({
                    safeAddress,
                    safeTxHash: safeTxHash,
                    rejectTxHash: null,
                    data: [{ reason, recipient }],
                    nonce: '0',
                })
                txn = await txn.save();
                const safe = await Safe.updateMany(
                    { address: safeAddress },
                    { $addToSet: { transactions: txn._id } }
                )
                txn = await Transaction.findOne({ safeTxHash: { $regex: new RegExp(`^${safeTxHash}$`, "i") } })
                return res.status(200).json(txn)
            }

            let url = `https://safe-transaction-goerli.safe.global/api/v1/multisig-transactions/${safeTxHash}/`;
            if(+chainId === 137)
                url = `https://safe-transaction-polygon.safe.global/api/v1/multisig-transactions/${safeTxHash}/`

            const safeTxn = await axios.get(url)
            if (safeTxn && safeTxn.data) {
                let txn = new Transaction({
                    safeAddress: safeTxn.data.safe,
                    safeTxHash: safeTxHash,
                    rejectTxHash: null,
                    data: [{ reason, recipient: _.get(safeTxn.data, 'dataDecoded.parameters[0].value', _.get(safeTxn.data, 'to', '')) }],
                    nonce: safeTxn.data.nonce,
                })
                txn = await txn.save();
                const safe = await Safe.updateMany(
                    { address: safeTxn.data.safe },
                    { $addToSet: { transactions: txn._id } }
                )
                txn = await Transaction.findOne({ safeTxHash: { $regex: new RegExp(`^${safeTxHash}$`, "i") } })
                return res.status(200).json(txn)
            }
            else {
                return res.status(404).json({ message: 'Transaction not found' })
            }
        }

        let rec = _.find(txn.data, t => t.recipient.toLowerCase() === recipient.toLowerCase())

        if(rec) {
            txn.data = txn.data.map(d => {
                if (d.recipient.toLowerCase() === recipient.toLowerCase())
                    return { ...d, reason }
                return d;
            })
        } else {
            txn.data = [ ...txn.data, { recipient, reason } ] 
        }
        txn = await txn.save();
        txn = await Transaction.findOne({ safeTxHash: { $regex: new RegExp(`^${safeTxHash}$`, "i") } })
        return res.status(200).json(txn)
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const addTxnLabel = async (req, res) => {
    try {
        await txLabel.create(req.body)
        return res.status(200).json({ message: ''})
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const loadTxnLabel = async (req, res) => {
    const { safeAddress } = req.query;
    try {
        const labels = await txLabel.find({ safeAddress })
        return res.status(200).json(labels)
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const updateTxnLabel = async (req, res) => {
    const { safeAddress, safeTxHash, label, recipient } = req.body;
    try {
        await txLabel.findOneAndUpdate(
            { safeTxHash, safeAddress, recipient: { $regex: new RegExp(`^${recipient}$`, "i") } }, 
            { label, recipient }, 
            { new: true, upsert: true });
        const labels = await txLabel.find({ safeAddress })
        return res.status(200).json(labels)
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

module.exports = { load, create, update, loadOffChain, createOffChainTransaction, rejectOffChainTransaction, approveOffChainTransaction, deleteOffChainTransaction, executeOffChainTransaction, moveTxToOnChain, executedOnChain, addTxnLabel, loadTxnLabel, updateTxnLabel };
