import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  Button, 
  StyleSheet, 
  Alert,
  TouchableOpacity,
  TextInput,
  SafeAreaView
} from "react-native";
// import { BarCodeScanner } from "expo-barcode-scanner";

export default function ScannerScreen({ role = "Distributor", onBatchScanned }) {
  const [batchId, setBatchId] = useState("");
  const [manualBatchId, setManualBatchId] = useState("");

  const handleManualScan = () => {
    if (manualBatchId.trim()) {
      setBatchId(manualBatchId.trim());
      if (onBatchScanned) {
        onBatchScanned(manualBatchId.trim());
      }
      setManualBatchId("");
    } else {
      Alert.alert("Error", "Please enter a batch ID");
    }
  };

  const resetScan = () => {
    setBatchId("");
    setManualBatchId("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      <Text style={styles.title}>{role}: Scan Product</Text>
      
      {batchId ? (
        <View style={styles.resultContainer}>
          <Text style={styles.batchId}>Batch ID: {batchId}</Text>
          <Text style={styles.status}>Status: Scanned</Text>
          <Button title="Scan Another" onPress={resetScan} />
        </View>
      ) : (
        <View style={styles.scanContainer}>
          <Text style={styles.instruction}>
            Enter a batch ID manually (for testing):
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Batch ID"
            value={manualBatchId}
            onChangeText={setManualBatchId}
          />
          <Button title="Submit Batch ID" onPress={handleManualScan} />
        </View>
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 25,
    paddingTop: 32, // Reduced to bring scanner content closer to network card
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  scannerContainer: {
    flex: 1,
  },
  scanner: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scannerText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
  },
  scanContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  instruction: {
    fontSize: 16,
    marginBottom: 20,
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
  resultContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  batchId: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    fontSize: 14,
    color: 'green',
    marginBottom: 20,
  },
});
