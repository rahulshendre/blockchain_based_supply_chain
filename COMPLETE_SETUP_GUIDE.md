# 🚀 Complete Supply Chain MVP Setup Guide

## 📋 Prerequisites

1. **Ganache** running on your Mac
2. **Node.js** (v16 or higher)
3. **Expo CLI** installed globally
4. **Physical devices** connected to the same Wi-Fi network (optional)

## 🔧 Step 1: Configure Ganache

1. **Start Ganache** and create a new workspace
2. **Configure Network Settings**:
   - RPC URL: `http://10.251.27.171:7545`
   - Chain ID: 1337
   - **Important**: Make sure Ganache is listening on `0.0.0.0:7545` (not just localhost)
3. **Note down the private keys** for the 4 accounts (already configured in the app)

## 🚀 Step 2: Deploy Smart Contract

### Option A: Using the Deployment Script (Recommended)

```bash
cd supply_chain_mvp
node deploy-contract.js
```

**Expected Output:**
```
🚀 Starting Supply Chain contract deployment...
📡 Connected to Ganache at: http://10.251.27.171:7545
👤 Deployer address: 0x716F61b358E6A9894DfaeCFE0305e28c8D4414CA
💰 Deployer balance: 100.0 ETH
⚙️  Compiling contract...
📦 Deploying contract...
⏳ Waiting for deployment confirmation...
✅ Contract deployed successfully!
📍 Contract Address: 0x[YOUR_CONTRACT_ADDRESS]
🔗 Transaction Hash: 0x[TRANSACTION_HASH]
🧪 Testing contract...
✅ Test batch created successfully!

🎉 Deployment completed successfully!
```

### Option B: Using Remix IDE

1. Go to https://remix.ethereum.org/
2. Create new file: `SupplyChain.sol`
3. Copy the contract code from `contracts/SupplyChain.sol`
4. Compile with Solidity 0.8.19
5. Deploy to Web3 Provider: `http://10.251.27.171:7545`

## 🔗 Step 3: Update Contract Address

After deployment, update `src/utils/blockchain.js`:

```javascript
// Replace this line:
export const SUPPLY_CHAIN_ADDRESS = "0x1234567890123456789012345678901234567890";

// With your deployed contract address:
export const SUPPLY_CHAIN_ADDRESS = "0x[YOUR_DEPLOYED_CONTRACT_ADDRESS]";
```

## 📱 Step 4: Start the React Native App

```bash
cd supply_chain_mvp
npm install
npx expo start
```

## 🧪 Step 5: Test the Complete Flow

### 1. **Farmer Creates Batch**
- Open the **Farmer** tab
- Check network status (should show "✅ Connected")
- Enter product name: "Organic Tomatoes"
- Enter quantity: "100"
- Tap "Create Batch"
- ✅ QR code generated with batch ID
- ✅ Transaction hash displayed

### 2. **Distributor Processes Batch**
- Switch to **Distributor** tab
- Enter the batch ID manually (from Farmer tab)
- Enter quantity received: "100"
- Tap "Update Batch"
- ✅ Status updated on blockchain
- ✅ Transaction hash displayed

### 3. **Retailer Stocks Batch**
- Switch to **Retailer** tab
- Enter the same batch ID
- Enter quantity stocked: "100"
- Tap "Update Batch"
- ✅ Inventory updated on blockchain

### 4. **Consumer Verifies Product**
- Switch to **Consumer** tab
- Enter the same batch ID
- ✅ See complete supply chain journey
- ✅ View all timestamps and statuses
- ✅ Verify product authenticity

## 🔍 Step 6: Verify Blockchain Transactions

1. **Check Ganache** for transaction history
2. **Verify contract state** in Ganache
3. **Check wallet balances** (should decrease slightly due to gas fees)

## 🛠️ Troubleshooting

### Common Issues:

1. **"Contract not deployed" Error**
   - Make sure you've updated the contract address in `blockchain.js`
   - Verify the contract was deployed successfully

2. **"Network connection failed"**
   - Check if Ganache is running
   - Verify RPC URL: `http://10.251.27.171:7545`
   - Ensure Ganache is listening on `0.0.0.0:7545`

3. **"Insufficient funds" Error**
   - Check wallet balances in Ganache
   - Each wallet should have 100 ETH

4. **"Transaction failed"**
   - Check console logs for detailed error messages
   - Verify the batch ID exists
   - Check if you have the right permissions for the transaction

### Network Configuration:

If you need to change the IP address:

1. **Find your Mac's IP**: `ifconfig | grep "inet " | grep -v 127.0.0.1`
2. **Update** `src/utils/blockchain.js`:
   ```javascript
   const RPC_URL = "http://YOUR_IP:7545";
   ```
3. **Update Ganache** to listen on `0.0.0.0:7545`

## 📊 Expected Results

### Successful Flow:
- ✅ All 4 roles can interact with the blockchain
- ✅ Transactions are recorded on Ganache
- ✅ QR codes are generated and can be scanned
- ✅ Supply chain journey is tracked
- ✅ Real-time status updates

### Transaction Examples:
- **Farmer**: Creates batch → Transaction hash displayed
- **Distributor**: Updates status → Transaction hash displayed
- **Retailer**: Updates inventory → Transaction hash displayed
- **Consumer**: Views journey → Real-time data from blockchain

## 🎯 Next Steps

1. **Test on physical devices** (phones/tablets on same network)
2. **Add more sophisticated error handling**
3. **Implement batch transfer functionality**
4. **Add analytics and reporting**
5. **Deploy to testnet/mainnet** for production use

## 🎉 Success!

Your supply chain MVP is now fully functional with:
- ✅ Real blockchain integration
- ✅ Complete supply chain flow
- ✅ Network device support
- ✅ Transaction tracking
- ✅ Error handling
- ✅ Professional UI/UX

**Ready for demo and further development!** 🚀
