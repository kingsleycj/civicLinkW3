const { ethers } = require("ethers");

function generateDID(address) {
  return `did:ethr:${address}`;
}

// Example:
const wallet = ethers.Wallet.createRandom();
console.log("Generated Address:", wallet.address);
console.log("DID:", generateDID(wallet.address));

module.exports = generateDID;
