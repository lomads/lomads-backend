const { ethers } = require('ethers');

async function listenForEventsFromMultipleChains() {
  // Provider and Signer for each chain
  const providers = [
    new ethers.providers.JsonRpcProvider('https://polygon-mainnet.infura.io/v3/d0af28e9393847b29d1fc1d16ce1aac9'),
    //new ethers.providers.JsonRpcProvider('https://polygon-mainnet.infura.io/v3/d0af28e9393847b29d1fc1d16ce1aac9'),
    // Add more providers as needed
  ];
  const privateKeys = [
    '0xd171ad2d4323c83bbfc361ffab115135fd7b4f5df2931c0242c0bf3af09964f0',
    //'CHAIN2_PRIVATE_KEY',
    // Add more private keys corresponding to each chain
  ];
  const signers = privateKeys.map((privateKey, i) => new ethers.Wallet(privateKey, providers[i]));

  // Contract ABIs and Addresses for each chain
  const contracts = [
    {
      chainId: 137,
      abi: require('./safeabi.json'),
      address: '0x99B0A089A18164375F134E9ad5Fcd2e48abdDc8D'
    },
    {
        chainId: 137,
        abi: require('./safeabi.json'),
        address: '0xCa1D34B64142AdE4123799d7e47A9fD4b43a5dbc'
      },
    // {
    //   chainId: 2,
    //   abi: [/* ABI of Contract 1 on Chain 2 */],
    //   address: 'CONTRACT_1_ADDRESS_CHAIN_2'
    // },
    // Add more contract objects as needed for different chains
  ];

  // Create contract instances and event filters for each chain
  const contractInstances = [];
  const eventFilters = [];

  for (const contract of contracts) {
    const { chainId, abi, address } = contract;
    const provider = providers.find(async p => await p.getNetwork()?.chainId === chainId);
    const signer = signers.find(s => s.provider.getNetwork()?.chainId === chainId);
    const contractInstance = new ethers.Contract(address, abi, signer || provider);
    contractInstances.push(contractInstance);
    
    const eventTopics = Object.keys(contractInstance.interface.events).map(event => event);
    eventTopics.map(t => console.info(t + "  ==>  " + ethers.utils.id(t)))
    const contractEventFilters = eventTopics.map(topic => ({ address, topics: [ ethers.utils.id(topic)] }));
    eventFilters.push(...contractEventFilters);
  }

  // Event Listener for all events
  eventFilters.forEach(filter => {
    const provider = providers.find(async p => await p.getNetwork()?.chainId === filter.chainId);
    provider.on(filter, (log, event) => {
      console.log('Event received:', event, log);
    });
  });
}

// Invoke the function to start listening for events from multiple contracts on multiple chains
listenForEventsFromMultipleChains().catch(console.error);