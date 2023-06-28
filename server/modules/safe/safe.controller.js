const Safe = require('@server/modules/safe/safe.model');
const Member = require('@server/modules/member/member.model');
const ObjectId = require('mongodb').ObjectID;


const syncSafe = async (req, res) => {
    const { address } = req.params 
    const { owners, ...others } = req.body;
    try {
        let members = []
        for (let index = 0; index < owners.length; index++) {
            const owner = owners[index];
            const filter = { wallet: { $regex: new RegExp(`^${owner}$`, "i") } }
            let m = await Member.findOne(filter);
            if (!m) {
                m = new Member({ wallet: toChecksumAddress(owner), name: '' })
                m = await m.save();
            }
            members.push(m)
        }

        const response = await Safe.updateMany({ address }, { $set: { ...others }, $addToSet: { owners: members.map(m => m._id) } })
        return res.status(200).json({ message: 'Success' })
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const updateSafe = async (req, res) => {
    const { address } = req.params 
    try {
        const response = await Safe.updateOne({ address }, { $set: { ...req.body } })
        return res.status(200).json({ message: 'Success' })
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}


module.exports = { syncSafe, updateSafe };