const Member = require('@server/modules/member/member.model');
const Safe = require('@server/modules/safe/safe.model');

const update = async (req, res) => {
    const { _id } = req.user;
    const { name } = req.body;
    try {
      let member = await Member.findOneAndUpdate({ _id }, { name });
      member = await Member.findOne({ _id })
      return res.status(200).json(member)
    }
    catch(e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const updateEarnings = async (req, res) => {
  const { _id, wallet } = req.user;
  const { daoId } = req.qurey;

  // const safe = Safe.findOne({ dao : daoId })
  // if(safe && safe.owners) {
  //   const sOwners = safe.owners.map(o => o.toLowerCase())
  //   sOwners.indexOf(wallet.toLowerCase() > -1){ 

  //   }
  // }
}

module.exports = { update, updateEarnings };
