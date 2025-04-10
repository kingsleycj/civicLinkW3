# Civic Identity App - Implementation Guide

This guide will walk you through setting up, deploying, and testing the Civic Identity app. This decentralized application (dApp) allows users to create a self-sovereign identity using a soulbound NFT and provides a gas bank for new users.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask extension installed in your browser
- Basic knowledge of Ethereum/web3 development

## Project Structure

```
civic-identity/
├── contracts/
│   ├── CivicSoulbound.sol
│   ├── GasBank.sol
│   └── CivicIdentityManager.sol
├── scripts/
│   ├── deploy.js
│   └── fund-gas-bank.js
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── contractInfo.js (generated during deployment)
│   └── placeholder-nft.png
├── metadata/
│   └── (Generated NFT metadata)
├── images/
│   └── (Generated NFT images)
├── test/
│   └── civic-identity-test.js
├── .env
├── hardhat.config.js
└── package.json
```

still being worked on ...