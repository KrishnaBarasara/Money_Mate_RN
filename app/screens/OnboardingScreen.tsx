import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";

type Props = { onComplete: () => void };

export default function OnboardingScreen({ onComplete }: Props) {
  const { colors } = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name="wallet" size={80} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Welcome to MoneyMate</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Your personal finance manager. Track expenses, set budgets, and achieve your financial goals.</Text>
      </View>
      <TouchableOpacity onPress={onComplete} style={[styles.button, { backgroundColor: colors.primary }]}>
        <Text style={styles.buttonText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between", padding: 24, paddingTop: 100 },
  content: { alignItems: "center" },
  iconContainer: { width: 160, height: 160, borderRadius: 80, justifyContent: "center", alignItems: "center", marginBottom: 40 },
  title: { fontSize: 32, fontWeight: "800", marginBottom: 16, textAlign: "center" },
  subtitle: { fontSize: 16, textAlign: "center", lineHeight: 24 },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, borderRadius: 14, gap: 10 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
