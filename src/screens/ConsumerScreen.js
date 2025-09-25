import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert,
  ScrollView,
  ActivityIndicator,
  Button
} from "react-native";
import ScannerScreen from "./ScannerScreen";
import { 
  consumerWallet, 
  getSupplyChainContract,
  testNetworkConnection,
  getWalletBalance,
  getLocalQuantities
} from "../utils/blockchain";

export default function ConsumerScreen() {
  const [batchId, setBatchId] = useState("");
  const [productInfo, setProductInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState("Checking...");
  const [walletBalance, setWalletBalance] = useState("0");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [events, setEvents] = useState([]);

  // Role color style helper
  const roleStyle = (role) => {
    const r = (role || '').toLowerCase();
    if (r.includes('farmer')) return { color: '#2e7d32' };
    if (r.includes('distributor')) return { color: '#1565c0' };
    if (r.includes('retail')) return { color: '#ef6c00' };
    if (r.includes('consumer')) return { color: '#6a1b9a' };
    if (r.includes('update')) return { color: '#455a64' };
    return { color: '#333' };
  };

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
        const balance = await getWalletBalance(consumerWallet);
        setWalletBalance(balance);
      } else {
        setNetworkStatus("❌ Disconnected");
      }
    } catch (error) {
      setNetworkStatus("❌ Error");
      console.error("Network check failed:", error);
    }
  };

  const handleBatchScanned = async (scannedBatchId) => {
    setBatchId(scannedBatchId);
    setLoading(true);
    
    try {
      // Fetch product information from smart contract
      const contract = getSupplyChainContract(consumerWallet);

      // Check existence first for clearer errors
      const exists = await contract.batchExists(scannedBatchId);
      if (!exists) {
        Alert.alert("Not found", "No batch found for the provided Batch ID.");
        setProductInfo(null);
        return;
      }

      const info = await contract.getBatchInfo(scannedBatchId);
      
      const productInfo = {
        batchId: scannedBatchId,
        product: info[0], // product name
        quantity: info[1].toString(), // quantity
        farmer: info[2], // farmer address
        distributor: info[3], // distributor address
        retailer: info[4], // retailer address
        consumer: info[5], // consumer address
        status: info[8], // status
        createdAt: new Date(parseInt(info[6]) * 1000).toISOString(),
        updatedAt: new Date(parseInt(info[7]) * 1000).toISOString(),
        journey: [
          { step: "🌱 Farm", timestamp: new Date(parseInt(info[6]) * 1000).toISOString(), status: "Created by Farmer", completed: true },
          { step: "🚚 Distribution", timestamp: info[3] !== "0x0000000000000000000000000000000000000000" ? new Date(parseInt(info[7]) * 1000).toISOString() : null, status: info[3] !== "0x0000000000000000000000000000000000000000" ? "Transferred to Distributor" : "Pending", completed: info[3] !== "0x0000000000000000000000000000000000000000" },
          { step: "🏪 Retail", timestamp: info[4] !== "0x0000000000000000000000000000000000000000" ? new Date(parseInt(info[7]) * 1000).toISOString() : null, status: info[4] !== "0x0000000000000000000000000000000000000000" ? "Transferred to Retailer" : "Pending", completed: info[4] !== "0x0000000000000000000000000000000000000000" },
          { step: "👤 Consumer", timestamp: info[5] !== "0x0000000000000000000000000000000000000000" ? new Date(parseInt(info[7]) * 1000).toISOString() : null, status: info[5] !== "0x0000000000000000000000000000000000000000" ? "Sold to Consumer" : "Pending", completed: info[5] !== "0x0000000000000000000000000000000000000000" },
        ]
      };
      
      setProductInfo(productInfo);
      // also fetch events
      await fetchBatchHistory(scannedBatchId);
    } catch (error) {
      console.error("Error fetching product info:", error);
      Alert.alert("Error", "Failed to fetch product information: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchHistory = async (id) => {
    setHistoryLoading(true);
    try {
      const contract = getSupplyChainContract(consumerWallet);
      const fromBlock = 0; // full history on Ganache

      const createdFilter = contract.filters?.BatchCreated?.(id);
      const transferredFilter = contract.filters?.BatchTransferred?.(id);
      const updatedFilter = contract.filters?.BatchUpdated?.(id) || contract.filters?.BatchStatusUpdated?.(id);
      const completedFilter = contract.filters?.BatchCompleted?.(id);

      const promises = [];
      if (createdFilter) promises.push(contract.queryFilter(createdFilter, fromBlock)); else promises.push(Promise.resolve([]));
      if (transferredFilter) promises.push(contract.queryFilter(transferredFilter, fromBlock)); else promises.push(Promise.resolve([]));
      if (updatedFilter) promises.push(contract.queryFilter(updatedFilter, fromBlock)); else promises.push(Promise.resolve([]));
      if (completedFilter) promises.push(contract.queryFilter(completedFilter, fromBlock)); else promises.push(Promise.resolve([]));

      const [created, transferred, updated, completed] = await Promise.all(promises);

      const provider = contract.runner?.provider || contract.provider;
      // Cache block timestamps to avoid many RPCs
      const blockTs = new Map();
      async function withTimestamp(log, type) {
        let ts = blockTs.get(log.blockNumber);
        if (ts === undefined) {
          const b = await provider.getBlock(log.blockNumber);
          ts = b?.timestamp || 0;
          blockTs.set(log.blockNumber, ts);
        }
        return {
          type,
          blockNumber: log.blockNumber,
          logIndex: log.logIndex,
          txHash: log.transactionHash,
          args: log.args,
          timestamp: ts,
        };
      }

      const rows = [
        ...(await Promise.all(created.map((l) => withTimestamp(l, 'created')))),
        ...(await Promise.all(transferred.map((l) => withTimestamp(l, 'transferred')))),
        ...(await Promise.all(updated.map((l) => withTimestamp(l, 'updated')))),
        ...(await Promise.all(completed.map((l) => withTimestamp(l, 'completed')))),
      ].sort((a, b) => (a.blockNumber - b.blockNumber) || (a.logIndex - b.logIndex));

      setEvents(rows);
    } catch (e) {
      console.error('History fetch failed:', e);
      Alert.alert('Error', 'Failed to fetch batch history');
      setEvents([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const resetScan = () => {
    setBatchId("");
    setProductInfo(null);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>👤 Consumer: Verify Product</Text>
        
        {/* Network Status and Wallet Info */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Network: {networkStatus}</Text>
          <Text style={styles.statusText}>Balance: {walletBalance} ETH</Text>
          <Button title="Refresh" onPress={checkNetworkAndBalance} />
        </View>
        
        <ScannerScreen 
          role="Consumer" 
          onBatchScanned={handleBatchScanned}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9C27B0" />
            <Text style={styles.loadingText}>Fetching product information from blockchain...</Text>
          </View>
        ) : productInfo ? (
          <View style={styles.productInfo}>
            <Text style={styles.sectionTitle}>📦 Product Information</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Product:</Text>
              <Text style={styles.value}>{productInfo.product}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Batch ID:</Text>
              <Text style={styles.value}>{productInfo.batchId}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Quantity:</Text>
              {(() => {
                const locals = getLocalQuantities(productInfo.batchId);
                let displayQty = productInfo.quantity;
                if (locals.length) {
                  const consumerRec = locals.find(r => (r.role || '').toLowerCase().includes('consumer'));
                  const lastRec = locals[locals.length - 1];
                  displayQty = consumerRec?.quantity || lastRec?.quantity || displayQty;
                }
                return <Text style={styles.value}>{displayQty} units</Text>;
              })()}
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Status:</Text>
              <Text style={styles.value}>{productInfo.status}</Text>
            </View>

            <Text style={styles.sectionTitle}>🛣️ Supply Chain Journey</Text>
            {productInfo.journey.map((step, index) => (
              <View key={index} style={[
                styles.journeyStep,
                step.completed ? styles.completedStep : styles.pendingStep
              ]}>
                <Text style={styles.stepName}>{step.step}</Text>
                <Text style={[
                  styles.stepStatus,
                  step.completed ? styles.completedStatus : styles.pendingStatus
                ]}>
                  {step.status}
                </Text>
                {step.timestamp && (
                  <Text style={styles.stepTime}>{step.timestamp}</Text>
                )}
              </View>
            ))}
            
            <Button title="Scan Another Product" onPress={resetScan} />
            <View style={{ height: 8 }} />
            <Button title="Refresh" onPress={() => handleBatchScanned(batchId)} />
            <View style={{ height: 8 }} />
            <Button title="View Batch History" onPress={() => fetchBatchHistory(productInfo.batchId)} />

            {/* History Section */}
            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>📜 Batch History</Text>
              {historyLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#9C27B0" />
                  <Text style={styles.loadingText}>Loading history...</Text>
                </View>
              ) : events.length === 0 ? (
                <Text style={styles.historyEmpty}>No activity yet</Text>
              ) : (
                events.map((ev, idx) => {
                  const isCreated = ev.type === 'created';
                  const isTransferred = ev.type === 'transferred';
                  const isUpdated = ev.type === 'updated';
                  const isCompleted = ev.type === 'completed';
                  let role = '—';
                  let action = '—';
                  let actor = '';
                  // Try to overlay off-chain declared quantities for this step
                  let declaredQty = '';
                  const local = getLocalQuantities(productInfo.batchId);
                  if (local.length) {
                    // choose closest prior local record for this role
                    const stepRole = isCreated ? 'Farmer' : isTransferred ? (ev.args?.role || ev.args?.[3] || '').toString() : (isCompleted ? 'Consumer' : 'Update');
                    const candidates = local.filter(r => (r.role || '').toLowerCase().includes(stepRole.toLowerCase()));
                    if (candidates.length) declaredQty = candidates[candidates.length - 1].quantity;
                  }
                  if (isCreated) {
                    role = 'Farmer';
                    action = `Created (${ev.args?.product || ev.args?.[1] || ''}${declaredQty ? `, qty: ${declaredQty}` : ''})`;
                    actor = ev.args?.farmer || ev.args?.[3] || '';
                  } else if (isTransferred) {
                    const r = (ev.args?.role || ev.args?.[3] || '').toString();
                    role = r;
                    action = `Transferred to ${r}${declaredQty ? `, qty: ${declaredQty}` : ''}`;
                    actor = ev.args?.to || ev.args?.[2] || '';
                  } else if (isUpdated) {
                    role = 'Update';
                    const st = (ev.args?.status || ev.args?.[1] || '').toString();
                    action = declaredQty ? `${st} (qty: ${declaredQty})` : st;
                    actor = ev.args?.updatedBy || ev.args?.[2] || '';
                  } else if (isCompleted) {
                    role = 'Consumer';
                    action = `Completed${declaredQty ? `, qty: ${declaredQty}` : ''}`;
                    actor = ev.args?.consumer || ev.args?.[1] || '';
                  }
                  const ts = ev.timestamp ? new Date(ev.timestamp * 1000).toISOString() : '';
                  return (
                    <View key={`${ev.txHash}-${idx}`} style={styles.historyRow}>
                      <Text style={[styles.historyRole, roleStyle(role)]}>{role}</Text>
                      <Text style={styles.historyAction}>{action}</Text>
                      <Text style={styles.historyActor}>{actor}</Text>
                      <Text style={styles.historyHash}>{ev.txHash}</Text>
                      {ts ? <Text style={styles.historyHash}>{ts}</Text> : null}
                    </View>
                  );
                })
              )}
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3e5f5', // Light purple for consumer
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
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#9C27B0',
  },
  productInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  historySection: {
    marginTop: 16,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
  },
  historyEmpty: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  historyRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 8,
  },
  historyRole: {
    fontWeight: 'bold',
  },
  historyAction: {
    color: '#333',
  },
  historyActor: {
    fontFamily: 'monospace',
    color: '#555',
  },
  historyHash: {
    fontFamily: 'monospace',
    color: '#888',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
    width: 80,
  },
  value: {
    flex: 1,
  },
  journeyStep: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  completedStep: {
    backgroundColor: '#e8f5e8',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  pendingStep: {
    backgroundColor: '#fff3e0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  stepName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepStatus: {
    fontSize: 14,
  },
  completedStatus: {
    color: '#4CAF50',
  },
  pendingStatus: {
    color: '#FF9800',
  },
  stepTime: {
    color: '#666',
    fontSize: 12,
  },
});
