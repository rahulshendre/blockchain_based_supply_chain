import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView
} from "react-native";
import ScannerScreen from "./ScannerScreen";
import { 
  distributorWallet,
  farmerWallet,
  getSupplyChainContract,
  testNetworkConnection,
  getWalletBalance,
  executeTransaction,
  setLocalQuantity
} from "../utils/blockchain";

export default function DistributorScreen() {
  const [batchId, setBatchId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState("Checking...");
  const [walletBalance, setWalletBalance] = useState("0");
  const [lastTransaction, setLastTransaction] = useState(null);
  const [onChainStatus, setOnChainStatus] = useState("");
  const [batchDetails, setBatchDetails] = useState(null);

  const truncateHash = (h) => (h && h.length > 12 ? `${h.slice(0, 10)}...${h.slice(-8)}` : h || "");

  // Check network connection and wallet balance on component mount
  useEffect(() => {
    checkNetworkAndBalance();
  }, []);

  const checkNetworkAndBalance = async () => {
    try {
      setNetworkStatus("Checking network...");
      const isConnected = await testNetworkConnection();
      
      if (isConnected) {
        setNetworkStatus("✅ Connected");
        const balance = await getWalletBalance(distributorWallet);
        setWalletBalance(balance);
      } else {
        setNetworkStatus("❌ Disconnected");
      }
    } catch (error) {
      setNetworkStatus("❌ Error");
      console.error("Network check failed:", error);
    }
  };

  const handleBatchScanned = (scannedBatchId) => {
    setBatchId(scannedBatchId);
  };

  const handleUpdate = async () => {
    const id = (batchId || '').trim();
    if (!id || !quantity) {
      Alert.alert("Error", "Please scan a batch and enter quantity");
      return;
    }

    if (isNaN(quantity) || parseInt(quantity) <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }

    setLoading(true);
    try {
      // Contracts for both roles
      const distributorContract = getSupplyChainContract(distributorWallet);
      const farmerContract = getSupplyChainContract(farmerWallet);

      // Ensure batch exists before any write
      const exists = await distributorContract.batchExists(id);
      if (!exists) {
        Alert.alert("Not found", "Batch does not exist. Please verify the Batch ID from the Farmer QR.");
        setLoading(false);
        return;
      }

      // Read current assignment
      let info = await distributorContract.getBatchInfo(id);
      const currentDistributor = info[3];
      const ZERO = "0x0000000000000000000000000000000000000000";

      // If distributor not set, have Farmer assign Distributor for this batch
      if (currentDistributor === ZERO) {
        // Estimate gas and add 20% buffer to avoid out-of-gas on Ganache
        let gasLimitAssign;
        try {
          const est = await farmerContract.transferToDistributor.estimateGas(id, distributorWallet.address);
          gasLimitAssign = (est * 12n) / 10n;
        } catch (_) {}
        const assignRes = await executeTransaction(
          () => farmerContract.transferToDistributor(id, distributorWallet.address, gasLimitAssign ? { gasLimit: gasLimitAssign } : {}),
          "Failed to assign Distributor for this batch"
        );
        if (!assignRes.success) {
          Alert.alert("Error", `${assignRes.error}\n\nDetails: ${assignRes.details ?? 'N/A'}`);
          setLoading(false);
          return;
        }
        setLastTransaction(assignRes.hash);
        Alert.alert("Assigned", `Distributor assigned.\nTx: ${assignRes.hash}`);
      }

      // Now update status as Distributor
      // Estimate gas and add 20% buffer
      let gasLimitUpdate;
      try {
        const est = await distributorContract.updateBatchStatus.estimateGas(id, "Received by Distributor");
        gasLimitUpdate = (est * 12n) / 10n;
      } catch (_) {}
      const updateRes = await executeTransaction(
        () => distributorContract.updateBatchStatus(id, "Received by Distributor", gasLimitUpdate ? { gasLimit: gasLimitUpdate } : {}),
        "Failed to update batch status on blockchain"
      );

      if (updateRes.success) {
        setLastTransaction(updateRes.hash);
        let statusAfterStr = 'Received by Distributor';
        let detailsForAlert = { qty: quantity };
        try {
          const infoAfter = await distributorContract.getBatchInfo(id);
          const statusAfter = infoAfter[8];
          statusAfterStr = statusAfter?.toString?.() ?? statusAfterStr;
          const mapped = {
            product: infoAfter[0]?.toString?.() ?? "",
            quantity: infoAfter[1]?.toString?.() ?? "",
            farmer: infoAfter[2],
            distributor: infoAfter[3],
            updatedAt: Number(infoAfter[7]) ? new Date(Number(infoAfter[7]) * 1000).toISOString() : "",
          };
          setOnChainStatus(statusAfterStr);
          setBatchDetails(mapped);
          detailsForAlert = { qty: mapped.quantity };
        } catch (e) {
          console.warn('Post-update read failed:', e);
        }
        Alert.alert(
          "Success",
          `Batch updated successfully!\n\nBatch ID: ${id}\nQuantity: ${detailsForAlert.qty}\nStatus (on-chain): ${statusAfterStr}\n\nTransaction: ${updateRes.hash}`
        );
        // Store declared quantity off-chain as authoritative for this hop
        setLocalQuantity(id, 'Distributor', detailsForAlert.qty?.toString?.() ?? String(detailsForAlert.qty), updateRes.hash, Date.now());
        await checkNetworkAndBalance();
        setBatchId(id);
        setQuantity("");
      } else {
        Alert.alert("Error", `${updateRes.error}\n\nDetails: ${updateRes.details ?? 'N/A'}`);
      }
      
    } catch (error) {
      console.error("Error updating batch (Distributor):", error);
      Alert.alert("Error", "Failed to update batch: " + (error?.message ?? "Unknown"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
        <Text style={styles.title}>🚚 Distributor: Process Product</Text>
        
        {/* Network Status and Wallet Info */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Network: {networkStatus}</Text>
          <Text style={styles.statusText}>Balance: {walletBalance} ETH</Text>
          <Button title="Refresh" onPress={checkNetworkAndBalance} />
        </View>

        {/* Inline feedback after updates */}
        {(lastTransaction || onChainStatus || batchDetails) ? (
          <View style={styles.feedbackBox}>
            {onChainStatus ? (
              <Text style={styles.feedbackText}>Status (on-chain): {onChainStatus}</Text>
            ) : null}
            {lastTransaction ? (
              <Text style={styles.feedbackHash}>Tx: {truncateHash(lastTransaction)}</Text>
            ) : null}
            {batchDetails ? (
              <View style={{ marginTop: 6 }}>
                <Text style={styles.feedbackText}>Product: {batchDetails.product}</Text>
                <Text style={styles.feedbackText}>Quantity: {batchDetails.quantity}</Text>
                <Text style={styles.feedbackText}>Farmer: {batchDetails.farmer}</Text>
                <Text style={styles.feedbackText}>Distributor: {batchDetails.distributor}</Text>
                <Text style={styles.feedbackText}>Updated At: {batchDetails.updatedAt}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        
        <ScannerScreen 
          role="Distributor" 
          onBatchScanned={handleBatchScanned}
        />

        {batchId ? (
          <View style={styles.updateSection}>
            <Text style={styles.batchInfo}>📦 Batch ID: {batchId}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Quantity Received (e.g., 100)"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Updating batch on blockchain...</Text>
              </View>
            ) : (
              <Button 
                title="Update Batch" 
                onPress={handleUpdate}
                disabled={networkStatus.includes("❌")}
              />
            )}
            
            {lastTransaction && (
              <Text style={styles.transactionText}>Last Transaction: {lastTransaction}</Text>
            )}
          </View>
        ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e8f4fd', // Light blue for distributor
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 64, // Extra top padding to avoid camera/notch
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  feedbackBox: {
    backgroundColor: '#e8f5e8',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  feedbackText: {
    color: '#2e7d32',
    marginBottom: 4,
  },
  feedbackHash: {
    color: '#2e7d32',
    fontFamily: 'monospace',
  },
  updateSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  batchInfo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 5,
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2196F3',
  },
  transactionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
});
