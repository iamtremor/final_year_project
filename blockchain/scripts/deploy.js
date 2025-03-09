const { ethers } = require("hardhat");

async function main() {
  // Get the contract factory
  const EnrollmentSystem = await ethers.getContractFactory("EnrollmentSystem");
  
  console.log("Deploying EnrollmentSystem contract...");
  
  // Deploy the contract
  const enrollmentSystem = await EnrollmentSystem.deploy();
  await enrollmentSystem.deployed();
  
  console.log("EnrollmentSystem deployed to:", enrollmentSystem.address);
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });