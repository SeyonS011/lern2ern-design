
// This script will run in the browser

// Global variables
let web3;
let accounts = [];
let transactions = [];
let isOwner = false;
let contract;

// Configuration
const ownerAddress = '0x123456789abcdef123456789abcdef123456789a'; // Replace with actual owner address
const tokenAddress = 'YOUR_CONTRACT_ADDRESS'; // Replace with your token contract address
const tokenABI = [ /* Your token contract ABI here */ ];

// Initialize the application
async function init() {
  console.log('Initializing app...');
  
  // Check if MetaMask is installed
  if (typeof window.ethereum !== 'undefined') {
    console.log('MetaMask is installed!');
    web3 = new Web3(window.ethereum);
  } else {
    updateWalletMessage('Please install MetaMask to use this application!');
    return;
  }
  
  // Set up connect button
  const connectButton = document.getElementById('connectButton');
  if (connectButton) {
    connectButton.addEventListener('click', connectWallet);
  }
  
  // Add some example transactions for demo purposes
  const exampleTransactions = [
    {
      type: 'Transfer',
      from: '0x1234567890123456789012345678901234567890',
      to: '0x0987654321098765432109876543210987654321',
      amount: '100',
      timestamp: new Date().toISOString(),
      hash: '0x0000000000000000000000000000000000000000000000000000000000000000'
    },
    {
      type: 'Transfer',
      from: '0x2345678901234567890123456789012345678901',
      to: '0x0987654321098765432109876543210987654321',
      amount: '50',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      hash: '0x1111111111111111111111111111111111111111111111111111111111111111'
    },
    {
      type: 'Transfer',
      from: '0x7777777777777777777777777777777777777777',
      to: '0x8888888888888888888888888888888888888888',
      amount: '25',
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      hash: '0x2222222222222222222222222222222222222222222222222222222222222222'
    },
    {
      type: 'Transfer',
      from: '0x8888888888888888888888888888888888888888',
      to: '0x9999999999999999999999999999999999999999',
      amount: '75',
      timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      hash: '0x3333333333333333333333333333333333333333333333333333333333333333'
    }
  ];
  
  transactions.push(...exampleTransactions);
  
  // Add to UI
  updateTransactionsList();
}

// Listen to contract events (Transfer, Mint, Burn)
function listenToEvents() {
  if (!contract) return;
  
  // Listening to Transfer events
  contract.events.Transfer({
    fromBlock: 'latest', // Start listening from the latest block
  })
  .on('data', (event) => {
    console.log('Transfer Event:', event);
    const newTx = {
      type: 'Transfer',
      from: event.returnValues.from,
      to: event.returnValues.to,
      amount: web3.utils.fromWei(event.returnValues.value, 'ether'),
      timestamp: new Date().toISOString(),
      hash: event.transactionHash
    };
    
    transactions.push(newTx);
    updateTransactionsList();
  })
  .on('error', console.error);
  
  // Add similar listeners for Mint and Burn events if your contract has them
}

// Filter transactions by address
function filterTransactionsByAddress(address) {
  if (!address) {
    updateTransactionsList(); // Show all transactions if no address
    return;
  }
  
  const filteredTxs = transactions.filter(tx => 
    tx.from.toLowerCase() === address.toLowerCase() || 
    tx.to.toLowerCase() === address.toLowerCase()
  );
  
  updateTransactionsList(filteredTxs);
}

// Update transactions list in UI
function updateTransactionsList(txList = transactions) {
  const transactionsList = document.getElementById('transactionsList');
  if (!transactionsList) return;
  
  // Clear current list
  transactionsList.innerHTML = '';
  
  // Add transactions to list
  txList.forEach(tx => addTransactionToUI(tx));
  
  // Update stats
  const statsElement = document.getElementById('transactionStats');
  if (statsElement) {
    statsElement.innerText = `Showing ${txList.length} transaction${txList.length !== 1 ? 's' : ''}`;
  }
}

// Helper function to shorten addresses for display
function shortenAddress(address) {
  if (!address) return '';
  return address.substring(0, 6) + '...' + address.substring(address.length - 4);
}

// Search for transactions by address
function searchTransactions() {
  const searchInput = document.getElementById('addressSearch');
  if (!searchInput) return;
  
  const searchValue = searchInput.value.trim();
  filterTransactionsByAddress(searchValue);
}

// Reset search and show all transactions
function resetSearch() {
  const searchInput = document.getElementById('addressSearch');
  if (searchInput) {
    searchInput.value = '';
  }
  updateTransactionsList();
}

// Connect to MetaMask wallet
async function connectWallet() {
  try {
    // Request account access
    accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const connectedAddress = accounts[0];
    
    document.getElementById('walletAddress').innerText = `Connected: ${shortenAddress(connectedAddress)}`;
    document.getElementById('connectButton').innerText = 'Wallet Connected';
    
    // Initialize contract if token address and ABI are set
    if (tokenAddress !== 'YOUR_CONTRACT_ADDRESS' && tokenABI.length > 0) {
      contract = new web3.eth.Contract(tokenABI, tokenAddress);
      listenToEvents();
    }
    
    // Check if connected user is owner
    isOwner = connectedAddress.toLowerCase() === ownerAddress.toLowerCase();
    
    // Show appropriate panel
    if (isOwner) {
      document.getElementById('ownerPanel').style.display = 'block';
      document.getElementById('normalUserPanel').style.display = 'none';
    } else {
      document.getElementById('ownerPanel').style.display = 'none';
      document.getElementById('normalUserPanel').style.display = 'block';
      
      // Filter transactions to show only those related to the connected address
      filterTransactionsByAddress(connectedAddress);
    }
    
    updateWalletMessage('');
  } catch (error) {
    console.error(error);
    updateWalletMessage('Error connecting wallet: ' + error.message);
  }
}

// Update wallet message
function updateWalletMessage(message) {
  const walletMessage = document.getElementById('walletMessage');
  if (walletMessage) {
    walletMessage.innerText = message;
  }
}

// Add a transaction to the UI
function addTransactionToUI(transaction) {
  const transactionsList = document.getElementById('transactionsList');
  if (!transactionsList) return;
  
  const li = document.createElement('li');
  li.className = 'transaction-item';
  
  const date = new Date(transaction.timestamp);
  const formattedDate = date.toLocaleString();
  
  li.innerHTML = `
    <div>
      <strong>${transaction.type}</strong> - ${transaction.amount} tokens
    </div>
    <div>
      From: ${shortenAddress(transaction.from)}
      To: ${shortenAddress(transaction.to)}
    </div>
    <div>
      <small>${formattedDate}</small>
      <a href="https://etherscan.io/tx/${transaction.hash}" class="tx-link" target="_blank">View on Etherscan</a>
    </div>
  `;
  
  transactionsList.appendChild(li);
}

// Run initialization when the page loads
document.addEventListener('DOMContentLoaded', init);

// Add event listeners for search functionality
document.addEventListener('DOMContentLoaded', function() {
  const searchButton = document.getElementById('searchButton');
  const resetButton = document.getElementById('resetButton');
  
  if (searchButton) {
    searchButton.addEventListener('click', searchTransactions);
  }
  
  if (resetButton) {
    resetButton.addEventListener('click', resetSearch);
  }
});
