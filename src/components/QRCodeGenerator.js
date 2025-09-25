import React from "react";
import { View, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function QRCodeGenerator({ value, size = 150 }) {
  return (
    <View style={styles.container}>
      <QRCode 
        value={value} 
        size={size}
        backgroundColor="white"
        color="black"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
