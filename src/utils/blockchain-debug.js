import { ethers } from "ethers";

// Debug version of blockchain utility
const RPC_URL = "http://127.0.0.1:7545";

console.log('🔍 Initializing blockchain connection...');
console.log('RPC URL:', RPC_URL);

export const provider = new ethers.JsonRpcProvider(RPC_URL);

// Test connection immediately
provider.getBlockNumber().then(blockNumber => {
  console.log('✅ Ganache connection successful! Block number:', blockNumber);
}).catch(error => {
  console.error('❌ Ganache connection failed:', error);
});

// Assign wallets to roles with provided private keys
export const farmerWallet = new ethers.Wallet(
  "0x335f7c47267679961e1ccae8e2e680a59bb2782e620f28e2d163794326bbeb51",
  provider
);

export const distributorWallet = new ethers.Wallet(
  "0x763c140484a2db0358691a6d82b1ef18a250760e7dc7ecb67dcd4d0a986b8020",
  provider
);

export const retailerWallet = new ethers.Wallet(
  "0x23f26a4bcca5adf7a341f39194f03a134f9bf4708db259eaca40b9f9490fc477",
  provider
);

export const consumerWallet = new ethers.Wallet(
  "0x91e5a64cd2bade9ea837ca817252cbd3fda85f8ab8c08399aae478865d608b3a",
  provider
);

console.log('✅ All wallets created successfully!');
console.log('Farmer address:', farmerWallet.address);
console.log('Distributor address:', distributorWallet.address);
console.log('Retailer address:', retailerWallet.address);
console.log('Consumer address:', consumerWallet.address);

// Smart contract ABI and address (will be updated after deployment)
export const SUPPLY_CHAIN_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_batchId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_product",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_quantity",
        "type": "uint256"
      }
    ],
    "name": "createBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_batchId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_status",
        "type": "string"
      }
    ],
    "name": "updateBatchStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_batchId",
        "type": "string"
      }
    ],
    "name": "getBatchInfo",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export const SUPPLY_CHAIN_ADDRESS = "0x1234567890123456789012345678901234567890"; // Mock address - replace with actual deployed address

// Helper function to get contract instance
export const getSupplyChainContract = (wallet) => {
  console.log('🔗 Creating contract instance for wallet:', wallet.address);
  return new ethers.Contract(SUPPLY_CHAIN_ADDRESS, SUPPLY_CHAIN_ABI, wallet);
};

// Test function to verify everything is working
export const testBlockchainConnection = async () => {
  try {
    console.log('🧪 Testing blockchain connection...');
    
    const blockNumber = await provider.getBlockNumber();
    console.log('✅ Block number:', blockNumber);
    
    const farmerBalance = await provider.getBalance(farmerWallet.address);
    console.log('✅ Farmer balance:', ethers.formatEther(farmerBalance), 'ETH');
    
    console.log('🎉 Blockchain connection test successful!');
    return true;
  } catch (error) {
    console.error('❌ Blockchain connection test failed:', error);
    return false;
  }
};
