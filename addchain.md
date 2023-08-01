## Add a New Blockchain

To add a new blockchain take  the following steps


### Step 1: New chain scan key

Modify the .env file to add the API key to scan the new blockchain for transactions, addresses, tokens, prices etc. (example Etherscan API key for Ethereum)


### Step 2: 

Go to the file [config/config.js](config/config.js) and create a new API key variable for the new chain

        etherScanKey: envVars.ETHERSCAN_KEY,
        polyScanKey: envVars.POLYSCAN_KEY,
        newChainScanKey: envVars.NewChain_KEY,


### Step 3: 

Go to the file [config/constants.js](config/constants.js) and make the following additions

- Add chain id
        const SupportedChainId = {
          MAINNET: 1,
          GOERLI: 5,
          POLYGON: 137,
          NewChain: chainid
        }

- Add Gnosis Safe API endpoint
  
        const GNOSIS_API_ENDPOINT  = {
        [SupportedChainId.GOERLI]: "https://safe-transaction-goerli.safe.global",
        [SupportedChainId.POLYGON]: 'https://safe-transaction-polygon.safe.global',
        [SupportedChainId.MAINNET]: 'https://safe-transaction-mainnet.safe.global',
        [SupportedChainId.New_Chain_Name]: 'URL'
        }

- Add Infura url for the new chain

        const INFURA_NETWORK_URLS = (INFURA_KEY) => {
          return {
            [SupportedChainId.MAINNET]: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
            [SupportedChainId.GOERLI]: `https://goerli.infura.io/v3/${INFURA_KEY}`,
            [SupportedChainId.POLYGON]: `https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`,
            [SupportedChainId.New_Chain_Name]: `URL${INFURA_KEY}`
          }
        }

- Add network scan link for the new chain
  
        const NETWORK_SCAN_LINKS = {
          [SupportedChainId.MAINNET]: { 
            baseUrl: `https://api.etherscan.io/`,
            apiKey: config.etherScanKey
          },
          [SupportedChainId.New_Chain_Name]: { 
            baseUrl: `URL`,
            apiKey: config.newChainScanKey
          },
