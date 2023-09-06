const config = require('@config/config')

const SupportedChainId = {
    MAINNET: 1,
    GOERLI: 5,
    POLYGON: 137,
    CELO: 42220,
    BASE: 8453,
    OPTIMISM : 10,
    ARBITRUM : 42161,
    AVALANCHE : 43114,
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
    [SupportedChainId.OPTIMISM]:'https://safe-transaction-optimism.safe.global',
    [SupportedChainId.ARBITRUM]:'https://safe-transaction-arbitrum.safe.global',
    [SupportedChainId.AVALANCHE]:'https://safe-transaction-avalanche.safe.global'
  } 

  const INFURA_NETWORK_URLS = (INFURA_KEY) => {
    return {
      [SupportedChainId.MAINNET]: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.GOERLI]: `https://goerli.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.POLYGON]: `https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.CELO]: `https://celo-mainnet.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.BASE]: `https://base-mainnet.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.OPTIMISM]: `https://optimism-mainnet.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.ARBITRUM]: `https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.AVALANCHE]: `https://avalanche-mainnet.infura.io/v3/${INFURA_KEY}`,
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
    [SupportedChainId.CELO]: { 
      baseUrl: `https://api.celoscan.com/`,
      apiKey: config.celoScanKey
    },
    [`${SupportedChainId.BASE}`]: {
      id: "base",
      symbol: "BASE",
    },
    [`${SupportedChainId.OPTIMISM}`]: {
      id: "opt",
      symbol: "ETH",
    },
    [`${SupportedChainId.ARBITRUM}`]: {
      id: "arb",
      symbol: "ETH",
    },
    [`${SupportedChainId.AVALANCHE}`]: {
      id: "avax",
      symbol: "AVAX",
    },
  }

  module.exports = {
    SupportedChainId,
    SBT_DEPLOYER_ADDRESSES,
    INFURA_NETWORK_URLS,
    NETWORK_SCAN_LINKS,
    GNOSIS_API_ENDPOINT
  }