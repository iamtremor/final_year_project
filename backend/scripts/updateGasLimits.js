// Save as backend/scripts/updateGasLimits.js

const fs = require('fs');
const path = require('path');

// Path to the blockchain service file
const serviceFilePath = path.join(__dirname, '..', 'services', 'blockchainService.js');

// Read the file
let content = fs.readFileSync(serviceFilePath, 'utf8');

// Update all gas limits in the file
// This regex finds gasLimit settings with numbers and updates them
content = content.replace(/gasLimit:\s*(\d+)/g, (match, limit) => {
  const currentLimit = parseInt(limit);
  const newLimit = Math.max(currentLimit, 1000000); // Set minimum of 1,000,000
  return `gasLimit: ${newLimit}`;
});

// Write the updated content back to the file
fs.writeFileSync(serviceFilePath, content);

console.log('Updated gas limits in blockchainService.js');

// Update the config.js file
const configFilePath = path.join(__dirname, '..', 'config.js');
let configContent = fs.readFileSync(configFilePath, 'utf8');

// Update the gas limit in config
configContent = configContent.replace(
  /gasLimit:\s*process\.env\.GAS_LIMIT\s*\|\|\s*\d+/,
  'gasLimit: process.env.GAS_LIMIT || 6000000'
);

// Write the updated content back to the file
fs.writeFileSync(configFilePath, configContent);

console.log('Updated gas limit in config.js');

console.log('All gas limits have been updated. Restart your server for changes to take effect.');