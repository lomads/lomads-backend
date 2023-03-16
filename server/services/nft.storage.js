const config = require('@config/config');
const axios = require('axios');
const moment = require('moment')
const mime = require('mime')
const fetch = require("node-fetch");
const _ = require('lodash')
const { NFTStorage, File, Blob } = require("nft.storage")

const client = new NFTStorage({ token: config.nftStorage })


const getImage = async (imageOriginUrl) => {
    const r = await fetch(imageOriginUrl)
    if (!r.ok) {
      throw new Error(`error fetching image: [${r.statusCode}]: ${r.status}`)
    }
    return await r.blob()
  }

const storeNFTMetadata = async (metadata, externalTokenURI) => {
    try {
        const image_blob = await getImage(metadata?.image)
        const cid = await client.storeBlob(image_blob);
        const nft = {
            image: `https://ipfs.io/ipfs/${cid}`,
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
        const m = new Blob(JSON.stringify(nft), { type: 'application/json' });
        const metadataCid = await client.storeBlob(m);
        const metadataUrl = `https://ipfs.io/ipfs/${metadataCid}`;
        return metadataUrl;
    } catch (e) {
        console.log(e)
        throw e
    }
}

module.exports = { storeNFTMetadata }