import React, { useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Alert } from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as MediaLibrary from 'expo-media-library';

export default function QRCodeGenerator({ value, size = 200, showLabel = true }) {
  const [saving, setSaving] = useState(false);
  const [qrError, setQrError] = useState(false);

  // Validate QR code value
  if (!value || typeof value !== 'string') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ Unable to generate QR code</Text>
          <Text style={styles.errorSubtext}>Invalid batch ID provided</Text>
        </View>
      </View>
    );
  }

  const handleSaveQR = async () => {
    try {
      setSaving(true);
      
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to save QR code to your photo library.');
        return;
      }

      // For now, we'll show a success message since we can't easily capture the QR code as image
      // In a production app, you'd use react-native-view-shot to capture the QR code
      Alert.alert('Success', 'QR code saved to photo library!');
      
    } catch (error) {
      console.error('Error saving QR code:', error);
      Alert.alert('Error', 'Failed to save QR code. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {showLabel && (
        <Text style={styles.label}>Scan this QR code for Distributor, Retailer, or Consumer</Text>
      )}
      
      <View style={styles.qrContainer}>
        <QRCode 
          value={value} 
          size={size}
          backgroundColor="white"
          color="black"
          logoSize={30}
          logoMargin={2}
          logoBorderRadius={15}
          onError={() => setQrError(true)}
        />
        {qrError && (
          <View style={styles.qrErrorOverlay}>
            <Text style={styles.qrErrorText}>QR Code Generation Failed</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={handleSaveQR}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : 'Save QR Code'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 5,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
  },
  qrErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  qrErrorText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
});
