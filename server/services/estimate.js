var config = require('@config/config');
const { INFURA_NETWORK_URLS }  = require('@config/constants')
const { ethers } = require('ethers')


const estimateGas = async ({ chainId, to, value }) => {
    let signer = new ethers.Wallet(config.bankPrivateKey)
    let provider = new ethers.JsonRpcProvider(INFURA_NETWORK_URLS(config.infuraKey)[chainId])
    const params = {
        from: signer.address, 
        to, 
        value: value
    }
    let gas = await provider?.send("eth_estimateGas", [params]);
    return gas
}

module.exports = {
    estimateGas
}