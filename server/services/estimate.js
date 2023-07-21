var config = require('@config/config');
const { INFURA_NETWORK_URLS }  = require('@config/constants')
const { ethers } = require('ethers')
const { Contract } = require('@ethersproject/contracts')
const { getSignature } = require('./smartContract');

const estimateGas = async ({ chainId, to, value }) => {
    let signer = new ethers.Wallet(config.bankPrivateKey)
    let provider = new ethers.providers.JsonRpcProvider(INFURA_NETWORK_URLS(config.infuraKey)[chainId])
    const params = {
        from: signer.address, 
        to, 
        value: value
    }
    let gas = await provider?.send("eth_estimateGas", [params]);
    return gas
}

const mintEstimateGas = async ({ chainId, address, abi, version = 2}) => {
    let provider = new ethers.providers.JsonRpcProvider(INFURA_NETWORK_URLS(config.infuraKey)[chainId])
    let wallet = new ethers.Wallet(config.bankPrivateKey)
    const signer = await provider.getSigner(wallet.address)
    const contract = new Contract(address, abi, signer)
    let tokenId = await contract?.getCurrentTokenId()
    tokenId = parseInt(tokenId.toString());
    const signature = getSignature({ chainId, contract: address, tokenId, payment: '--' });
    let estimateTransactionCost = null;
    if(version >= 3) {
        estimateTransactionCost = await contract?.estimateGas.safeMint(
            "",
            tokenId,
            "--",
            signature,
            "sender"
        );
    } else {
        estimateTransactionCost = await contract?.estimateGas.safeMint(
            "",
            tokenId,
            "--",
            signature
        );
    }
    const gasPrice = await provider?.getGasPrice();
    const parsed = ethers.utils.formatEther((parseFloat(gasPrice.toString()) * parseFloat(estimateTransactionCost.toString())).toString())
    return parsed
}

module.exports = {
    estimateGas,
    mintEstimateGas
}