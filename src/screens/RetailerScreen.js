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
import { retailerWallet, distributorWallet, farmerWallet, consumerWallet, getSupplyChainContract, executeTransaction, testNetworkConnection, getWalletBalance, provider, setLocalQuantity } from "../utils/blockchain";

export default function RetailerScreen() {
  const [batchId, setBatchId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState("Checking...");
  const [walletBalance, setWalletBalance] = useState("0");
  const [lastTransaction, setLastTransaction] = useState(null);
  const [onChainStatus, setOnChainStatus] = useState("");
  const truncateHash = (h) => (h && h.length > 12 ? `${h.slice(0, 10)}...${h.slice(-8)}` : h || "");
  const [batchDetails, setBatchDetails] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setNetworkStatus("Checking network...");
        const ok = await testNetworkConnection();
        if (ok) {
          setNetworkStatus("✅ Connected");
          const bal = await getWalletBalance(retailerWallet);
          setWalletBalance(bal);
        } else {
          setNetworkStatus("❌ Disconnected");
        }
      } catch (e) {
        setNetworkStatus("❌ Error");
      }
    })();
  }, []);

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
      const retailerContract = getSupplyChainContract(retailerWallet);
      const distributorContract = getSupplyChainContract(distributorWallet);
      const farmerContract = getSupplyChainContract(farmerWallet);

      // Ensure batch exists
      const exists = await retailerContract.batchExists(id);
      if (!exists) {
        Alert.alert("Not found", "Batch does not exist. Please verify the Batch ID from the Farmer QR.");
        setLoading(false);
        return;
      }

      // Read current assignments
      let info = await retailerContract.getBatchInfo(id);
      const currentDistributor = info[3];
      const currentRetailer = info[4];
      const ZERO = "0x0000000000000000000000000000000000000000";

      // Ensure distributor is assigned first (farmer → distributor)
      if (currentDistributor === ZERO) {
        // estimate gas + 20% buffer
        let gasLimitAssignDist;
        try {
          const est = await farmerContract.transferToDistributor.estimateGas(id, distributorWallet.address);
          gasLimitAssignDist = (est * 12n) / 10n;
        } catch (_) {}
        const assignDist = await executeTransaction(
          () => farmerContract.transferToDistributor(id, distributorWallet.address, gasLimitAssignDist ? { gasLimit: gasLimitAssignDist } : {}),
          "Failed to assign Distributor before Retailer step"
        );
        if (!assignDist.success) {
          Alert.alert("Error", `${assignDist.error}\n\nDetails: ${assignDist.details ?? 'N/A'}`);
          setLoading(false);
          return;
        }
      }

      // If retailer not set, distributor assigns retailer
      if (currentRetailer === ZERO) {
        // estimate gas + 20% buffer
        let gasLimitAssignRet;
        try {
          const est = await distributorContract.transferToRetailer.estimateGas(id, retailerWallet.address);
          gasLimitAssignRet = (est * 12n) / 10n;
        } catch (_) {}
        const assignRes = await executeTransaction(
          () => distributorContract.transferToRetailer(id, retailerWallet.address, gasLimitAssignRet ? { gasLimit: gasLimitAssignRet } : {}),
          "Failed to assign Retailer for this batch"
        );
        if (!assignRes.success) {
          Alert.alert("Error", `${assignRes.error}\n\nDetails: ${assignRes.details ?? 'N/A'}`);
          setLoading(false);
          return;
        }
        setLastTransaction(assignRes.hash);
        Alert.alert("Assigned", `Retailer assigned.\nTx: ${assignRes.hash}`);
      }

      // Update status as Retailer
      // Prepare nonce to avoid race conditions / incorrect nonces on Ganache
      let nextNonce;
      try {
        nextNonce = await provider.getTransactionCount(retailerWallet.address, 'latest');
      } catch (_) {}
      let gasLimitUpdate;
      try {
        const est = await retailerContract.updateBatchStatus.estimateGas(id, "Received by Retailer");
        gasLimitUpdate = (est * 12n) / 10n;
      } catch (_) {}
      const updateRes = await executeTransaction(
        () => retailerContract.updateBatchStatus(
          id,
          "Received by Retailer",
          Object.assign({}, gasLimitUpdate ? { gasLimit: gasLimitUpdate } : {}, (nextNonce !== undefined ? { nonce: nextNonce } : {}))
        ),
        "Failed to update batch status on blockchain"
      );

      if (updateRes.success) {
        setLastTransaction(updateRes.hash);
        try {
          const infoAfter = await retailerContract.getBatchInfo(id);
          const statusAfter = infoAfter[8];
          setOnChainStatus(statusAfter?.toString?.() ?? "");
          setBatchDetails({
            product: infoAfter[0]?.toString?.() ?? "",
            quantity: infoAfter[1]?.toString?.() ?? "",
            farmer: infoAfter[2],
            distributor: infoAfter[3],
            retailer: infoAfter[4],
            updatedAt: Number(infoAfter[7]) ? new Date(Number(infoAfter[7]) * 1000).toISOString() : "",
          });
        } catch (e) {
          console.warn('Post-update read failed (Retailer):', e);
        }

        // Auto-complete to Consumer: retailer transfers to consumer wallet
        const consumerContract = getSupplyChainContract(retailerWallet);
        let gasLimitConsumer;
        try {
          const est = await consumerContract.transferToConsumer.estimateGas(id, consumerWallet.address);
          gasLimitConsumer = (est * 12n) / 10n;
        } catch (_) {}
        const transferToConsumerRes = await executeTransaction(
          () => consumerContract.transferToConsumer(
            id,
            consumerWallet.address,
            Object.assign({}, gasLimitConsumer ? { gasLimit: gasLimitConsumer } : {}, (nextNonce !== undefined ? { nonce: (nextNonce + 1) } : {}))
          ),
          "Failed to transfer to Consumer"
        );

        let consumerMsg = "";
        if (transferToConsumerRes.success) {
          consumerMsg = `\nConsumer Transfer Tx: ${transferToConsumerRes.hash}`;
        } else {
          consumerMsg = `\nConsumer Transfer Failed: ${transferToConsumerRes.error}`;
        }

        Alert.alert(
          "Success",
          `Batch updated successfully!\n\nBatch ID: ${id}\nQuantity: ${quantity}\nStatus (on-chain): ${onChainStatus || 'Received by Retailer'}\n\nRetailer Update Tx: ${updateRes.hash}${consumerMsg}`
        );
        // Store declared quantity off-chain for this hop
        setLocalQuantity(id, 'Retailer', quantity.toString(), updateRes.hash, Date.now());
        setBatchId(id);
        setQuantity("");
        // Refresh displayed wallet balance
        try {
          const bal = await getWalletBalance(retailerWallet);
          setWalletBalance(bal);
        } catch {}
      } else {
        Alert.alert("Error", `${updateRes.error}\n\nDetails: ${updateRes.details ?? 'N/A'}`);
      }
    } catch (error) {
      console.error("Error updating batch (Retailer):", error);
      Alert.alert("Error", "Failed to update batch: " + (error?.message ?? "Unknown"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
        <Text style={styles.title}>🏪 Retailer: Stock Product</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Network: {networkStatus}</Text>
          <Text style={styles.statusText}>Balance: {walletBalance} ETH</Text>
        </View>

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
                <Text style={styles.feedbackText}>Retailer: {batchDetails.retailer}</Text>
                <Text style={styles.feedbackText}>Updated At: {batchDetails.updatedAt}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        
        <ScannerScreen 
          role="Retailer" 
          onBatchScanned={handleBatchScanned}
        />

        {batchId ? (
          <View style={styles.updateSection}>
            <Text style={styles.batchInfo}>Batch ID: {batchId}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Quantity Stocked"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF9800" />
              </View>
            ) : (
              <Button 
                title="Update Batch" 
                onPress={handleUpdate}
              />
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
    backgroundColor: '#fff3e0', // Light orange for retailer
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 25,
    paddingTop: 96, // Reduce overall gap below header
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
    marginBottom: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  feedbackBox: {
    backgroundColor: '#fffde7',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  feedbackText: {
    color: '#7b5e00',
    marginBottom: 4,
  },
  feedbackHash: {
    color: '#7b5e00',
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
});
