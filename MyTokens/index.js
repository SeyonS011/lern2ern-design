
// Replace with your actual contract ABI and address
const tokenAddress = "0x123abc..."; // Replace with your actual deployed contract address
const tokenABI = [
  // Replace with your contract's ABI from Remix (or wherever you deployed it)
  {
    "constant": true,
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [{"name": "recipient", "type": "address"}, {"name": "amount", "type": "uint256"}],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

let web3;
let account;
let contract;

// Wait for the page to load before adding event listeners
document.addEventListener('DOMContentLoaded', function() {
  // When the Connect Wallet button is clicked
  document.getElementById("connectButton").addEventListener("click", connectWallet);
  
  // When the Send Tokens button is clicked
  document.getElementById("sendButton").addEventListener("click", sendTokens);
});

// Function to connect to MetaMask wallet
async function connectWallet() {
  if (window.ethereum) {
    try {
      // Check if we're already connecting
      document.getElementById("connectButton").disabled = true;
      
      // Set up Web3 with MetaMask
      web3 = new Web3(window.ethereum);
      
      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      account = accounts[0];
      
      // Display the connected wallet address
      document.getElementById("walletAddress").innerText = "Connected: " + account;

      // Create the contract instance
      contract = new web3.eth.Contract(tokenABI, tokenAddress);

      // Get the token balance of the connected wallet
      getBalance(account);
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', function (accounts) {
        account = accounts[0];
        document.getElementById("walletAddress").innerText = "Connected: " + account;
        getBalance(account);
      });
      
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      alert("Error connecting to MetaMask: " + error.message);
    } finally {
      document.getElementById("connectButton").disabled = false;
    }
  } else {
    alert("Please install MetaMask!");
  }
}

// Function to get the balance of the token
async function getBalance(address) {
  try {
    const balance = await contract.methods.balanceOf(address).call();
    // Display the balance (converted from Wei to Ether)
    document.getElementById("tokenBalance").innerText = "Token Balance: " + web3.utils.fromWei(balance, "ether");
  } catch (error) {
    console.error("Error getting balance:", error);
    document.getElementById("tokenBalance").innerText = "Token Balance: Error";
  }
}

// Function to send tokens
async function sendTokens() {
  const toAddress = document.getElementById("sendAddress").value;
  const amount = document.getElementById("sendAmount").value;

  if (!web3 || !contract) {
    alert("Please connect your wallet first!");
    return;
  }

  if (toAddress && amount) {
    try {
      // Convert the amount to Wei
      const amountInWei = web3.utils.toWei(amount, "ether");

      // Send tokens from the connected wallet
      await contract.methods.transfer(toAddress, amountInWei).send({ from: account });
      alert("Tokens Sent!");
      getBalance(account);  // Update balance after the transfer
    } catch (error) {
      console.error("Error sending tokens:", error);
      alert("Error sending tokens: " + error.message);
    }
  } else {
    alert("Please enter a valid address and amount!");
  }
}
