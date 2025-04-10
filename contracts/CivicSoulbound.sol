// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CivicSoulbound is ERC721, Ownable {
    uint256 public tokenIds;
    mapping(address => bool) public hasMinted;
    mapping(uint256 => string) private _tokenURIs;
    
    // Base URI for the metadata
    string public baseURI;
    
    constructor(string memory initialBaseURI) ERC721("CivicIdentity", "CID") Ownable(msg.sender) {
        baseURI = initialBaseURI;
    }
    
    function mint() external {
        require(!hasMinted[msg.sender], "Already minted a Civic Identity NFT");
        
        uint256 newTokenId = tokenIds;
        _safeMint(msg.sender, newTokenId);
        
        // Generate token URI based on the address
        string memory uri = string(abi.encodePacked(baseURI, "/", toHexString(uint160(msg.sender))));
        _setTokenURI(newTokenId, uri);
        
        hasMinted[msg.sender] = true;
        tokenIds++;
    }
    
    function mintFor(address recipient) external onlyOwner {
        require(!hasMinted[recipient], "Recipient already has a Civic Identity NFT");
        
        uint256 newTokenId = tokenIds;
        _safeMint(recipient, newTokenId);
        
        // Generate token URI based on the recipient address
        string memory uri = string(abi.encodePacked(baseURI, "/", toHexString(uint160(recipient))));
        _setTokenURI(newTokenId, uri);
        
        hasMinted[recipient] = true;
        tokenIds++;
    }
    
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        baseURI = newBaseURI;
    }
    
    // Override the transfer functions to make token soulbound
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0) || to == address(0), "Soulbound: NFT cannot be transferred, only minted or burned");
        return super._update(to, tokenId, auth);
    }
    
    // Allow burning of tokens by their owners
    function burn(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Only the owner can burn their token");
        _burn(tokenId);
        hasMinted[msg.sender] = false; // Allow reminting after burning
    }

    // Helper function to convert address to hex string
    function toHexString(uint160 value) internal pure returns (string memory) {
        bytes memory buffer = new bytes(40);
        for (uint256 i = 0; i < 40; i++) {
            uint8 nibble = uint8(value % 16);
            if (nibble < 10) {
                buffer[39 - i] = bytes1(nibble + 48); // 0-9
            } else {
                buffer[39 - i] = bytes1(nibble + 87); // a-f
            }
            value /= 16;
        }
        return string(buffer);
    }

    // Override tokenURI to use our custom URI storage
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }

    // Internal function to set token URI
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        _requireOwned(tokenId);
        _tokenURIs[tokenId] = _tokenURI;
    }
}