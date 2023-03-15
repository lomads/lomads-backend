var config = require('@config/config');
const { ethers } = require('ethers')


const getSignature = async ({ chainId, contract, tokenId }) => {

    let signer = new ethers.Wallet(config.walletPrivateKey)
    const domain = {
        name: 'LOMADS-SBT',
        version: "1",
        verifyingContract: contract,
        chainId: chainId
    }
    const types = {
        Web3Struct: [
            { name: "id", type: "uint256" }
        ]
    }
    const signature = signer.signTypedData(domain, types, { id: tokenId })
    return signature
}

module.exports = {
    getSignature
}