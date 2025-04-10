// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract GasBank is Ownable {
    mapping(address => bool) public allowedContracts;
    
    event GasProvided(address indexed user, address indexed targetContract, uint256 gasAmount);
    event ContractAuthorized(address indexed contractAddress);
    event ContractDeauthorized(address indexed contractAddress);
    event FundsAdded(address indexed from, uint256 amount);
    event FundsWithdrawn(address indexed to, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    // Allow contract to receive ETH
    receive() external payable {
        emit FundsAdded(msg.sender, msg.value);
    }
    
    // Admin functions to manage allowed contracts
    function authorizeContract(address contractAddress) external onlyOwner {
        allowedContracts[contractAddress] = true;
        emit ContractAuthorized(contractAddress);
    }
    
    function deauthorizeContract(address contractAddress) external onlyOwner {
        allowedContracts[contractAddress] = false;
        emit ContractDeauthorized(contractAddress);
    }
    
    // Function to provide gas for a user interacting with an allowed contract
    function provideGas(address user, address targetContract) external returns (bool) {
        require(allowedContracts[targetContract], "Contract not authorized for gas sponsorship");
        
        // Calculate a reasonable gas amount (adjust as needed)
        uint256 gasAmount = 0.001 ether;
        require(address(this).balance >= gasAmount, "Insufficient funds in gas bank");
        
        // Transfer ETH to the user
        (bool success, ) = user.call{value: gasAmount}("");
        require(success, "Gas transfer failed");
        
        emit GasProvided(user, targetContract, gasAmount);
        return true;
    }
    
    // Admin function to withdraw funds if needed
    function withdraw(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");
        emit FundsWithdrawn(msg.sender, amount);
    }
    
    // Check balance of the gas bank
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}