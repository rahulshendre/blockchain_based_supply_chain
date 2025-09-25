# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### 1. **Ganache Connection Issues**

**Problem**: "Connection refused" or "Network error"
**Solutions**:
- ✅ Ensure Ganache is running
- ✅ Check RPC URL: `http://127.0.0.1:7545`
- ✅ Verify Ganache is listening on port 7545
- ✅ Try restarting Ganache

**Test Command**:
```bash
curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://127.0.0.1:7545
```

### 2. **React Native App Issues**

**Problem**: App crashes or shows errors
**Solutions**:
- ✅ Check console logs for specific error messages
- ✅ Ensure all dependencies are installed: `npm install`
- ✅ Try clearing cache: `npx expo start --clear`
- ✅ Check if Metro bundler is running

### 3. **Blockchain Transaction Issues**

**Problem**: Transactions fail or timeout
**Solutions**:
- ✅ Check Ganache accounts have enough ETH
- ✅ Verify private keys are correct
- ✅ Check if contract is deployed
- ✅ Try increasing gas limit

### 4. **QR Code Issues**

**Problem**: QR codes not scanning or generating
**Solutions**:
- ✅ Grant camera permissions
- ✅ Use Expo Go app for testing
- ✅ Check if QR code is valid
- ✅ Try regenerating QR code

## 🔍 Debug Steps

### Step 1: Test Ganache Connection
```bash
cd supply_chain_mvp
node test-connection.js
```

### Step 2: Test React Native App
```bash
npx expo start
```

### Step 3: Check Console Logs
Look for these error patterns:
- `❌ Ganache connection failed`
- `❌ Transaction failed`
- `❌ Contract not found`

### Step 4: Verify Configuration
Check these files:
- `src/utils/blockchain.js` - Private keys and RPC URL
- `hardhat.config.js` - Network configuration
- `package.json` - Dependencies

## 🚨 Common Error Messages

### "Connection refused"
- Ganache is not running
- Wrong RPC URL
- Firewall blocking connection

### "Invalid private key"
- Private key format is wrong
- Key doesn't match Ganache account
- Missing 0x prefix

### "Contract not found"
- Contract not deployed
- Wrong contract address
- ABI mismatch

### "Insufficient funds"
- Account has no ETH
- Gas price too high
- Transaction cost exceeds balance

## 🛠️ Quick Fixes

### Reset Everything
```bash
# Stop all processes
# Restart Ganache
# Clear React Native cache
npx expo start --clear
```

### Check Ganache Status
1. Open Ganache GUI
2. Check if workspace is running
3. Verify accounts have ETH
4. Check RPC URL in settings

### Test Blockchain Connection
```javascript
// Add this to your app to test
import { provider } from './src/utils/blockchain';
provider.getBlockNumber().then(console.log).catch(console.error);
```

## 📞 Getting Help

If you're still having issues:

1. **Check the console logs** for specific error messages
2. **Run the test script**: `node test-connection.js`
3. **Verify Ganache is running** and accessible
4. **Check the network tab** in your browser for failed requests

## 🎯 Success Indicators

You should see:
- ✅ Ganache connection successful
- ✅ All wallets created successfully
- ✅ App starts without errors
- ✅ QR codes generate and scan
- ✅ Transactions complete successfully
