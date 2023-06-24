const Safe = require('@server/modules/safe/safe.model');
const ObjectId = require('mongodb').ObjectID;


const syncSafe = async (req, res) => {
    const { address } = req.params 
    try {
        const response = await Safe.updateMany({ address }, { $set: { ...req.body } })
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