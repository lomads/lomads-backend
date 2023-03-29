var config = require('@config/config');
const { ethers } = require('ethers')


const getSignature = async ({ chainId, contract, tokenId, payment = "" }) => {

    let signer = new ethers.Wallet(config.walletPrivateKey)
    const domain = {
        name: 'LOMADS-SBT',
        version: "1",
        verifyingContract: contract,
        chainId: chainId
    }
    const types = {
        Web3Struct: [
            { name: "id", type: "uint256" },
            { name: "payment", type: "string" }
        ]
    }
    const signature = signer.signTypedData(domain, types, { id: tokenId, payment })
    return signature
}

module.exports = {
    getSignature
}