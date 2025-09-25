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
            <Text style={styles.successTitle}>✅ Batch Created Successfully!</Text>
            
            <View style={styles.batchDetails}>
              <Text style={styles.batchId}>Batch ID: {batchId}</Text>
              <Text style={styles.productInfo}>Product: {product}</Text>
              <Text style={styles.quantityInfo}>Quantity: {quantity} units</Text>
              {lastTransaction && (
                <Text style={styles.transactionText}>Transaction: {lastTransaction}</Text>
              )}
            </View>

            <QRCodeGenerator value={batchId} size={250} showLabel={true} />
            
            <View style={styles.actionButtons}>
              <Button title="Create New Batch" onPress={resetForm} />
            </View>
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
    padding: 30,
    paddingTop: 210, // Extra top padding to avoid camera/notch
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
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
    textAlign: 'center',
  },
  batchDetails: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  batchId: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  productInfo: {
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
    color: '#666',
  },
  quantityInfo: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
    color: '#666',
  },
  transactionText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  actionButtons: {
    marginTop: 20,
    width: '100%',
  },
});
