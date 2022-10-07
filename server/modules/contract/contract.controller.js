const Contract = require('@server/modules/contract/contract.model');

const create = async (req, res) => {
    const { _id } = req.user;
    try {
        let contract = new Contract({ ...req.body, admin: _id })
        contract = await contract.save()
        return res.status(200).json({ message: 'Contract created successfully' })
    }
    catch(e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

module.exports = { create };
