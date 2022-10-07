const Contract = require('@server/modules/contract/contract.model');
const DAO = require('@server/modules/dao/dao.model');
const Member = require('@server/modules/member/member.model')

const create = async (req, res) => {
    const { _id } = req.user;
    const { membersList, daoId } = req.body;
    let mMembers = [];
    try {
        let contract = new Contract({ ...req.body, admin: _id })
        contract = await contract.save()
        // checking members existence
        for (let index = 0; index < membersList.length; index++) {
            const member = membersList[index];
            const filter = { wallet: { $regex: new RegExp(`^${member.address}$`, "i") } }
            let m = await Member.findOne(filter);
            if (!m) {
                m = new Member({ wallet: member.address, name: member.name })
                m = await m.save();
            }
            mMembers.push(m);
        }

        let mem = mMembers.map(m => {
            return { member: m._id, creator: false, role: 'MEMBER' }
        })

        const dao = await DAO.findOne({ _id: daoId });
        if (dao) {
            await DAO.findOneAndUpdate(
                { _id: dao._id },
                {
                    $addToSet: { members: { $each: mem } },
                    sbt: contract._id
                }
            )
        }
        const d = await DAO.findOne({ url }).populate({ path: 'safe sbt members.member', populate: { path: 'owners' } })
        return res.status(200).json(d);
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

module.exports = { create };
