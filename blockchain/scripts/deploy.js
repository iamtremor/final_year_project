const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const EnrollmentSystem = await ethers.getContractFactory("EnrollmentSystem");
  const contract = await EnrollmentSystem.deploy();

  await contract.deployed();
  console.log("EnrollmentSystem deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });