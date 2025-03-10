
// This file is for the frontend web3 interaction
// Contract details
const contractAddress = 'YOUR_CONTRACT_ADDRESS'; // Will be replaced by deployment script
const contractABI = require('./contract-abi.json');

// Global variables
let web3;
let account;
let contract;
let userRole;

// Role names for display
const roleNames = ['Admin', 'Teacher', 'Student'];

// DOM elements
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners
    document.getElementById("connectButton").addEventListener("click", connectWallet);
    document.getElementById("assignRoleButton").addEventListener("click", assignRole);
    document.getElementById("fetchLogsButton").addEventListener("click", fetchLogs);
    document.getElementById("logActivityButton").addEventListener("click", logActivity);
});

// Connect to MetaMask
async function connectWallet() {
    try {
        if (window.ethereum) {
            web3 = new Web3(window.ethereum);
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            account = accounts[0];
            
            // Initialize contract
            contract = new web3.eth.Contract(contractABI, contractAddress);
            
            // Update UI
            document.getElementById("walletAddress").innerText = `Connected: ${account}`;
            
            // Get user's role
            getUserRole();
            
            // Setup event listeners for account changes
            window.ethereum.on('accountsChanged', function (accounts) {
                account = accounts[0];
                document.getElementById("walletAddress").innerText = `Connected: ${account}`;
                getUserRole();
            });
        } else {
            alert("Please install MetaMask or use a Web3-enabled browser!");
        }
    } catch (error) {
        console.error("Connection error:", error);
        alert("Failed to connect wallet: " + error.message);
    }
}

// Get user's role from contract
async function getUserRole() {
    try {
        if (!contract || !account) return;
        
        const role = await contract.methods.roles(account).call();
        userRole = parseInt(role);
        document.getElementById("userRole").innerText = `Role: ${roleNames[userRole]}`;
    } catch (error) {
        console.error("Error getting role:", error);
    }
}

// Assign a role to a user (Admin only)
async function assignRole() {
    try {
        if (!contract || !account) {
            alert("Please connect your wallet first");
            return;
        }
        
        const userAddress = document.getElementById("userAddress").value;
        const role = document.getElementById("roleSelect").value;
        
        if (!web3.utils.isAddress(userAddress)) {
            alert("Please enter a valid Ethereum address");
            return;
        }
        
        await contract.methods.assignRole(userAddress, role).send({ from: account });
        alert(`Role successfully assigned to ${userAddress}`);
    } catch (error) {
        console.error("Error assigning role:", error);
        alert("Failed to assign role: " + error.message);
    }
}

// Log an activity for a student (Teacher only)
async function logActivity() {
    try {
        if (!contract || !account) {
            alert("Please connect your wallet first");
            return;
        }
        
        const studentAddress = document.getElementById("studentLogAddress").value;
        const actionDescription = document.getElementById("actionDescription").value;
        
        if (!web3.utils.isAddress(studentAddress)) {
            alert("Please enter a valid student address");
            return;
        }
        
        if (!actionDescription) {
            alert("Please enter an activity description");
            return;
        }
        
        await contract.methods.logActivity(studentAddress, actionDescription).send({ from: account });
        alert("Activity logged successfully!");
    } catch (error) {
        console.error("Error logging activity:", error);
        alert("Failed to log activity: " + error.message);
    }
}

// Fetch activity logs for a student
async function fetchLogs() {
    try {
        if (!contract || !account) {
            alert("Please connect your wallet first");
            return;
        }
        
        const studentAddress = document.getElementById("studentAddress").value;
        
        if (!web3.utils.isAddress(studentAddress)) {
            alert("Please enter a valid student address");
            return;
        }
        
        const logs = await contract.methods.getActivityLogs(studentAddress).call();
        displayLogs(logs.actions, logs.timestamps);
    } catch (error) {
        console.error("Error fetching logs:", error);
        alert("Failed to fetch activity logs: " + error.message);
    }
}

// Display activity logs
function displayLogs(actions, timestamps) {
    const logContainer = document.getElementById("activityLogs");
    logContainer.innerHTML = '';
    
    if (actions.length === 0) {
        logContainer.innerHTML = '<p>No activity logs found for this student.</p>';
        return;
    }
    
    for (let i = 0; i < actions.length; i++) {
        const date = new Date(timestamps[i] * 1000).toLocaleString();
        logContainer.innerHTML += `
            <div style="border-bottom: 1px solid #ddd; padding: 10px 0;">
                <p><strong>Action:</strong> ${actions[i]}</p>
                <p><strong>Time:</strong> ${date}</p>
            </div>
        `;
    }
}
