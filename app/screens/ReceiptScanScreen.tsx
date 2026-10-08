import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";
import ScreenHeader from "../components/ScreenHeader";

export default function ReceiptScanScreen() {
  const { colors } = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Scan Receipt" />
      <View style={styles.content}>
        <View style={[styles.placeholder, { backgroundColor: colors.card }]}>
          <Ionicons name="camera" size={64} color={colors.muted} />
          <Text style={[styles.placeholderText, { color: colors.muted }]}>Receipt scanning coming soon</Text>
          <Text style={[styles.subText, { color: colors.muted }]}>Take a photo of your receipt to automatically extract transaction details</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20, justifyContent: "center" },
  placeholder: { padding: 40, borderRadius: 20, alignItems: "center" },
  placeholderText: { fontSize: 18, fontWeight: "600", marginTop: 20 },
  subText: { fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },
});
