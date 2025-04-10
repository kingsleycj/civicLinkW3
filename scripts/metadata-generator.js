const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const { ethers } = require('ethers');

// Configuration
const outputDir = './metadata';
const imagesDir = './images';

// Create directories if they don't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Generate identicon for an address
function generateIdenticon(address, size = 400) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, size, size);
  
  // Generate colors from address
  const hash = ethers.utils.keccak256('0x' + address.slice(2));
  const hue = parseInt(hash.slice(2, 8), 16) % 360;
  const primaryColor = `hsl(${hue}, 80%, 60%)`;
  const secondaryColor = `hsl(${(hue + 180) % 360}, 80%, 60%)`;
  
  // Draw geometric patterns based on address bytes
  const cellSize = size / 8;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const positionByte = parseInt(hash.slice(2 + (i * 8 + j) % 60, 4 + (i * 8 + j) % 60), 16);
      
      // Mirror the left side to the right for symmetry
      const shouldFill = j < 4 ? (positionByte % 2 === 0) : 
                              (parseInt(hash.slice(2 + (i * 8 + (7 - j)) % 60, 4 + (i * 8 + (7 - j)) % 60), 16) % 2 === 0);
      
      if (shouldFill) {
        const shapeType = positionByte % 4;
        ctx.fillStyle = positionByte % 8 < 4 ? primaryColor : secondaryColor;
        
        const x = j * cellSize;
        const y = i * cellSize;
        
        // Different shapes based on the hash value
        switch (shapeType) {
          case 0: // Square
            ctx.fillRect(x, y, cellSize, cellSize);
            break;
          case 1: // Circle
            ctx.beginPath();
            ctx.arc(x + cellSize/2, y + cellSize/2, cellSize/2, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 2: // Triangle
            ctx.beginPath();
            ctx.moveTo(x + cellSize/2, y);
            ctx.lineTo(x + cellSize, y + cellSize);
            ctx.lineTo(x, y + cellSize);
            ctx.closePath();
            ctx.fill();
            break;
          case 3: // Diamond
            ctx.beginPath();
            ctx.moveTo(x + cellSize/2, y);
            ctx.lineTo(x + cellSize, y + cellSize/2);
            ctx.lineTo(x + cellSize/2, y + cellSize);
            ctx.lineTo(x, y + cellSize/2);
            ctx.closePath();
            ctx.fill();
            break;
        }
      }
    }
  }
  
  // Add civic identity badge overlay
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/4, 0, Math.PI * 2);
  ctx.fill();
  
  // Add text "CIVIC ID"
  ctx.font = `bold ${size/10}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#333333';
  ctx.fillText('CIVIC ID', size/2, size/2);
  
  return canvas.toBuffer('image/png');
}

// Generate metadata for an address
function generateMetadata(address) {
  const did = `did:ethr:${address}`;
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  // Generate and save the image
  const imageBuffer = generateIdenticon(address);
  const imagePath = path.join(imagesDir, `${address}.png`);
  fs.writeFileSync(imagePath, imageBuffer);
  
  // Create the metadata
  const metadata = {
    name: `Civic Identity - ${shortAddress}`,
    description: `A soulbound Civic Identity NFT for ${shortAddress}. This token represents a decentralized identity (DID) on the blockchain.`,
    image: `https://civicidentity.example.com/images/${address}.png`,
    external_url: `https://civicidentity.example.com/profile/${address}`,
    attributes: [
      {
        trait_type: "Identity Type",
        value: "Civic"
      },
      {
        trait_type: "DID Method",
        value: "ethr"
      },
      {
        trait_type: "Creation Date",
        value: new Date().toISOString().split('T')[0]
      },
      {
        display_type: "date", 
        trait_type: "Creation Timestamp", 
        value: Math.floor(Date.now() / 1000)
      }
    ],
    properties: {
      did: did,
      address: address,
      type: "soulbound"
    }
  };
  
  // Save the metadata
  const metadataPath = path.join(outputDir, `${address}.json`);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  
  return { metadata, imagePath };
}

// Generate some example identities
function generateExamples() {
  const addresses = [
    "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
    "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
    "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E"
  ];
  
  addresses.forEach(address => {
    const { metadata, imagePath } = generateMetadata(address);
    console.log(`Generated metadata for ${address}:`);
    console.log(`- Metadata: ${path.join(outputDir, `${address}.json`)}`);
    console.log(`- Image: ${imagePath}`);
    console.log();
  });
}

// Script execution
console.log("Generating example NFT metadata and images...");
generateExamples();
console.log("Done!");

// Export for use in other scripts
module.exports = {
  generateMetadata,
  generateIdenticon
};