// Remove the import since we'll define contract addresses directly
const contractAddresses = {
    identityManager: "0x...", // Replace with your deployed contract address
    civicNFT: "0x..." // Replace with your deployed contract address
};

// Load ethers from CDN
const ethersScript = document.createElement('script');
ethersScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js';
ethersScript.async = true;

// Wait for DOM and ethers to load before initializing the app
document.addEventListener('DOMContentLoaded', () => {
    ethersScript.onload = () => {
        // Initialize the app after ethers is loaded
        window.app = new CivicIdentityApp();
    };
    document.head.appendChild(ethersScript);
});

// ABI definitions
const CivicIdentityManagerABI = [
    "function createIdentity() external",
    "function hasIdentity(address user) external view returns (bool)",
    "function getDID(address user) external view returns (string)",
    "event IdentityCreated(address indexed user, string did)"
];

const CivicSoulboundABI = [
    "function tokenIds() external view returns (uint256)",
    "function tokenURI(uint256 tokenId) external view returns (string)",
    "function ownerOf(uint256 tokenId) external view returns (address)",
    "function balanceOf(address owner) external view returns (uint256)"
];

// App Class
class CivicIdentityApp {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.networkName = null;
        this.managerContract = null;
        this.nftContract = null;
        this.hasIdentity = false;
        this.tokenId = null;
        this.did = null;
        
        // DOM Elements
        this.connectWalletBtn = document.getElementById('connect-wallet');
        this.createIdentityBtn = document.getElementById('create-identity');
        this.walletStatusText = document.getElementById('wallet-status-text');
        this.walletIndicator = document.getElementById('wallet-indicator');
        this.networkNameEl = document.getElementById('network-name');
        this.networkIndicator = document.getElementById('network-indicator');
        this.welcomeSection = document.getElementById('welcome-section');
        this.identitySection = document.getElementById('identity-section');
        this.noIdentityView = document.getElementById('no-identity-view');
        this.hasIdentityView = document.getElementById('has-identity-view');
        this.loadingSpinner = document.getElementById('loading-spinner');
        
        // Identity View Elements
        this.didValueEl = document.getElementById('did-value');
        this.walletAddressEl = document.getElementById('wallet-address');
        this.tokenIdEl = document.getElementById('token-id');
        this.creationDateEl = document.getElementById('creation-date');
        this.nftImageEl = document.getElementById('nft-image');
        this.viewOnExplorerBtn = document.getElementById('view-on-explorer');
        
        // Toast notification elements
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toast-message');
        this.toastCloseBtn = document.getElementById('toast-close');
        
        // Modal elements
        this.txModal = document.getElementById('tx-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.modalSpinner = document.getElementById('modal-spinner');
        this.modalDetails = document.getElementById('modal-details');
        this.txHashEl = document.getElementById('tx-hash');
        this.txStatusEl = document.getElementById('tx-status');
        this.viewTxBtn = document.getElementById('view-tx');
        this.modalCloseBtn = document.getElementById('modal-close');
        this.modalActionBtn = document.getElementById('modal-action');
        
        // Copy buttons
        this.copyDidBtn = document.getElementById('copy-did');
        this.copyAddressBtn = document.getElementById('copy-address');
        this.copyTxBtn = document.getElementById('copy-tx');
        
        // Initialize app
        this.init();
    }
    
    async init() {
        // Check if MetaMask is installed
        if (typeof window.ethereum !== 'undefined') {
            console.log('MetaMask is installed!');
            await this.setupEventListeners();
            
            // Check if user was previously connected
            if (localStorage.getItem('walletConnected') === 'true') {
                this.connectWallet();
            }
        } else {
            this.showToast('MetaMask is not installed. Please install MetaMask to use this app.', 'error');
            this.connectWalletBtn.textContent = 'Install MetaMask';
            this.connectWalletBtn.addEventListener('click', () => {
                window.open('https://metamask.io/download.html', '_blank');
            });
        }
    }
    
    setupEventListeners() {
        // Connect wallet button
        this.connectWalletBtn.addEventListener('click', () => this.connectWallet());
        
        // Create identity button
        this.createIdentityBtn.addEventListener('click', () => this.createIdentity());
        
        // View on explorer button
        this.viewOnExplorerBtn.addEventListener('click', () => this.viewNFTOnExplorer());
        
        // Toast close button
        this.toastCloseBtn.addEventListener('click', () => this.hideToast());
        
        // Modal close buttons
        this.modalCloseBtn.addEventListener('click', () => this.hideModal());
        this.modalActionBtn.addEventListener('click', () => this.hideModal());
        
        // Copy buttons
        this.copyDidBtn.addEventListener('click', () => this.copyToClipboard(this.didValueEl.textContent, 'DID copied to clipboard!'));
        this.copyAddressBtn.addEventListener('click', () => this.copyToClipboard(this.walletAddressEl.textContent, 'Address copied to clipboard!'));
        this.copyTxBtn.addEventListener('click', () => this.copyToClipboard(this.txHashEl.textContent, 'Transaction hash copied to clipboard!'));
        
        // View transaction button
        this.viewTxBtn.addEventListener('click', () => {
            const txHash = this.txHashEl.textContent;
            this.openExplorerLink(txHash, 'tx');
        });
        
        // Listen for account changes in MetaMask
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log('Account changed:', accounts[0]);
                this.connectWallet();
            });
            
            window.ethereum.on('chainChanged', (chainId) => {
                console.log('Network changed:', chainId);
                window.location.reload();
            });
        }
    }
    
    async connectWallet() {
        try {
            this.showLoading();
            
            // Request account access if needed
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            
            // Initialize ethers provider and signer
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.userAddress = account;
            
            // Get network information
            const network = await this.provider.getNetwork();
            this.networkName = network.name === 'unknown' ? `Chain ID: ${network.chainId}` : network.name;
            
            // Initialize contracts
            this.initializeContracts();
            
            // Update UI
            this.walletStatusText.textContent = `${this.userAddress.substring(0, 6)}...${this.userAddress.substring(this.userAddress.length - 4)}`;
            this.walletIndicator.classList.remove('disconnected');
            this.walletIndicator.classList.add('connected');
            this.connectWalletBtn.textContent = 'Disconnect';
            this.networkNameEl.textContent = this.networkName;
            this.networkIndicator.classList.remove('disconnected-dot');
            this.networkIndicator.classList.add('connected-dot');
            
            // Save connection state
            localStorage.setItem('walletConnected', 'true');
            
            // Check if user has an identity
            await this.checkIdentity();
            
            this.hideLoading();
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.showToast('Failed to connect wallet: ' + error.message, 'error');
            this.hideLoading();
        }
    }
    
    initializeContracts() {
        // Initialize the Manager contract
        this.managerContract = new ethers.Contract(
            contractAddresses.identityManager,
            CivicIdentityManagerABI,
            this.signer
        );
        
        // Initialize the NFT contract
        this.nftContract = new ethers.Contract(
            contractAddresses.civicNFT,
            CivicSoulboundABI,
            this.signer
        );
        
        console.log('Contracts initialized');
    }
    
    async checkIdentity() {
        try {
            if (!this.managerContract) return;
            
            this.showLoading();
            this.welcomeSection.classList.add('hidden');
            this.identitySection.classList.remove('hidden');
            
            // Check if user has an identity
            this.hasIdentity = await this.managerContract.hasIdentity(this.userAddress);
            
            if (this.hasIdentity) {
                await this.loadIdentityDetails();
                this.noIdentityView.classList.add('hidden');
                this.hasIdentityView.classList.remove('hidden');
            } else {
                this.noIdentityView.classList.remove('hidden');
                this.hasIdentityView.classList.add('hidden');
            }
            
            this.hideLoading();
        } catch (error) {
            console.error('Error checking identity:', error);
            this.showToast('Failed to check identity: ' + error.message, 'error');
            this.hideLoading();
        }
    }
    
    async loadIdentityDetails() {
        try {
            // Get DID
            this.did = await this.managerContract.getDID(this.userAddress);
            this.didValueEl.textContent = this.did;
            
            // Get wallet address
            this.walletAddressEl.textContent = this.userAddress;
            
            // Get token ID (simplified approach)
            const balance = await this.nftContract.balanceOf(this.userAddress);
            if (balance.gt(0)) {
                // We're making an assumption that the tokenId is related to the user's address
                // In a real-world scenario, you would need to implement a proper way to get the user's token ID
                // For example, by having a mapping in the contract or by using an event
                this.tokenId = balance.toNumber() - 1; // This is just a placeholder
                this.tokenIdEl.textContent = this.tokenId.toString();
                
                // Get creation date (just using current date as placeholder)
                const currentDate = new Date().toLocaleDateString();
                this.creationDateEl.textContent = currentDate;
                
                // Set NFT image (placeholder for now)
                this.nftImageEl.src = `https://robohash.org/${this.userAddress}?set=set4`;
                
                console.log('Identity details loaded');
            }
        } catch (error) {
            console.error('Error loading identity details:', error);
            this.showToast('Failed to load identity details: ' + error.message, 'error');
        }
    }
    
    async createIdentity() {
        try {
            if (!this.managerContract) {
                this.showToast('Please connect your wallet first.', 'warning');
                return;
            }
            
            // Show transaction pending modal
            this.showTxModal('Transaction Pending', 'Please confirm the transaction in your wallet to create your Civic Identity.');
            
            // Send the transaction
            const tx = await this.managerContract.createIdentity();
            
            // Update modal with transaction hash
            this.txHashEl.textContent = tx.hash;
            this.modalDetails.classList.remove('hidden');
            this.viewTxBtn.classList.remove('hidden');
            
            // Wait for transaction to be mined
            this.modalMessage.textContent = 'Transaction submitted! Waiting for confirmation...';
            const receipt = await tx.wait();
            
            if (receipt.status === 1) {
                // Transaction successful
                this.txStatusEl.textContent = 'Confirmed';
                this.modalTitle.textContent = 'Identity Created!';
                this.modalMessage.textContent = 'Your Civic Identity has been successfully created.';
                this.modalSpinner.classList.add('hidden');
                this.modalActionBtn.textContent = 'View Identity';
                this.modalActionBtn.onclick = () => {
                    this.hideModal();
                    this.checkIdentity();
                };
                
                // Show success toast
                this.showToast('Identity created successfully!', 'success');
            } else {
                // Transaction failed
                this.txStatusEl.textContent = 'Failed';
                this.modalTitle.textContent = 'Transaction Failed';
                this.modalMessage.textContent = 'Failed to create your Civic Identity. Please try again.';
                this.modalSpinner.classList.add('hidden');
                
                // Show error toast
                this.showToast('Failed to create identity.', 'error');
            }
        } catch (error) {
            console.error('Error creating identity:', error);
            
            // Update modal
            this.modalTitle.textContent = 'Transaction Error';
            this.modalMessage.textContent = 'Error: ' + (error.reason || error.message);
            this.modalSpinner.classList.add('hidden');
            
            // Show error toast
            this.showToast('Failed to create identity: ' + (error.reason || error.message), 'error');
        }
    }
    
    viewNFTOnExplorer() {
        if (!this.userAddress) return;
        
        // Replace this with the correct explorer link for your network
        const explorerUrl = this.getExplorerBaseUrl();
        const explorerLink = `${explorerUrl}/token/${contractAddresses.civicNFT}?a=${this.userAddress}`;
        window.open(explorerLink, '_blank');
    }
    
    openExplorerLink(hash, type) {
        const baseUrl = this.getExplorerBaseUrl();
        const url = `${baseUrl}/${type}/${hash}`;
        window.open(url, '_blank');
    }
    
    getExplorerBaseUrl() {
        // Determine the explorer URL based on the network
        const chainId = window.ethereum.chainId;
        
        // Base Sepolia explorer URL
        if (chainId === '0x14a34' || chainId === '84532') {
            return 'https://sepolia.basescan.org';
        }
        
        // Hardhat/localhost
        if (chainId === '0x7a69' || chainId === '31337') {
            return 'http://localhost:8545';
        }
        
        // Default to Etherscan
        return 'https://etherscan.io';
    }
    
    // UI Helper Methods
    showLoading() {
        this.loadingSpinner.classList.remove('hidden');
    }
    
    hideLoading() {
        this.loadingSpinner.classList.add('hidden');
    }
    
    showToast(message, type = 'info') {
        this.toastMessage.textContent = message;
        this.toast.className = 'toast ' + type;
        this.toast.classList.remove('hidden');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            this.hideToast();
        }, 5000);
    }
    
    hideToast() {
        this.toast.classList.add('hidden');
    }
    
    showTxModal(title, message) {
        this.modalTitle.textContent = title;
        this.modalMessage.textContent = message;
        this.modalSpinner.classList.remove('hidden');
        this.modalDetails.classList.add('hidden');
        this.viewTxBtn.classList.add('hidden');
        this.modalActionBtn.textContent = 'Close';
        this.modalActionBtn.onclick = () => this.hideModal();
        this.txModal.classList.remove('hidden');
    }
    
    hideModal() {
        this.txModal.classList.add('hidden');
    }
    
    async copyToClipboard(text, successMessage) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast(successMessage, 'success');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showToast('Failed to copy to clipboard', 'error');
        }
    }
}