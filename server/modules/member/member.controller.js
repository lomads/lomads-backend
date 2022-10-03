const Member = require('@server/modules/member/member.model');

const update = async (req, res) => {
    const { _id } = req.user;
    const { name } = req.body;
    try {
      const member = await Member.findOneAndUpdate({ _id }, { name });
      return res.status(200).json(member)
    }
    catch(e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

module.exports = { update };
