const config = require('@config/config')

const SupportedChainId = {
    MAINNET: 1,
    GOERLI: 5,
    POLYGON: 137,
    CELO: 42220,
    BASE: 8453,
    GNOSIS = 100
  }

  const SBT_DEPLOYER_ADDRESSES  = {
    [SupportedChainId.GOERLI]: "0xD123b939B5022608241b08c41ece044059bE00f5",
    [SupportedChainId.POLYGON]: '0x022e58834d2c91Ed9C06E977B6e8aaDf019b514D',
  } 

  const GNOSIS_API_ENDPOINT  = {
    [SupportedChainId.GOERLI]: "https://safe-transaction-goerli.safe.global",
    [SupportedChainId.POLYGON]: 'https://safe-transaction-polygon.safe.global',
    [SupportedChainId.MAINNET]: 'https://safe-transaction-mainnet.safe.global',
    [SupportedChainId.CELO]: 'https://safe-transaction-celo.safe.global',
    [SupportedChainId.BASE]: 'https://safe-transaction-base.safe.global',
    [SupportedChainId.GNOSIS]: 'https://safe-transaction-gnosis-chain.safe.global/'
  } 

  const INFURA_NETWORK_URLS = (INFURA_KEY) => {
    return {
      [SupportedChainId.MAINNET]: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.GOERLI]: `https://goerli.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.POLYGON]: `https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.CELO]: `https://celo-mainnet.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.BASE]: `https://base-mainnet.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.GNOSIS]: `https://gnosis-mainnet.infura.io/v3/${INFURA_KEY}`
    }
  }

  const NETWORK_SCAN_LINKS = {
    [SupportedChainId.MAINNET]: { 
      baseUrl: `https://api.etherscan.io/`,
      apiKey: config.etherScanKey
    },
    [SupportedChainId.GOERLI]: { 
      baseUrl: `https://api-goerli.etherscan.io/`,
      apiKey: config.etherScanKey
    },
    [SupportedChainId.POLYGON]: { 
      baseUrl: `https://api.polygonscan.com/`,
      apiKey: config.polyScanKey
    },
  }

  module.exports = {
    SupportedChainId,
    SBT_DEPLOYER_ADDRESSES,
    INFURA_NETWORK_URLS,
    NETWORK_SCAN_LINKS,
    GNOSIS_API_ENDPOINT
  }
