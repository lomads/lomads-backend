const Project = require('@server/modules/project/project.model');
const Member = require('@server/modules/member/member.model');
const DAO = require('@server/modules/dao/dao.model')

const create = async (req, res) => {
    const { name, description, members, links, daoId } = req.body;
    console.log("data : ", name, description, members, links, daoId);
    let mMembers = [];
    try {

        for (let index = 0; index < members.length; index++) {
            const member = members[index];
            const filter = { wallet: { $regex: new RegExp(`^${member.address}$`, "i") } }
            let m = await Member.findOne(filter);
            if (!m) {
                m = new Member({ wallet: member.address, name: member.name })
                m = await m.save();
            }
            mMembers.push(m);
        }

        let mem = mMembers.map(m => {
            return m._id
        })

        let project = new Project({
            name, description, members: mem, links
        })

        project = await project.save();

        let dao = await DAO.findOne({ _id: daoId });
        if (dao) {
            dao.projects.push(project._id);
            dao = await dao.save();
        }

        const d = await DAO.findOne({ _id: daoId }).populate({ path: 'safe sbt members.member projects', populate: { path: 'owners members' } })

        return res.status(200).json(d);
    }
    catch (e) {
        console.error("project.controller::create::", e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

module.exports = { create };