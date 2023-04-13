const config = require('@config/config')

const SupportedChainId = {
    MAINNET: 1,
    ROPSTEN: 3,
    RINKEBY: 4,
    GOERLI: 5,
    KOVAN: 42,
    ARBITRUM_ONE: 42161,
    ARBITRUM_RINKEBY: 421611,
    OPTIMISM: 10,
    OPTIMISTIC_KOVAN: 69,
    POLYGON: 137,
    POLYGON_MUMBAI: 80001,
  }

  const SBT_DEPLOYER_ADDRESSES  = {
    [SupportedChainId.GOERLI]: "0xD123b939B5022608241b08c41ece044059bE00f5",
    [SupportedChainId.POLYGON]: '0x022e58834d2c91Ed9C06E977B6e8aaDf019b514D',
  } 

  const GOERLI_API_ENDPOINT  = {
    [SupportedChainId.GOERLI]: "https://safe-transaction-goerli.safe.global",
    [SupportedChainId.POLYGON]: 'https://safe-transaction-polygon.safe.global',
    [SupportedChainId.MAINNET]: 'https://safe-transaction-mainnet.safe.global'
  } 

  const INFURA_NETWORK_URLS = (INFURA_KEY) => {
    return {
      [SupportedChainId.MAINNET]: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.RINKEBY]: `https://rinkeby.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.ROPSTEN]: `https://ropsten.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.GOERLI]: `https://goerli.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.KOVAN]: `https://kovan.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.OPTIMISM]: `https://optimism-mainnet.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.OPTIMISTIC_KOVAN]: `https://optimism-kovan.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.ARBITRUM_ONE]: `https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.ARBITRUM_RINKEBY]: `https://arbitrum-rinkeby.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.POLYGON]: `https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`,
      [SupportedChainId.POLYGON_MUMBAI]: `https://polygon-mumbai.infura.io/v3/${INFURA_KEY}`,
    }
  }

  const NETWORK_SCAN_LINKS = {
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
    NETWORK_SCAN_LINKS
  }