import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  Button, 
  StyleSheet, 
  Alert,
  ScrollView 
} from "react-native";
import { testBlockchainConnection, provider, farmerWallet } from "../utils/blockchain-debug";

export default function TestScreen() {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message, isError = false) => {
    setTestResults(prev => [...prev, { message, isError, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      addResult("🔍 Starting blockchain connection tests...");
      
      // Test 1: Basic connection
      addResult("Test 1: Testing basic connection...");
      const blockNumber = await provider.getBlockNumber();
      addResult(`✅ Block number: ${blockNumber}`);
      
      // Test 2: Wallet balance
      addResult("Test 2: Testing wallet balance...");
      const balance = await provider.getBalance(farmerWallet.address);
      addResult(`✅ Farmer balance: ${balance} wei`);
      
      // Test 3: Network info
      addResult("Test 3: Testing network info...");
      const network = await provider.getNetwork();
      addResult(`✅ Network: ${network.name} (Chain ID: ${network.chainId})`);
      
      // Test 4: Gas price
      addResult("Test 4: Testing gas price...");
      const gasPrice = await provider.getGasPrice();
      addResult(`✅ Gas price: ${gasPrice} wei`);
      
      addResult("🎉 All tests passed! Blockchain connection is working correctly.");
      
    } catch (error) {
      addResult(`❌ Test failed: ${error.message}`, true);
      console.error("Test error:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Blockchain Connection Test</Text>
        
        <View style={styles.buttonContainer}>
          <Button 
            title={loading ? "Testing..." : "Run Tests"} 
            onPress={runTests}
            disabled={loading}
          />
          <Button 
            title="Clear Results" 
            onPress={clearResults}
            color="red"
          />
        </View>

        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {testResults.map((result, index) => (
            <Text 
              key={index} 
              style={[
                styles.resultText, 
                result.isError ? styles.errorText : styles.successText
              ]}
            >
              [{result.timestamp}] {result.message}
            </Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  successText: {
    color: 'green',
  },
  errorText: {
    color: 'red',
  },
});
