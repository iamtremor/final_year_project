// Save this as backend/scripts/testBlockchainConnection.js

const blockchainService = require('../../services/blockchainService');
const config = require('../../config');

async function testBlockchainConnection() {
  console.log('Testing blockchain connection...');
  console.log('Configuration:');
  console.log('- Provider URL:', config.blockchain.providerUrl);
  console.log('- Contract Address:', config.blockchain.contractAddress);
  console.log('- Private Key Exists:', !!config.blockchain.privateKey);
  
  try {
    // Check if provider is initialized
    if (!blockchainService.provider) {
      console.error('ERROR: Provider is not initialized');
      return false;
    }
    
    console.log('Provider Connection URL:', blockchainService.provider.connection.url);
    
    // Check connection to network
    try {
      const network = await blockchainService.provider.getNetwork();
      console.log('Successfully connected to network:');
      console.log('- Network Name:', network.name);
      console.log('- Chain ID:', network.chainId);
    } catch (networkError) {
      console.error('ERROR: Failed to connect to network:', networkError.message);
      return false;
    }
    
    // Check contract initialization
    if (!blockchainService.contract) {
      console.error('ERROR: Contract is not initialized');
      return false;
    }
    
    console.log('Contract address:', blockchainService.contract.address);
    
    // Try to call a simple view function
    try {
      const admin = await blockchainService.contract.admin();
      console.log('Successfully called contract.admin():', admin);
    } catch (callError) {
      console.error('ERROR: Failed to call contract.admin():', callError.message);
      return false;
    }
    
    // Try diagnosing the contract
    try {
      const diagnosis = await blockchainService.diagnoseContract();
      console.log('Contract diagnosis successful:');
      console.log('- Functions available:', diagnosis.functions.length);
    } catch (diagnoseError) {
      console.error('ERROR: Failed to diagnose contract:', diagnoseError.message);
    }
    
    console.log('Blockchain connection test PASSED');
    return true;
  } catch (error) {
    console.error('Error testing blockchain connection:', error);
    return false;
  }
}

// Run the test
testBlockchainConnection()
  .then(success => {
    console.log('Test completed with result:', success ? 'SUCCESS' : 'FAILURE');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });

// To run this script:
// node scripts/testBlockchainConnection.js