const Metadata = require('@server/modules/metadata/metadata.model');
const Contract = require('@server/modules/contract/contract.model');

const addMetaData = async (req, res) => {
    const { contractAddress } = req.params;
    const { id, description, name, image, attributes } = req.body;

    try {
        const c = await Contract.findOne({ address: contractAddress });
        let metaData = new Metadata({
            id,
            description,
            name,
            image,
            attributes,
            contract: c._id
        })
        metaData = await metaData.save();
        return res.status(200).json({ message: 'Metadata added successfully' });
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

module.exports = { addMetaData };