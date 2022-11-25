const Web3Token = require('web3-token');
const Member = require('@server/modules/member/member.model');
const { toChecksumAddress, checkAddressChecksum } = require('ethereum-checksum-address')

const web3Auth = async (req, res, next) => {
    try {
        const token = req.headers['authorization']
        if(!token)
            return res.status(401).json({ message: 'Authorization token required' })
        const { address = '', body } = await Web3Token.verify(token);
        console.log("address", address)
        let member = await Member.findOne({ wallet: { $regex : new RegExp(`^${address}$`, "i") } })
        if(!member) {
            member = new Member({ wallet: toChecksumAddress(address), name: '' })
            member = await member.save()
        } else {
            if(!checkAddressChecksum(member.wallet)){
                member.wallet = toChecksumAddress(member.wallet)
                member = await member.save()
            }
        }
        req.user = member;
        next();
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

module.exports = web3Auth;