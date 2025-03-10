// DOM Elements
const connectButton = document.getElementById('connectButton');
const walletStatus = document.getElementById('walletStatus');
const walletAddress = document.getElementById('walletAddress');
const contractAddressInput = document.getElementById('contractAddress');
const fetchTransactionsButton = document.getElementById('fetchTransactionsButton');
const transactionsDiv = document.getElementById('transactions');
const transactionsLoading = document.getElementById('transactionsLoading');

// Variables
let web3;
let account;

// Event Listeners
connectButton.addEventListener('click', connectWallet);
fetchTransactionsButton.addEventListener('click', fetchTransactions);

// Connect to MetaMask wallet
async function connectWallet() {
  if (window.ethereum) {
    try {
      walletStatus.innerHTML = 'Connecting...';

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      account = accounts[0];

      // Create Web3 instance
      web3 = new Web3(window.ethereum);

      // Update UI
      walletStatus.innerHTML = 'Connected';
      walletStatus.classList.add('text-success');
      walletAddress.innerHTML = shortenAddress(account);
      connectButton.innerHTML = 'Wallet Connected';
      connectButton.classList.replace('btn-primary', 'btn-success');

      // Setup listeners for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      // Pre-fill the contract address field with a sample contract if empty
      if (!contractAddressInput.value.trim()) {
        // Example: Sepolia test contract - replace with a real one if you have it
        contractAddressInput.value = "0x779877A7B0D9E8603169DdbD7836e478b4624789"; // Chainlink Token on Sepolia
      }

    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      walletStatus.innerHTML = 'Connection Failed';
      walletStatus.classList.add('text-danger');
    }
  } else {
    walletStatus.innerHTML = 'MetaMask Not Detected';
    walletStatus.classList.add('text-danger');
    alert('Please install MetaMask to use this feature!');
  }
}

// Handle account changes
function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    // User disconnected their wallet
    walletStatus.innerHTML = 'Disconnected';
    walletStatus.classList.remove('text-success');
    walletStatus.classList.add('text-danger');
    walletAddress.innerHTML = '';
    connectButton.innerHTML = 'Connect Wallet';
    connectButton.classList.replace('btn-success', 'btn-primary');
  } else {
    // Account changed
    account = accounts[0];
    walletAddress.innerHTML = shortenAddress(account);
  }
}

// Fetch transactions
async function fetchTransactions() {
  const contractAddress = contractAddressInput.value.trim();

  if (!contractAddress) {
    alert('Please enter a contract address');
    return;
  }

  if (!web3) {
    try {
      web3 = new Web3('https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
    } catch (error) {
      console.error('Error initializing Web3:', error);
      transactionsDiv.innerHTML = `<div class="alert alert-danger">Error initializing Web3: ${error.message}</div>`;
      return;
    }
  }

  // Show loading spinner
  transactionsLoading.classList.remove('d-none');
  transactionsDiv.innerHTML = '';

  try {
    console.log('Fetching transactions for contract:', contractAddress);
    // Use the absolute URL with protocol to ensure it works in all environments
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/transactions/${contractAddress}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with status: ${response.status}. ${errorText}`);
    }

    const data = await response.json();
    console.log('Transaction data received:', data);

    if (data.success) {
      displayTransactions(data.transactions);
    } else {
      throw new Error(data.error || 'Failed to fetch transactions');
    }
  } catch (error) {
    console.error('Error:', error);
    transactionsDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  } finally {
    // Hide loading spinner
    transactionsLoading.classList.add('d-none');
  }
}

// Display transactions
function displayTransactions(transactions) {
  if (!transactions || transactions.length === 0) {
    transactionsDiv.innerHTML = '<div class="alert alert-info">No transactions found for this contract.</div>';
    return;
  }

  let html = '';

  transactions.forEach(tx => {
    html += `
      <div class="transaction-item">
        <div class="transaction-header">
          <span class="transaction-type type-${tx.type}">${capitalizeFirstLetter(tx.type)}</span>
          <a href="https://sepolia.etherscan.io/tx/${tx.transactionHash}" target="_blank" class="btn btn-sm btn-outline-secondary">View on Etherscan</a>
        </div>
        <div class="row mb-2">
          <div class="col-md-3 fw-bold">From:</div>
          <div class="col-md-9 address">${tx.from}</div>
        </div>
        <div class="row mb-2">
          <div class="col-md-3 fw-bold">To:</div>
          <div class="col-md-9 address">${tx.to}</div>
        </div>
        <div class="row mb-2">
          <div class="col-md-3 fw-bold">Amount:</div>
          <div class="col-md-9 amount">${tx.amount} ETH</div>
        </div>
        <div class="row">
          <div class="col-md-3 fw-bold">Time:</div>
          <div class="col-md-9 timestamp">${formatDate(tx.timestamp)}</div>
        </div>
      </div>
    `;
  });

  transactionsDiv.innerHTML = html;
}

// Helper Functions
function shortenAddress(address) {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Initialize if MetaMask is already connected
window.addEventListener('DOMContentLoaded', async () => {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        // User is already connected, update UI
        account = accounts[0];
        web3 = new Web3(window.ethereum);

        walletStatus.innerHTML = 'Connected';
        walletStatus.classList.add('text-success');
        walletAddress.innerHTML = shortenAddress(account);
        connectButton.innerHTML = 'Wallet Connected';
        connectButton.classList.replace('btn-primary', 'btn-success');

        window.ethereum.on('accountsChanged', handleAccountsChanged);
      }
    } catch (error) {
      console.error('Error checking existing connection:', error);
    }
  }
});