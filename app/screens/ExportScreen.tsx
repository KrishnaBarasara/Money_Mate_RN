import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";
import { useTransactions } from "../context/TransactionContext";
import { useToast } from "../context/ToastContext";
import ScreenHeader from "../components/ScreenHeader";

export default function ExportScreen() {
  const { colors } = useThemeColors();
  const { transactions } = useTransactions();
  const { showToast } = useToast();

  const handleExport = (format: string) => {
    if (transactions.length === 0) {
      showToast("No transactions to export", "error");
      return;
    }
    showToast(`Export as ${format} - Feature coming soon`, "info");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Export Data" />
      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Export your transaction data in various formats</Text>
        
        <TouchableOpacity onPress={() => handleExport("CSV")} style={[styles.exportButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name="document-text" size={32} color={colors.primary} />
          <View style={styles.buttonContent}>
            <Text style={[styles.buttonTitle, { color: colors.text }]}>Export as CSV</Text>
            <Text style={[styles.buttonSubtitle, { color: colors.muted }]}>Spreadsheet compatible format</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleExport("PDF")} style={[styles.exportButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name="document" size={32} color={colors.danger} />
          <View style={styles.buttonContent}>
            <Text style={[styles.buttonTitle, { color: colors.text }]}>Export as PDF</Text>
            <Text style={[styles.buttonSubtitle, { color: colors.muted }]}>Printable report format</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.muted} />
        </TouchableOpacity>

        <Text style={[styles.statsText, { color: colors.muted }]}>{transactions.length} transactions available for export</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  exportButton: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  buttonContent: { flex: 1, marginLeft: 16 },
  buttonTitle: { fontSize: 16, fontWeight: "600" },
  buttonSubtitle: { fontSize: 12, marginTop: 2 },
  statsText: { fontSize: 12, textAlign: "center", marginTop: 20 },
});
