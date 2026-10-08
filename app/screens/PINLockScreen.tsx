import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";
import * as SecureStore from "expo-secure-store";

type Props = { onUnlock: () => void };

export default function PINLockScreen({ onUnlock }: Props) {
  const { colors } = useThemeColors();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleKeyPress = (key: string) => {
    if (pin.length < 4) setPin(pin + key);
    setError(false);
  };

  const handleDelete = () => setPin(pin.slice(0, -1));

  const verifyPin = async () => {
    const storedPin = await SecureStore.getItemAsync("userPin");
    if (pin === storedPin) {
      onUnlock();
    } else {
      setError(true);
      setPin("");
    }
  };

  useEffect(() => {
    if (pin.length === 4) verifyPin();
  }, [pin]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Ionicons name="lock-closed" size={48} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Enter PIN</Text>
        {error && (
          <Text style={[styles.error, { color: colors.danger }]}>
            Incorrect PIN
          </Text>
        )}
        <View style={styles.dotsContainer}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    pin.length > i ? colors.primary : colors.inputBorder,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.keypad}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map(
          (key) => (
            <TouchableOpacity
              key={key}
              onPress={() =>
                key === "del" ? handleDelete() : key && handleKeyPress(key)
              }
              style={[
                styles.key,
                { backgroundColor: key ? colors.card : "transparent" },
              ]}
              disabled={!key}
            >
              {key === "del" ? (
                <Ionicons name="backspace" size={24} color={colors.text} />
              ) : (
                <Text style={[styles.keyText, { color: colors.text }]}>
                  {key}
                </Text>
              )}
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 28, fontWeight: "700", marginTop: 20 },
  error: { fontSize: 14, marginTop: 8 },
  dotsContainer: { flexDirection: "row", gap: 16, marginTop: 40 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  keyText: { fontSize: 28, fontWeight: "600" },
});
