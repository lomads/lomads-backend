const Metadata = require('@server/modules/metadata/metadata.model');
const Contract = require('@server/modules/contract/contract.model');
const Member = require('@server/modules/member/member.model');
const DAO = require('@server/modules/dao/dao.model');
const { storeNFTMetadata } = require('../../services/nft.storage');
const ObjectId = require('mongodb').ObjectID;

const addMetaData = async (req, res) => {
    const { _id } = req.user;
    let { contractAddress } = req.params;
    const { link = null } = req.query
    const { id, description, name, image, attributes, daoUrl } = req.body;

    if(!contractAddress)
        contractAddress = req?.body?.contract

    try {
        let c = await Contract.findOne({ address: contractAddress });

        let metadata = await Metadata.findOne({ id, contract: c._id })

        if(!metadata) {
            metaData = new Metadata({
                id,
                description,
                name,
                image,
                attributes,
                contract: c._id
            })
            metaData = await metaData.save();
        } else {
            metadata.description = description;
            metadata.name = name;
            metadata.image = image;
            metadata.attributes = attributes;
            metaData = await metaData.save();
        }

        if(link) {
            await Contract.findOneAndUpdate({ address: contractAddress }, 
                { $addToSet : { metadata: ObjectId(metaData._id) } }
            )
            await Member.findOneAndUpdate(
                { _id },             
                { $addToSet: { sbtTokens: ObjectId(c._id), sbtMetaData: ObjectId(metaData._id) } }
            )
        }

        const d = await DAO.findOne({ url: daoUrl }).populate({ path: 'safe safes sbt members.member projects tasks', populate: { path: 'owners members members.member tasks transactions project metadata' } })
        return res.status(200).json({ message: "success" });
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}


const getMetadata = async (req, res) => {
    try {
        const { contractAddress } = req.params;
        const { wallet } = req.user;
        console.log(wallet)
        let c = null;
        if(contractAddress.indexOf('0x') > -1)
           c = await Contract.findOne({ address: contractAddress });
        else
           c = await Contract.findOne({ _id: contractAddress });      
        const metadata = await Metadata.findOne({
            contract: c._id,
            "attributes.value": { $regex: new RegExp(`^${wallet}$`, "i") }
        })
        if (!metadata)
            return res.status(404).json({ message: 'Metadata not found' })
        return res.status(200).json(metadata)
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const update = async (req, res) => {
    try {
        const { contractAddress } = req.params;
        const { wallet } = req.user; 
        const {attributes} = req.body;
        const metadata = await Metadata.findOneAndUpdate({
            contract: contractAddress,
            "attributes.value": { $regex: new RegExp(`^${wallet}$`, "i") }
        }, {
            $set : { attributes }
        })
        if (!metadata)
            return res.status(404).json({ message: 'Metadata not found' })
        return res.status(200).json(metadata)
        
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const createIPFSMetadata = async (req, res) => {
    const { metadata, tokenURI } = req.body 
    try {
        const response = await storeNFTMetadata(metadata, tokenURI)
        console.log(response)
        return res.status(200).json(response)
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

module.exports = { addMetaData, getMetadata, update, createIPFSMetadata };