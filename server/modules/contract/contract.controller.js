const _ = require('lodash')
const Contract = require('@server/modules/contract/contract.model');
const Metadata = require('@server/modules/metadata/metadata.model');
const DAO = require('@server/modules/dao/dao.model');
const Member = require('@server/modules/member/member.model');
const { toChecksumAddress, checkAddressChecksum } = require('ethereum-checksum-address')
const { getSignature } = require('@server/services/smartContract');

const load = async (req, res) => {
    const { user } = req;
    const { chainId = 5 } = req.query
    try {
        const contracts = await Contract.find({ admin: user._id, chainId }).populate('metadata')
        return res.status(200).json(contracts)
    }
    catch (e) {
        return res.status(500).json({ message: 'Something went wrong' })
    }
}


const getContractTokenMetadata = async (req, res) => {
    const { contractAddress, token } = req.params;
    console.log(contractAddress, token)
    try {
        const contract = await Contract.findOne({ address: { $regex: new RegExp(`^${contractAddress}$`, "i") } })
        if (contract) {
            const metadata = await Metadata.findOne({
                contract: contract._id,
                id: token
            })
            if (metadata) {
                res.status(200).json(metadata)
            } else {
                res.status(200).json({})
            }
        } else {
            res.status(200).json({})
        }
    } catch (e) {
        console.log(e)
        res.status(200).json({})
    }
}

const create = async (req, res) => {
    const { _id } = req.user;
    const { membersList, daoId } = req.body;
    let mMembers = [];
    try {
        let contract = await Contract.create({ ...req.body, admin: _id })

        for (let index = 0; index < membersList.length; index++) {
            const member = membersList[index];
            const filter = { wallet: { $regex: new RegExp(`^${member.address}$`, "i") } }
            let m = await Member.findOne(filter);
            if (!m) {
                m = new Member({ wallet: toChecksumAddress(member.address), name: member.name })
                m = await m.save();
            }
            mMembers.push(m);
        }

        let mem = mMembers.map(m => {
            return { member: m._id, creator: false, role: 'role4' }
        })

        const dao = await DAO.findOne({ _id: daoId });
        if (dao) {
            await DAO.findOneAndUpdate(
                { _id: dao._id },
                {
                    //$addToSet: { members: { $each: mem } },
                    sbt: contract._id
                }
            )
        }
        const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe safes sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        return res.status(200).json(d);

        // return res.status(200).json({ message: 'Contract created successfully' })
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const update = async (req, res) => {
    const { contractAddress } = req.params;
    const { daoId, ...rest } = req.body;
    try {

        await Contract.findOneAndUpdate({ address: contractAddress }, rest);
        const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe safes sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        return res.status(200).json(d);
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const getContract = async (req, res) => {
    const { contractAddress } = req.params;
    try {
        let contract = await Contract.findOne({ address: contractAddress });
        console.log("CONTRACTCONTRACT", contract)
        contract = { ...contract._doc, discountCodes: null, hasDiscountCodes: contract.discountCodes && contract._doc.discountCodes.length > 0 }
        return res.status(200).json(contract);
    }
    catch (e) {
        console.error("contract.controller::get::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const getContractDAO = async (req, res) => {
    const { sbtId } = req.params;
    try {
        const dao = await DAO.findOne({ sbt: sbtId }).populate({ path: 'safe safes sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } }).exec()
        console.log("DAO : ", dao);
        return res.status(200).json(dao)
    }
    catch (e) {
        console.error("contract.controller::get::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const signature = async (req, res) => {
    const { chainId, contract, tokenId, payment = "" } = req.query;
    try {
        const signature = await getSignature({ chainId, contract, tokenId, payment })
        return res.status(200).json({ signature });
    }
    catch (e) {
        console.error("contract.controller::get::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}


const getWhitelistSignature = async (req, res) => {
    const { chainId, contract, tokenId, payment } = req.body;
    try {
        const signature = await getSignature({ chainId, contract, tokenId, payment })
        return res.status(200).json({ signature });
    }
    catch (e) {
        console.error("contract.controller::get::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const validateReferalCode = async (req, res) => {
    const { contractAddress } = req.params;
    const { code } = req.query;
    try {
        let contract = await Contract.findOne({ address: contractAddress });
        const discountCode =  _.find(contract?.discountCodes, d => d.code.toLowerCase() === code.toLowerCase())
        if(discountCode){
            return res.status(200).json(discountCode);
        } else {
            return res.status(500).json({ message: 'Invalid discount code' })
        }
    }
    catch (e) {
        console.error("contract.controller::get::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}


module.exports = { validateReferalCode, load, create, update, getContract, getContractTokenMetadata, getWhitelistSignature, signature, getContractDAO };
