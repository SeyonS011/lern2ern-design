
const express = require('express');
const { Web3 } = require('web3');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(express.static('public'));

// Create a Web3 instance with provider options for v4.x
let web3;
if (process.env.INFURA_URL) {
  web3 = new Web3(process.env.INFURA_URL);
} else {
  web3 = new Web3('https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
}

// Sample contract ABI - you'll need to replace this with your actual ABI
const contractABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "from", "type": "address" },
      { "indexed": true, "name": "to", "type": "address" },
      { "indexed": false, "name": "amount", "type": "uint256" },
      { "indexed": false, "name": "timestamp", "type": "uint" }
    ],
    "name": "TransferMade",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "to", "type": "address" },
      { "indexed": false, "name": "amount", "type": "uint256" },
      { "indexed": false, "name": "timestamp", "type": "uint" }
    ],
    "name": "MintMade",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "from", "type": "address" },
      { "indexed": false, "name": "amount", "type": "uint256" },
      { "indexed": false, "name": "timestamp", "type": "uint" }
    ],
    "name": "BurnMade",
    "type": "event"
  }
];

// API endpoint to fetch transactions
app.get('/api/transactions/:contractAddress', async (req, res) => {
  try {
    const { contractAddress } = req.params;
    console.log(`Fetching transactions for contract: ${contractAddress}`);
    
    // Validate contract address format
    if (!web3.utils.isAddress(contractAddress)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid contract address format' 
      });
    }
    
    const contract = new web3.eth.Contract(contractABI, contractAddress);
    
    try {
      // Fetch all event types with proper error handling
      const transferEvents = await contract.getPastEvents('TransferMade', { fromBlock: 0, toBlock: 'latest' }).catch(err => {
        console.log('Error fetching TransferMade events:', err.message);
        return [];
      });
      
      const mintEvents = await contract.getPastEvents('MintMade', { fromBlock: 0, toBlock: 'latest' }).catch(err => {
        console.log('Error fetching MintMade events:', err.message);
        return [];
      });
      
      const burnEvents = await contract.getPastEvents('BurnMade', { fromBlock: 0, toBlock: 'latest' }).catch(err => {
        console.log('Error fetching BurnMade events:', err.message);
        return [];
      });
      
      console.log(`Found ${transferEvents.length} transfers, ${mintEvents.length} mints, ${burnEvents.length} burns`);
      
      // Transform the events data with safe type conversions
      const transferTransactions = transferEvents.map(event => {
        try {
          return {
            type: 'transfer',
            from: event.returnValues.from,
            to: event.returnValues.to,
            amount: web3.utils.fromWei(event.returnValues.amount.toString(), 'ether'),
            timestamp: new Date(parseInt(event.returnValues.timestamp) * 1000).toISOString(),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber
          };
        } catch (err) {
          console.error('Error processing transfer event:', err);
          return null;
        }
      }).filter(tx => tx !== null);
      
      const mintTransactions = mintEvents.map(event => {
        try {
          return {
            type: 'mint',
            from: '0x0000000000000000000000000000000000000000',
            to: event.returnValues.to,
            amount: web3.utils.fromWei(event.returnValues.amount.toString(), 'ether'),
            timestamp: new Date(parseInt(event.returnValues.timestamp) * 1000).toISOString(),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber
          };
        } catch (err) {
          console.error('Error processing mint event:', err);
          return null;
        }
      }).filter(tx => tx !== null);
      
      const burnTransactions = burnEvents.map(event => {
        try {
          return {
            type: 'burn',
            from: event.returnValues.from,
            to: '0x0000000000000000000000000000000000000000',
            amount: web3.utils.fromWei(event.returnValues.amount.toString(), 'ether'),
            timestamp: new Date(parseInt(event.returnValues.timestamp) * 1000).toISOString(),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber
          };
        } catch (err) {
          console.error('Error processing burn event:', err);
          return null;
        }
      }).filter(tx => tx !== null);
      
      // Combine all transactions and sort by timestamp (newest first)
      const transactions = [...transferTransactions, ...mintTransactions, ...burnTransactions]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      res.json({ success: true, transactions });
    } catch (error) {
      console.error('Contract interaction error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to interact with the contract. Please check if the contract implements the expected events.'
      });
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error'
    });
  }
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server - bind to 0.0.0.0 to make it publicly accessible
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access your dashboard at: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
});
