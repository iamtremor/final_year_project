// backend/config.js
require('dotenv').config();

module.exports = {
  app: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    uri: process.env.MONGO_URI || "mongodb+srv://final_year_project_user:Thefireisnotsohot22@cluster0.qo6sc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  },
  jwt: {
    secret: process.env.JWT_SECRET ||'YFS2mH4t&<L9.8]{>kgrKMP,Z!/N6-y',
    expiresIn: '7d',
  },
  blockchain: {
    // Blockchain provider URL (Infura, Alchemy, or local node)
    providerUrl: process.env.BLOCKCHAIN_PROVIDER_URL || 'http://127.0.0.1:7545',
    
    // Smart contract address
    contractAddress: process.env.CONTRACT_ADDRESS || 0x6EFd0C081e60D88A7EEE098087b2C27427C56A6e,
    
    // Private key for signing transactions (should be in .env file)
    privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
    
    // Gas settings
    gasLimit: process.env.GAS_LIMIT || 3000000,
    
    // Network ID
    networkId: process.env.NETWORK_ID || 1337,
  },
  storage: {
    // Document storage location
    documentsPath: process.env.DOCUMENTS_PATH || 'uploads/documents',
  }
};