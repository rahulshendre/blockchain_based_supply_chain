# Manual Contract Deployment Guide

Since we're having Hardhat compatibility issues, here's how to deploy manually:

## Option 1: Use Remix IDE (Recommended)

1. Go to https://remix.ethereum.org/
2. Create a new file called `SupplyChain.sol`
3. Copy the contract code from `contracts/SupplyChain.sol`
4. Compile the contract (Solidity 0.8.19)
5. Deploy to Ganache:
   - Environment: "Injected Web3" or "Web3 Provider"
   - RPC URL: `http://127.0.0.1:7545`
   - Chain ID: 1337
6. Copy the deployed contract address
7. Update `src/utils/blockchain.js` with the contract address

## Option 2: Use Truffle

```bash
npm install -g truffle
truffle init
# Copy contract to contracts/
# Update truffle-config.js
truffle migrate --network ganache
```

## Option 3: Manual Deployment with Web3

Create a simple deployment script using web3.js or ethers.js directly.

## Contract Address Update

Once deployed, update `src/utils/blockchain.js`:

```javascript
export const SUPPLY_CHAIN_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE";
```

## Testing the Deployment

After deployment, you can test by:

1. Starting the React Native app: `npx expo start`
2. Creating a batch as a Farmer
3. Scanning the QR code as other roles
4. Checking the blockchain for updates

The contract should be deployed at an address like: `0x1234...5678`
