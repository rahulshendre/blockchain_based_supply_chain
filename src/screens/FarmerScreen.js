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
import QRCodeGenerator from "../components/QRCodeGenerator";
import { v4 as uuidv4 } from "uuid";
import { 
  farmerWallet, 
  getSupplyChainContract, 
  testNetworkConnection,
  getWalletBalance,
  executeTransaction,
  setLocalQuantity
} from "../utils/blockchain";

export default function FarmerScreen() {
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [batchId, setBatchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState("Checking...");
  const [walletBalance, setWalletBalance] = useState("0");
  const [lastTransaction, setLastTransaction] = useState(null);

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
        const balance = await getWalletBalance(farmerWallet);
        setWalletBalance(balance);
      } else {
        setNetworkStatus("❌ Disconnected");
      }
    } catch (error) {
      setNetworkStatus("❌ Error");
      console.error("Network check failed:", error);
    }
  };

  const handleSubmit = async () => {
    if (!product.trim() || !quantity.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (isNaN(quantity) || parseInt(quantity) <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }

    setLoading(true);
    try {
      const newBatchId = uuidv4();
      setBatchId(newBatchId);

      // Get contract instance
      const contract = getSupplyChainContract(farmerWallet);
      
      // Execute transaction with proper error handling
      const result = await executeTransaction(
        () => contract.createBatch(newBatchId, product, parseInt(quantity)),
        "Failed to create batch on blockchain"
      );

      if (result.success) {
        setLastTransaction(result.hash);
        // Record off-chain authoritative quantity for this batch at creation
        setLocalQuantity(newBatchId, 'Farmer', quantity.toString(), result.hash, Date.now());
        Alert.alert(
          "Success", 
          `Batch created successfully!\n\nBatch ID: ${newBatchId}\nProduct: ${product}\nQuantity: ${quantity}\n\nTransaction: ${result.hash}`
        );
        
        // Refresh wallet balance after successful transaction
        await checkNetworkAndBalance();
      } else {
        Alert.alert("Error", result.error);
      }
      
    } catch (error) {
      console.error("Error creating batch:", error);
      Alert.alert("Error", "Failed to create batch: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProduct("");
    setQuantity("");
    setBatchId("");
    setLastTransaction(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
        <Text style={styles.title}>🌱 Farmer: Add Product</Text>
        
        {/* Network Status and Wallet Info */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Network: {networkStatus}</Text>
          <Text style={styles.statusText}>Balance: {walletBalance} ETH</Text>
          <Button title="Refresh" onPress={checkNetworkAndBalance} />
        </View>
        
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Product Name (e.g., Organic Tomatoes)"
            value={product}
            onChangeText={setProduct}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Quantity (e.g., 100)"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Creating batch on blockchain...</Text>
            </View>
          ) : (
            <Button 
              title="Create Batch" 
              onPress={handleSubmit}
              disabled={networkStatus.includes("❌")}
            />
          )}
        </View>

        {batchId ? (
          <View style={styles.qrSection}>
            <Text style={styles.batchId}>✅ Batch Created Successfully!</Text>
            <Text style={styles.batchId}>Batch ID: {batchId}</Text>
            {lastTransaction && (
              <Text style={styles.transactionText}>Transaction: {lastTransaction}</Text>
            )}
            <QRCodeGenerator value={batchId} />
            <Button title="Create New Batch" onPress={resetForm} />
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
    backgroundColor: '#e8f5e8', // Light green for farmer
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 40, // Extra top padding to avoid camera/notch
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
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
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
    color: '#4CAF50',
  },
  qrSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  batchId: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  transactionText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
});
