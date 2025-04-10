const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy Gas Bank first
  const GasBank = await hre.ethers.getContractFactory("GasBank");
  const gasBank = await GasBank.deploy();
  await gasBank.deployed();
  console.log("GasBank deployed to:", gasBank.address);

  // Fund the Gas Bank
  const fundTx = await deployer.sendTransaction({
    to: gasBank.address,
    value: hre.ethers.utils.parseEther("0.1") // Fund with 0.1 ETH
  });
  await fundTx.wait();
  console.log("GasBank funded with 0.1 ETH");

  // Deploy CivicSoulbound NFT
  const baseURI = "https://civicidentity.example.com/metadata";
  const CivicSoulbound = await hre.ethers.getContractFactory("CivicSoulbound");
  const civicNFT = await CivicSoulbound.deploy(baseURI);
  await civicNFT.deployed();
  console.log("CivicSoulbound NFT deployed to:", civicNFT.address);

  // Deploy Identity Manager
  const CivicIdentityManager = await hre.ethers.getContractFactory("CivicIdentityManager");
  const manager = await CivicIdentityManager.deploy(civicNFT.address, gasBank.address);
  await manager.deployed();
  console.log("CivicIdentityManager deployed to:", manager.address);

  // Set up permissions
  const authorizeTx = await gasBank.authorizeContract(civicNFT.address);
  await authorizeTx.wait();
  console.log("Authorized CivicSoulbound contract in GasBank");

  // Save the contract addresses for frontend use
  const fs = require("fs");
  const contractAddresses = {
    gasBank: gasBank.address,
    civicNFT: civicNFT.address,
    identityManager: manager.address,
    network: hre.network.name
  };

  fs.writeFileSync("frontend/contractInfo.js", 
    `const contractAddresses = ${JSON.stringify(contractAddresses, null, 2)};\n` +
    `export default contractAddresses;`
  );
  console.log("Contract addresses saved to frontend/contractInfo.js");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });