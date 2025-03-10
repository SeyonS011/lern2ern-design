
// Simple script to generate an Ethereum wallet
const Web3 = require('web3');
const web3 = new Web3();

function generateWallet() {
  const account = web3.eth.accounts.create();
  console.log('New wallet generated:');
  console.log('Address:', account.address);
  console.log('Private Key:', account.privateKey);
  console.log('WARNING: Store this private key securely and never share it');
  
  return {
    address: account.address,
    privateKey: account.privateKey
  };
}

// Generate wallet
generateWallet();
