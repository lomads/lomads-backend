const config = require('@config/config');
const axios = require('axios');
const moment = require('moment')
const mime = require('mime')
const _ = require('lodash')
const { NFTStorage, File } = require("nft.storage")

const client = new NFTStorage({ token: config.nftStorage })

const storeNFTMetadata = async (metadata, externalTokenURI) => {
    try {
        const contentType = mime.getType(metadata.image);
        const ext = mime.getExtension(contentType)
        const image_blob = await axios.get(metadata?.image, { responseType: 'blob' }).then(response => {
           return new File([response.data], `${moment.unix()}.${ext}`, { type: contentType } );       
        });
        const nft = {
            image: image_blob,
            name: metadata?.name,
            description : metadata?.description,
            token_id: metadata?.id,
            attributes: [
               {
                    trait_type: "Genesis details",
                    value: _.get(_.find(metadata.attributes, attr => attr?.trait_type === "Personal Details"), 'value', '')
               },
               {
                    trait_type: "Additional Details",
                    value: externalTokenURI
                } 
            ]
        }
        const response = client.store(nft)
        return response;
    } catch (e) {
        console.log(e)
        throw e
    }
}

module.exports = { storeNFTMetadata }