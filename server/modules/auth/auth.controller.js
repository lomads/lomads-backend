const Member = require('@server/modules/member/member.model')

const update = async (req, res) => {
  const { _id } = req.user;
  try {
    let member = await Member.findOneAndUpdate({ _id }, { ...req.body })
    member = await Member.findOne({ _id })
    return res.status(200).json(member)
  } catch(e) {
    console.log(e);
    res.status(500).json({ message: 'Something went wrong' })
  }
}

module.exports = { update };
