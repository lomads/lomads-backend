const DAO = require('@server/modules/dao/dao.model')
const Member = require('@server/modules/member/member.model')
const Safe = require('@server/modules/safe/safe.model')
const ObjectId = require('mongodb').ObjectID;


const load = async (req, res) => {
    const { _id } = req.user;
    console.log(_id)
    try {
        const dao = await DAO.find({ deletedAt: null, 'members.member': { $in: [ObjectId(_id)] }}).populate({ path: 'safe members.member', populate: { path: 'owners' } }).exec()
        return res.status(200).json(dao)
    }
    catch(e) {
        console.error("dao.controller::load::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const create = async (req, res, next) => {
    const { contractAddress = "", url = null, name, description = null, image = null, members = [], safe = null } = req.body;
    const mMembers = []
    try {
        for (let index = 0; index < members.length; index++) {
            const member = members[index];
            const filter = { wallet: member.address }
            const m = await Member.findOneAndUpdate(filter, { name: member.name, wallet: member.address }, { new: true, upsert: true })
            mMembers.push(m)
        }
        let newSafe = null;
        let O = [];
        if(safe){
            const { name, address, owners } = safe;
            newSafe = new Safe({ name, address: address, owners: mMembers.filter(m => owners.indexOf(m.wallet) > -1).map(m => m._id)  })
            newSafe = await newSafe.save();
        }

        let mem = mMembers.map(m => {
            return { member: m._id, role: O.indexOf(m.wallet) > -1 ? 'ADMIN': 'MEMBER' }
        })

        let daoURL = url.replace('https://app.lomads.xyz/', "")

        let dao = new DAO({
            contractAddress, url: daoURL, name, description, image, members: mem, safe: newSafe._id
        })

        dao = await dao.save();

        await Safe.findByIdAndUpdate(newSafe._id, { dao: dao._id }, { new: true })

        return res.status(200).json({ message: 'DAO created successfully' })
    }
    catch(e) {
        console.error("dao.controller::create::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const getByUrl = async (req, res) => {
    const { url } = req.params;
    try {
        const dao = await DAO.findOne({ url }).populate({ path: 'safe members.member', populate: { path: 'owners' } })
        return res.status(200).json(dao)
    }
    catch(e) {
        console.error("dao.controller::get::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}



module.exports = { load, create, getByUrl };