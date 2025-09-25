# Supply Chain MVP Setup Instructions

This is a React Native supply chain MVP with blockchain integration using Ganache local blockchain.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Expo CLI**: `npm install -g @expo/cli`
3. **Ganache** (download from https://trufflesuite.com/ganache/)
4. **Hardhat** (already installed in the project)

## Setup Steps

### 1. Start Ganache

1. Download and install Ganache
2. Open Ganache and create a new workspace
3. Note down the RPC URL (usually `http://127.0.0.1:7545`)
4. Copy the private keys for 4 accounts (Farmer, Distributor, Retailer, Consumer)

### 2. Update Blockchain Configuration

Edit `src/utils/blockchain.js` and replace the placeholder private keys:

```javascript
export const farmerWallet = new ethers.Wallet(
  "YOUR_FARMER_PRIVATE_KEY_HERE", // Replace with actual private key from Ganache
  provider
);

export const distributorWallet = new ethers.Wallet(
  "YOUR_DISTRIBUTOR_PRIVATE_KEY_HERE", // Replace with actual private key from Ganache
  provider
);

export const retailerWallet = new ethers.Wallet(
  "YOUR_RETAILER_PRIVATE_KEY_HERE", // Replace with actual private key from Ganache
  provider
);

export const consumerWallet = new ethers.Wallet(
  "YOUR_CONSUMER_PRIVATE_KEY_HERE", // Replace with actual private key from Ganache
  provider
);
```

### 3. Deploy Smart Contract

1. Update `hardhat.config.js` with your Ganache private keys
2. Deploy the contract:

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network ganache
```

3. Copy the deployed contract address and update `SUPPLY_CHAIN_ADDRESS` in `src/utils/blockchain.js`

Deployed Contract (latest):

```
Address: 0x20719C6Ad614b74a76adDB8A16B8c514dABcC98b
Network: Ganache (http://10.251.27.171:7545)
Deploy Tx: 0xeb240ef24c7c4ae4289f3571d4f12016c5b9c0d43bef06b614ba010b59b47911
Test Tx: 0x589854a2d47727b0896edc71d59c6eadff5ee3f1b0775c24918898a24af1d946
```

### 4. Install Dependencies and Start the App

```bash
npm install
npx expo start
```

## App Features

### Farmer Tab
- Create new product batches
- Generate QR codes for batches
- Submit batches to blockchain

### Distributor Tab
- Scan QR codes to receive batches
- Update batch status
- Transfer to retailers

### Retailer Tab
- Scan QR codes to receive batches
- Update inventory status
- Transfer to consumers

### Consumer Tab
- Scan QR codes to view product information
- See complete supply chain journey
- Verify product authenticity

## Testing the Flow

1. **Farmer**: Create a new batch with product name and quantity
2. **Distributor**: Scan the QR code and update the batch
3. **Retailer**: Scan the QR code and update the batch
4. **Consumer**: Scan the QR code to see the complete journey

## Troubleshooting

### Common Issues

1. **"No access to camera"**: Grant camera permissions in your device settings
2. **Blockchain connection errors**: Ensure Ganache is running and RPC URL is correct
3. **Contract deployment fails**: Check that you have enough ETH in your Ganache accounts

### Development Tips

- Use the Expo Go app on your phone for testing QR code scanning
- Check the console logs for transaction hashes and debugging info
- The app works offline for UI testing, but blockchain features require Ganache

## Next Steps

1. Add more sophisticated UI/UX
2. Implement batch status updates in Distributor/Retailer screens
3. Add batch transfer functionality
4. Implement proper error handling
5. Add loading states for blockchain transactions
6. Add batch history and analytics

## File Structure

```
src/
├── screens/
│   ├── FarmerScreen.js
│   ├── DistributorScreen.js
│   ├── RetailerScreen.js
│   ├── ConsumerScreen.js
│   └── ScannerScreen.js
├── components/
│   └── QRCodeGenerator.js
├── utils/
│   └── blockchain.js
└── context/
    └── (for future global state management)

contracts/
└── SupplyChain.sol

scripts/
└── deploy.js
```
