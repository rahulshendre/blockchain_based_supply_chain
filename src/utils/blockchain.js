import { ethers } from "ethers";
import Constants from "expo-constants";

// Detect Mac host IP at runtime (Expo dev only) and build Ganache RPC URL
// Strategy:
// 1) Use Expo dev host (Constants.expoConfig.hostUri or manifest.debuggerHost) → "<mac-ip>:<port>"
// 2) On web, fallback to window.location.hostname
// 3) Final fallback: 127.0.0.1
function resolveGanacheHost() {
  try {
    // Newer Expo SDKs expose host via expoConfig.hostUri
    const hostUri = (Constants?.expoConfig?.hostUri || "").toString();
    if (hostUri.includes(":")) {
      const host = hostUri.split(":")[0];
      if (host && /^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return host;
    }

    // Older Expo SDKs expose debuggerHost (e.g., "192.168.1.10:19000")
    // @ts-ignore - manifest is legacy in newer SDKs
    const dbg = (Constants?.manifest?.debuggerHost || "").toString();
    if (dbg.includes(":")) {
      const host = dbg.split(":")[0];
      if (host && /^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return host;
    }

    // Web fallback: use browser hostname
    if (typeof window !== "undefined" && window?.location?.hostname) {
      const host = window.location.hostname;
      if (host && /^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return host;
    }
  } catch (_) {
    // ignore and fall through
  }
  return "127.0.0.1";
}

const RPC_URL = `http://${resolveGanacheHost()}:7545`;

// Provider instance for all blockchain interactions
export const provider = new ethers.JsonRpcProvider(RPC_URL);

// Farmer wallet - Creates and manages product batches
export const farmerWallet = new ethers.Wallet(
  "0x335f7c47267679961e1ccae8e2e680a59bb2782e620f28e2d163794326bbeb51",
  provider
);

// Distributor wallet - Receives and processes batches from farmers
export const distributorWallet = new ethers.Wallet(
  "0x763c140484a2db0358691a6d82b1ef18a250760e7dc7ecb67dcd4d0a986b8020",
  provider
);

// Retailer wallet - Manages inventory and sells to consumers
export const retailerWallet = new ethers.Wallet(
  "0x23f26a4bcca5adf7a341f39194f03a134f9bf4708db259eaca40b9f9490fc477",
  provider
);

// Consumer wallet - Views product information and supply chain journey
export const consumerWallet = new ethers.Wallet(
  "0x91e5a64cd2bade9ea837ca817252cbd3fda85f8ab8c08399aae478865d608b3a",
  provider
);

// Smart Contract ABI - Complete interface for SupplyChain contract
export const SUPPLY_CHAIN_ABI = [
  // Events
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "string", "name": "batchId", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "product", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "quantity", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "farmer", "type": "address" }
    ],
    "name": "BatchCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "string", "name": "batchId", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "status", "type": "string" },
      { "indexed": false, "internalType": "address", "name": "updatedBy", "type": "address" }
    ],
    "name": "BatchUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "string", "name": "batchId", "type": "string" },
      { "indexed": false, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": false, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "role", "type": "string" }
    ],
    "name": "BatchTransferred",
    "type": "event"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_batchId", "type": "string"},
      {"internalType": "string", "name": "_product", "type": "string"},
      {"internalType": "uint256", "name": "_quantity", "type": "uint256"}
    ],
    "name": "createBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_batchId", "type": "string"},
      {"internalType": "string", "name": "_status", "type": "string"}
    ],
    "name": "updateBatchStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_batchId", "type": "string"},
      {"internalType": "address", "name": "_distributor", "type": "address"}
    ],
    "name": "transferToDistributor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_batchId", "type": "string"},
      {"internalType": "address", "name": "_retailer", "type": "address"}
    ],
    "name": "transferToRetailer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_batchId", "type": "string"},
      {"internalType": "address", "name": "_consumer", "type": "address"}
    ],
    "name": "transferToConsumer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_batchId", "type": "string"}
    ],
    "name": "getBatchInfo",
    "outputs": [
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "uint256", "name": "", "type": "uint256"},
      {"internalType": "address", "name": "", "type": "address"},
      {"internalType": "address", "name": "", "type": "address"},
      {"internalType": "address", "name": "", "type": "address"},
      {"internalType": "address", "name": "", "type": "address"},
      {"internalType": "uint256", "name": "", "type": "uint256"},
      {"internalType": "uint256", "name": "", "type": "uint256"},
      {"internalType": "string", "name": "", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_batchId", "type": "string"}
    ],
    "name": "batchExists",
    "outputs": [
      {"internalType": "bool", "name": "", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract address - UPDATE THIS AFTER DEPLOYMENT
// Run: node deploy-contract.js to get the real address
export const SUPPLY_CHAIN_ADDRESS = "0x20719C6Ad614b74a76adDB8A16B8c514dABcC98b"; // Deployed on Ganache

// Helper function to get contract instance with proper error handling
export const getSupplyChainContract = (wallet) => {
  try {
    if (!SUPPLY_CHAIN_ADDRESS || SUPPLY_CHAIN_ADDRESS === "0x1234567890123456789012345678901234567890") {
      throw new Error("Contract not deployed. Please run deployment script first.");
    }
    return new ethers.Contract(SUPPLY_CHAIN_ADDRESS, SUPPLY_CHAIN_ABI, wallet);
  } catch (error) {
    console.error("Error creating contract instance:", error);
    throw error;
  }
};

// Network connection test function
export const testNetworkConnection = async () => {
  try {
    const blockNumber = await provider.getBlockNumber();
    console.log("✅ Network connection successful. Block number:", blockNumber);
    return true;
  } catch (error) {
    console.error("❌ Network connection failed:", error.message);
    return false;
  }
};

// Wallet balance check function
export const getWalletBalance = async (wallet) => {
  try {
    const balance = await provider.getBalance(wallet.address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("Error getting wallet balance:", error);
    return "0";
  }
};

// Transaction helper with proper error handling
export const executeTransaction = async (contractFunction, errorMessage = "Transaction failed") => {
  try {
    console.log("🔄 Executing transaction...");
    const tx = await contractFunction();
    console.log("⏳ Transaction submitted:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed:", receipt.hash);
    
    return {
      success: true,
      hash: receipt.hash,
      receipt: receipt
    };
  } catch (error) {
    console.error("❌ Transaction failed:", error);
    
    // Parse common error messages
    let userMessage = errorMessage;
    if (error.message.includes("insufficient funds")) {
      userMessage = "Insufficient funds for transaction";
    } else if (error.message.includes("user rejected")) {
      userMessage = "Transaction was cancelled";
    } else if (error.message.includes("network")) {
      userMessage = "Network connection error";
    }
    
    return {
      success: false,
      error: userMessage,
      details: error.message
    };
  }
};
