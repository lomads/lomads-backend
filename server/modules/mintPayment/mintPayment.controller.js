const MintPayment = require('@server/modules/mintPayment/mintPayment.model');
const Contract = require('@server/modules/contract/contract.model');
const { NETWORK_SCAN_LINKS, SupportedChainId } = require('@config/constants')
const { ethers } = require('ethers')
const axios = require('axios');
const config = require('@config/config')
const { getSignature } = require('@server/services/smartContract');
const { toChecksumAddress, checkAddressChecksum } = require('ethereum-checksum-address')
const sdk = require('api')('@transak/v1.0#v9aumgla1g38vc');


const waitFor = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const retry = (promise, onRetry, maxRetries) => {
    const retryWithBackoff = async (retries) => {
        try {
            if (retries > 0) {
                const timeToWait = 2 ** retries * 1000;
                console.log(`waiting for ${timeToWait}ms...`);
                await waitFor(timeToWait);
            }
            return await promise();
        } catch (e) {
            if (retries < maxRetries) {
                onRetry();
                return retryWithBackoff(retries + 1);
            } else {
                console.warn("Max retries reached. Bubbling the error up");
                throw e;
            }
        }
    }
    return retryWithBackoff(0);
}

const verify = async (req, res, next) => {
    const { wallet } = req.user;
    const { chainId, txnReference, contract, tokenId, paymentType } = req.body;
    let isVerified = false;
    try {
        const sbt = await Contract.findOne({ address: contract })
        let apiKey = config.etherScanKey;
        if(+chainId === 137)
            apiKey = config.polyScanKey;
        if(paymentType === 'crypto') {
            const scanBaseUrl = NETWORK_SCAN_LINKS[+chainId].baseUrl
            let txnResponse = await retry(
                () => axios.get(`${scanBaseUrl}api?module=proxy&action=eth_getTransactionByHash&txhash=${txnReference}&apikey=${NETWORK_SCAN_LINKS[+chainId].apiKey}`),
                () => { console.log('retry called...') },
                10
            )
            txnResponse = txnResponse?.data?.result;
            console.log("txnResponse", txnResponse)
            if(
                ((toChecksumAddress(sbt?.treasury) === toChecksumAddress(txnResponse.to)) || (
                    txnResponse.input.indexOf(sbt?.treasury.replace('0x', '').toLowerCase() > -1)
                ) )
                && toChecksumAddress(wallet) === toChecksumAddress(txnResponse.from)) {
                isVerified = true;
            }
        } else if (paymentType === 'card') {
            const { data } = await sdk.refreshAccessToken({
                apiKey: config.transakApiKey
              }, {
                'api-secret': config.transakApiSecret
            })
            const accessToken = data?.data?.accessToken
            const txnData = await sdk.getOrderByOrderId({orderId: txnReference, 'access-token': accessToken})
            const txn = txnData?.data?.data
            if(toChecksumAddress(sbt?.treasury) === toChecksumAddress(txn?.walletAddress)) {
                isVerified = true;
            }
        }
        if(isVerified) {
            await MintPayment.create({ ...req.body, account: wallet, verified: isVerified })
            const signature = await getSignature({ chainId, contract, tokenId, payment: txnReference  })
            return res.status(200).json({ signature }) 
        } else {
            return res.status(500).json({ message: 'Unable to verify payment. Please try again.' }) 
        }
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' }) 
    }
}

const getPayment = async (req, res) => {
    const { wallet } = req.user;
    const { contract } = req.params
    try {
        const mp = await MintPayment.findOne({ contract, account: toChecksumAddress(wallet) })
        if(mp) {
            return res.status(200).json(mp.txnReference) 
        } else {
            return res.status(200).json(null)  
        }
    }
    catch (e) {
        console.error(e)
        return res.status(200).json(null)  
    }
}

const generateSignature = async (req, res) => {
    const { wallet } = req.user;
    const { contract, tokenId } = req.query
    try {
        const mp = await MintPayment.findOne({ contract, account: toChecksumAddress(wallet) })
        if(!mp){
            return res.status(500).json({ message: 'Unable to verify payment. Please try again.' }) 
        }
        console.log(mp)
        if(mp) {
            console.log(mp?.chainId, contract, tokenId, mp?.txnReference )
            const signature = await getSignature({ chainId: +(mp?.chainId), contract, tokenId: +tokenId, payment: mp?.txnReference  })
            return res.status(200).json({ signature }) 
        } else {
            return res.status(500).json({ message: 'Unable to generate signature. Please try again.' }) 
        }
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' }) 
    }
}

module.exports = {
    verify, getPayment, generateSignature
};
