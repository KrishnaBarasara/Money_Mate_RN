import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import {
  setPIN,
  verifyPIN,
  hasPIN,
  getPINLength,
  PINLength,
  deletePIN,
} from "../services/pinService";
import { disableBiometric } from "../services/biometricService";
import ScreenHeader from "../components/ScreenHeader";

type RouteParams = {
  enableBiometricAfterSetup?: boolean;
};

export default function PINSetupScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: RouteParams }, "params">>();
  const { colors } = useThemeColors();
  const { showToast } = useToast();

  const enableBiometricAfterSetup =
    route.params?.enableBiometricAfterSetup || false;

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasExistingPin, setHasExistingPin] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [isVerifyingCurrent, setIsVerifyingCurrent] = useState(false);
  const [pinLength, setPinLength] = useState<PINLength>(4);

  useEffect(() => {
    checkExistingPin();
  }, []);

  const checkExistingPin = async () => {
    const pinExists = await hasPIN();
    if (pinExists) {
      setHasExistingPin(true);
      setIsVerifyingCurrent(true);
      const length = await getPINLength();
      setPinLength(length);
    } else {
      // Default to 4 digits for new PINs
      setPinLength(4);
    }
  };

  const handleKeyPress = (key: string) => {
    if (isVerifyingCurrent) {
      if (currentPin.length < pinLength) setCurrentPin(currentPin + key);
    } else if (isConfirming) {
      if (confirmPin.length < pinLength) setConfirmPin(confirmPin + key);
    } else {
      if (pin.length < pinLength) setPin(pin + key);
    }
  };

  const handleDelete = () => {
    if (isVerifyingCurrent) {
      setCurrentPin(currentPin.slice(0, -1));
    } else if (isConfirming) {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const handleVerifyCurrentPin = async () => {
    if (currentPin.length === pinLength) {
      const isValid = await verifyPIN(currentPin);
      if (isValid) {
        setIsVerifyingCurrent(false);
        setCurrentPin("");
        // Get PIN length for new PIN
        const length = await getPINLength();
        setPinLength(length);
      } else {
        showToast("Incorrect PIN", "error");
        setCurrentPin("");
      }
    }
  };

  const handleSubmit = async () => {
    if (isVerifyingCurrent) {
      handleVerifyCurrentPin();
      return;
    }

    if (!isConfirming) {
      if (pin.length === pinLength) {
        setIsConfirming(true);
      }
    } else {
      if (confirmPin === pin) {
        try {
          await setPIN(pin, pinLength);
          showToast(
            hasExistingPin
              ? "PIN changed successfully"
              : "PIN set successfully",
            "success"
          );

          // If biometric should be enabled after PIN setup
          if (enableBiometricAfterSetup) {
            // Navigate back to settings, which will handle biometric enable
            navigation.goBack();
            // Small delay to ensure navigation completes
            setTimeout(() => {
              Alert.alert(
                "Enable Biometrics",
                "PIN set successfully. You can now enable biometric authentication in Settings.",
                [{ text: "OK" }]
              );
            }, 500);
          } else {
            navigation.goBack();
          }
        } catch (error: any) {
          showToast(error.message || "Failed to set PIN", "error");
        }
      } else {
        showToast("PINs do not match", "error");
        setConfirmPin("");
        setIsConfirming(false);
        setPin("");
      }
    }
  };

  const handleDisablePin = async () => {
    Alert.alert(
      "Disable PIN",
      "Are you sure you want to disable PIN lock? This will also disable biometric authentication.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePIN();
              await disableBiometric();
              showToast("PIN disabled", "success");
              navigation.goBack();
            } catch (error: any) {
              showToast(error.message || "Failed to disable PIN", "error");
            }
          },
        },
      ]
    );
  };

  const togglePINLength = () => {
    const newLength: PINLength = pinLength === 4 ? 6 : 4;
    setPinLength(newLength);
    // Reset PIN entry when changing length
    setPin("");
    setConfirmPin("");
    setIsConfirming(false);
  };

  React.useEffect(() => {
    if (isVerifyingCurrent && currentPin.length === pinLength) {
      handleVerifyCurrentPin();
    } else if (
      pin.length === pinLength &&
      !isConfirming &&
      !isVerifyingCurrent
    ) {
      handleSubmit();
    } else if (confirmPin.length === pinLength && isConfirming) {
      handleSubmit();
    }
  }, [pin, confirmPin, currentPin, pinLength]);

  const displayPin = isVerifyingCurrent
    ? currentPin
    : isConfirming
    ? confirmPin
    : pin;

  const getTitle = () => {
    if (isVerifyingCurrent) return "Enter Current PIN";
    if (isConfirming) return "Confirm PIN";
    return hasExistingPin ? "Set New PIN" : "Set PIN";
  };

  const getSubtitle = () => {
    if (isVerifyingCurrent) return "Enter your current PIN to continue";
    if (isConfirming) return `Enter your ${pinLength}-digit PIN again`;
    return hasExistingPin
      ? `Create a new ${pinLength}-digit PIN`
      : `Create a ${pinLength}-digit PIN`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={hasExistingPin ? "Change PIN" : "Set PIN"} />
      <View style={styles.content}>
        <Ionicons name="lock-closed" size={48} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>{getTitle()}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {getSubtitle()}
        </Text>

        {/* PIN Length Toggle - only show when setting new PIN */}
        {!hasExistingPin && !isConfirming && !isVerifyingCurrent && (
          <TouchableOpacity
            onPress={togglePINLength}
            style={[styles.lengthToggle, { borderColor: colors.cardBorder }]}
          >
            <Text style={[styles.lengthToggleText, { color: colors.primary }]}>
              Use {pinLength === 4 ? "6" : "4"}-digit PIN instead
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.dotsContainer}>
          {Array.from({ length: pinLength }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    displayPin.length > i ? colors.primary : colors.inputBorder,
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
      {hasExistingPin && !isVerifyingCurrent && (
        <TouchableOpacity
          onPress={handleDisablePin}
          style={styles.disableButton}
        >
          <Text style={[styles.disableText, { color: colors.danger }]}>
            Disable PIN
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: { fontSize: 28, fontWeight: "700", marginTop: 20, marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: "center", marginBottom: 16 },
  lengthToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  lengthToggleText: { fontSize: 14, fontWeight: "600" },
  dotsContainer: { flexDirection: "row", gap: 16, marginTop: 40 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  keyText: { fontSize: 28, fontWeight: "600" },
  disableButton: { alignItems: "center", paddingVertical: 20 },
  disableText: { fontSize: 14, fontWeight: "600" },
});
