const Metadata = require('@server/modules/metadata/metadata.model');
const Contract = require('@server/modules/contract/contract.model');
const DAO = require('@server/modules/dao/dao.model');

const addMetaData = async (req, res) => {
    const { contractAddress } = req.params;
    const { id, description, name, image, attributes, daoUrl } = req.body;

    try {
        let c = await Contract.findOne({ address: contractAddress });
        let metaData = new Metadata({
            id,
            description,
            name,
            image,
            attributes,
            contract: c._id
        })
        metaData = await metaData.save();
        c.metadata.push(metaData);
        c = await c.save();
        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe sbt members.member projects', populate: { path: 'owners members transactions' } })
        return res.status(200).json(d);
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

module.exports = { addMetaData };