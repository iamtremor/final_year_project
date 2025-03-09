require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
// Don't use the placeholder variable, directly use the string in the accounts array
module.exports = {
  solidity: "0.8.17",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: ["0x6f28844596dc1a6489afb8c9fb778336a854b7847b6a88e9f35bb70e4530d07c"]
      // Remove the nested accounts object and mnemonic
    }
  }
};