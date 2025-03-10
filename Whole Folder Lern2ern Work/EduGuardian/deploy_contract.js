
require('dotenv').config();
const fs = require('fs');
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const solc = require('solc');

// Load environment variables
const privateKey = process.env.PRIVATE_KEY;
const infuraId = process.env.INFURA_PROJECT_ID;

// Check for environment variables
if (!privateKey || !infuraId) {
  console.error('Please set PRIVATE_KEY and INFURA_PROJECT_ID in .env file');
  process.exit(1);
}

// Compile the contract
function compileContract() {
  const contractSource = fs.readFileSync('./EduTrack.sol', 'utf8');
  
  // Prepare input for solc compiler
  const input = {
    language: 'Solidity',
    sources: {
      'EduTrack.sol': {
        content: contractSource
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['*']
        }
      }
    }
  };

  // Compile the contract
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  
  if (output.errors) {
    console.error('Compilation Error:', output.errors);
    process.exit(1);
  }

  // Get the compiled contract
  const contractOutput = output.contracts['EduTrack.sol']['EduTrack'];
  
  return {
    abi: contractOutput.abi,
    bytecode: contractOutput.evm.bytecode.object
  };
}

// Deploy the contract
async function deployContract() {
  // Choose network: sepolia, goerli, etc.
  const network = 'sepolia';
  
  // Provider setup
  const provider = new HDWalletProvider({
    privateKeys: [privateKey],
    providerOrUrl: `https://${network}.infura.io/v3/${infuraId}`
  });
  
  const web3 = new Web3(provider);
  const accounts = await web3.eth.getAccounts();
  console.log('Deploying from account:', accounts[0]);
  
  // Compile the contract
  const contract = compileContract();
  console.log('Contract compiled successfully');
  
  // Save ABI to file for later use
  fs.writeFileSync('contract-abi.json', JSON.stringify(contract.abi, null, 2));
  console.log('Contract ABI saved to contract-abi.json');
  
  // Deploy contract
  console.log('Deploying contract...');
  const deployContract = new web3.eth.Contract(contract.abi);
  
  // Estimate gas
  const gas = await deployContract.deploy({
    data: '0x' + contract.bytecode
  }).estimateGas({ from: accounts[0] });
  
  // Deploy with estimated gas
  const deployed = await deployContract.deploy({
    data: '0x' + contract.bytecode
  }).send({
    from: accounts[0],
    gas
  });
  
  console.log('Contract deployed at address:', deployed.options.address);
  
  // Save contract address
  fs.writeFileSync('contract-address.txt', deployed.options.address);
  console.log('Contract address saved to contract-address.txt');
  
  // Update frontend with new contract address
  let indexJs = fs.readFileSync('./index.js', 'utf8');
  indexJs = indexJs.replace(
    /const contractAddress = '.*?'/,
    `const contractAddress = '${deployed.options.address}'`
  );
  fs.writeFileSync('./index.js', indexJs);
  console.log('Updated index.js with new contract address');
  
  // Clean up
  provider.engine.stop();
}

// Run deployment
deployContract().catch(console.error);
