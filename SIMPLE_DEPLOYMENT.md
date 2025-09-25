# 🚀 Simple Contract Deployment Guide

## Option 1: Remix IDE (Recommended)

1. **Go to Remix IDE**: https://remix.ethereum.org/
2. **Create new file**: `SupplyChain.sol`
3. **Copy the contract code** from `contracts/SupplyChain.sol`
4. **Compile**: Select Solidity 0.8.19 and compile
5. **Deploy to Ganache**:
   - Environment: "Injected Web3" or "Web3 Provider"
   - RPC URL: `http://127.0.0.1:7545`
   - Chain ID: 1337
6. **Copy the deployed contract address**
7. **Update** `src/utils/blockchain.js` with the contract address

## Option 2: Manual Deployment Script

Create a simple deployment script:

```javascript
// deploy-simple.js
const { ethers } = require('ethers');

async function deploy() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
  const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);
  
  // Contract bytecode and ABI would go here
  // This is a simplified example
  
  console.log('Deploying contract...');
  // Deploy logic here
  console.log('Contract deployed at:', 'CONTRACT_ADDRESS');
}

deploy().catch(console.error);
```

## Option 3: Use Truffle

```bash
npm install -g truffle
truffle init
# Copy contract to contracts/
# Update truffle-config.js
truffle migrate --network ganache
```

## After Deployment

1. **Copy the contract address**
2. **Update** `src/utils/blockchain.js`:
   ```javascript
   export const SUPPLY_CHAIN_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE";
   ```
3. **Test the app** with real blockchain calls

## Testing

Once deployed, you can test by:
1. Creating a batch as a Farmer
2. Scanning the batch ID as other roles
3. Checking the blockchain for updates
