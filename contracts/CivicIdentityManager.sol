// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

interface ICivicSoulbound {
    function mint() external;
    function mintFor(address recipient) external;
    function hasMinted(address user) external view returns (bool);
}

interface IGasBank {
    function provideGas(address user, address targetContract) external returns (bool);
}

contract CivicIdentityManager is Ownable {
    ICivicSoulbound public civicNFT;
    IGasBank public gasBank;
    
    // Storing DID mappings
    mapping(address => string) public addressToDID;
    
    event IdentityCreated(address indexed user, string did);
    event ContractsUpdated(address indexed nftContract, address indexed gasBankContract);
    
    constructor(address _civicNFT, address _gasBank) Ownable(msg.sender) {
        civicNFT = ICivicSoulbound(_civicNFT);
        gasBank = IGasBank(_gasBank);
    }
    
    // Update contract addresses if needed
    function updateContracts(address _civicNFT, address _gasBank) external onlyOwner {
        civicNFT = ICivicSoulbound(_civicNFT);
        gasBank = IGasBank(_gasBank);
        emit ContractsUpdated(_civicNFT, _gasBank);
    }
    
    // Create identity with gas assistance
    function createIdentity() external {
        require(!civicNFT.hasMinted(msg.sender), "Identity already exists");
        
        // Generate DID
        string memory did = generateDID(msg.sender);
        addressToDID[msg.sender] = did;
        
        // Try to mint with user's gas
        try civicNFT.mint() {
            // Successfully minted with user's gas
        } catch {
            // If user doesn't have gas, use gas bank
            gasBank.provideGas(msg.sender, address(civicNFT));
            civicNFT.mintFor(msg.sender);
        }
        
        emit IdentityCreated(msg.sender, did);
    }
    
    // Admin function to create identity for a user
    function createIdentityFor(address user) external onlyOwner {
        require(!civicNFT.hasMinted(user), "Identity already exists");
        
        // Generate DID
        string memory did = generateDID(user);
        addressToDID[user] = did;
        
        // Mint directly for the user
        civicNFT.mintFor(user);
        
        emit IdentityCreated(user, did);
    }
    
    // Helpers
    function generateDID(address user) internal pure returns (string memory) {
        return string(abi.encodePacked("did:ethr:", toHexString(user)));
    }
    
    function toHexString(address addr) internal pure returns (string memory) {
        bytes memory buffer = new bytes(42);
        buffer[0] = '0';
        buffer[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint256(uint160(addr)) / (2**(8 * (19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            buffer[2 + i * 2] = char(hi);
            buffer[3 + i * 2] = char(lo);
        }
        return string(buffer);
    }
    
    function char(bytes1 b) internal pure returns (bytes1) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
    
    // Check if an address has a civic identity
    function hasIdentity(address user) external view returns (bool) {
        return civicNFT.hasMinted(user);
    }
    
    // Get DID for an address
    function getDID(address user) external view returns (string memory) {
        return addressToDID[user];
    }
}