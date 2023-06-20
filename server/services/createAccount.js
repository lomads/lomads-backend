const Web3Token = require('web3-token');
const Member = require('@server/modules/member/member.model');
const Metadata = require('@server/modules/metadata/metadata.model');
const { toChecksumAddress, checkAddressChecksum } = require('ethereum-checksum-address')

const createAccount = async (req, res, next) => {
    try {
        const token = req.headers['authorization']
        const userInfo = req.body;
        if (!token)
            return res.status(401).json({ message: 'Authorization token required' })
        console.log("token : ", token);
        const { address = '', body } = await Web3Token.verify(token);
        console.log("address : ", address);
        console.log("address", toChecksumAddress(address))
        let member = await Member.findOne({ wallet: toChecksumAddress(address) })
        if (member) {
            if(!member.name || member.name === ''){
                if(userInfo?.name || userInfo?.email) {
                    member.name = userInfo?.name || userInfo?.email
                    member = await member.save()
                }
            }
            return res.status(200).json(member)
        }
        else {
            member = new Member({ wallet: toChecksumAddress(address), name: userInfo?.name || userInfo?.email || '' })
            member = await member.save()
            return res.status(201).json(member)
        }
    } catch (e) {
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

module.exports = createAccount;