import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ScreenHeader from "../components/ScreenHeader";

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeColors();
  const { updatePassword } = useAuth();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Please fill all password fields", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password changed successfully", "success");
      navigation.goBack();
    } catch (error: any) {
      showToast(error.message || "Failed to change password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Change Password" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Change Password Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.cardIcon,
                { backgroundColor: `${colors.warning}15` },
              ]}
            >
              <Ionicons name="lock-closed" size={20} color={colors.warning} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Change Password
            </Text>
          </View>

          {/* Current Password */}
          <Text style={[styles.label, { color: colors.muted }]}>
            Current Password
          </Text>
          <View
            style={[
              styles.passwordContainer,
              {
                borderColor: colors.inputBorder,
                backgroundColor: colors.inputBackground,
              },
            ]}
          >
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
              style={[styles.passwordInput, { color: colors.text }]}
              placeholder="Enter current password"
              placeholderTextColor={colors.muted}
            />
            <TouchableOpacity
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showCurrentPassword ? "eye-off" : "eye"}
                size={20}
                color={colors.muted}
              />
            </TouchableOpacity>
          </View>

          {/* New Password */}
          <Text style={[styles.label, { color: colors.muted }]}>
            New Password
          </Text>
          <View
            style={[
              styles.passwordContainer,
              {
                borderColor: colors.inputBorder,
                backgroundColor: colors.inputBackground,
              },
            ]}
          >
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              style={[styles.passwordInput, { color: colors.text }]}
              placeholder="Enter new password"
              placeholderTextColor={colors.muted}
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showNewPassword ? "eye-off" : "eye"}
                size={20}
                color={colors.muted}
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <Text style={[styles.label, { color: colors.muted }]}>
            Confirm New Password
          </Text>
          <View
            style={[
              styles.passwordContainer,
              {
                borderColor: colors.inputBorder,
                backgroundColor: colors.inputBackground,
              },
            ]}
          >
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              style={[styles.passwordInput, { color: colors.text }]}
              placeholder="Confirm new password"
              placeholderTextColor={colors.muted}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color={colors.muted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleChangePassword}
            disabled={loading}
            style={[styles.button, { backgroundColor: colors.warning }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="key" size={20} color="#fff" />
                <Text style={styles.buttonText}>Change Password</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 10 },
  card: {
    width: "100%",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: { fontSize: 18, fontWeight: "700" },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 8, marginTop: 4 },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  eyeBtn: { padding: 8 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

