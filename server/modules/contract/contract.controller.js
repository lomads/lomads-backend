const Contract = require('@server/modules/contract/contract.model');
const Metadata = require('@server/modules/metadata/metadata.model');
const DAO = require('@server/modules/dao/dao.model');
const Member = require('@server/modules/member/member.model');
const { toChecksumAddress, checkAddressChecksum } = require('ethereum-checksum-address')

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
        const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
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
    const { daoId, contactDetail, whitelisted, mintPrice } = req.body;
    try {

        await Contract.findOneAndUpdate({ address: contractAddress }, { contactDetail, whitelisted, mintPrice });
        const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
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
        const contract = await Contract.findOne({ address: contractAddress });
        return res.status(200).json(contract);
    }
    catch (e) {
        console.error("contract.controller::get::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}


module.exports = { create, update, getContract, getContractTokenMetadata };
