import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { verifyPIN, getPINLength, PINLength } from "../services/pinService";
import ScreenHeader from "../components/ScreenHeader";

type RouteParams = {
  onVerifySuccess?: () => void;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
};

export default function PINVerifyScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: RouteParams }, "params">>();
  const { colors } = useThemeColors();
  const { showToast } = useToast();
  
  const onVerifySuccess = route.params?.onVerifySuccess;
  const customTitle = route.params?.title;
  const customSubtitle = route.params?.subtitle;
  const showBackButton = route.params?.showBackButton ?? false;
  
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [pinLength, setPinLength] = useState<PINLength>(4);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    loadPINLength();
  }, []);

  const loadPINLength = async () => {
    const length = await getPINLength();
    setPinLength(length);
  };

  const handleKeyPress = (key: string) => {
    if (isLocked) return;
    if (pin.length < pinLength) {
      setPin(pin + key);
      setError(false);
    }
  };

  const handleDelete = () => {
    if (isLocked) return;
    setPin(pin.slice(0, -1));
    setError(false);
  };

  const verifyPin = async () => {
    if (isLocked) return;
    
    const isValid = await verifyPIN(pin);
    if (isValid) {
      setError(false);
      setAttempts(0);
      
      // Call success callback if provided
      if (onVerifySuccess) {
        onVerifySuccess();
      } else {
        // Default behavior: go back
        navigation.goBack();
      }
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(true);
      setPin("");
      
      // Lock after 5 failed attempts
      if (newAttempts >= 5) {
        setIsLocked(true);
        showToast("Too many failed attempts. Please try again later.", "error");
        // Unlock after 30 seconds
        setTimeout(() => {
          setIsLocked(false);
          setAttempts(0);
        }, 30000);
      } else {
        showToast("Incorrect PIN", "error");
      }
    }
  };

  useEffect(() => {
    if (pin.length === pinLength && !isLocked) {
      verifyPin();
    }
  }, [pin, pinLength]);

  const getTitle = () => {
    if (customTitle) return customTitle;
    if (isLocked) return "PIN Locked";
    return "Enter PIN";
  };

  const getSubtitle = () => {
    if (customSubtitle) return customSubtitle;
    if (isLocked) {
      return "Too many failed attempts. Please wait 30 seconds before trying again.";
    }
    if (attempts > 0) {
      return `${5 - attempts} attempts remaining`;
    }
    return `Enter your ${pinLength}-digit PIN`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showBackButton && (
        <ScreenHeader title="" showBack={true} />
      )}
      <View style={styles.content}>
        <Ionicons 
          name={isLocked ? "lock-closed" : "lock-open"} 
          size={48} 
          color={isLocked ? colors.danger : colors.primary} 
        />
        <Text style={[styles.title, { color: colors.text }]}>{getTitle()}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {getSubtitle()}
        </Text>
        {error && !isLocked && (
          <Text style={[styles.error, { color: colors.danger }]}>
            Incorrect PIN
          </Text>
        )}
        <View style={styles.dotsContainer}>
          {Array.from({ length: pinLength }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    pin.length > i
                      ? isLocked
                        ? colors.danger
                        : colors.primary
                      : colors.inputBorder,
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
                { 
                  backgroundColor: key ? colors.card : "transparent",
                  opacity: isLocked ? 0.5 : 1,
                },
              ]}
              disabled={!key || isLocked}
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: { fontSize: 28, fontWeight: "700", marginTop: 20, marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: "center", marginTop: 8 },
  error: { fontSize: 14, marginTop: 8, fontWeight: "600" },
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

