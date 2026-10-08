import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors, useTheme } from "../context/ThemeContext";
import { useCurrency } from "../context/CurrencyContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { CURRENCIES } from "../utils/constants";
import { clearAllUserData } from "../services/dataClearService";
import { MainStackParamList } from "../navigation/TabNavigator";
import ScreenHeader from "../components/ScreenHeader";
import * as SecureStore from "expo-secure-store";
import {
  isBiometricEnabled,
  enableBiometric,
  disableBiometric,
  canEnableBiometric,
  isBiometricSupported,
  isBiometricEnrolled,
  authenticateWithBiometrics,
} from "../services/biometricService";
import { hasPIN, verifyPIN } from "../services/pinService";

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark, setTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { currency, setCurrency } = useCurrency();
  const { user, deleteAccount, logout } = useAuth();
  const { showToast } = useToast();
  const { t, getCurrentLanguageName } = useLanguage();

  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [pinExists, setPinExists] = useState(false);

  // Load biometric status on mount and when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      checkBiometricStatus();
    }, [])
  );

  const checkBiometricStatus = async () => {
    try {
      const [enabled, supported, enrolled, pin] = await Promise.all([
        isBiometricEnabled(),
        isBiometricSupported(),
        isBiometricEnrolled(),
        hasPIN(),
      ]);
      setBiometricEnabled(enabled);
      setPinExists(pin);
      // Biometric is available only if hardware supports it, enrolled, AND PIN exists
      setBiometricAvailable(supported && enrolled && pin);

      // Log for debugging
      console.log("Biometric status check:", {
        enabled,
        supported,
        enrolled,
        pinExists: pin,
        available: supported && enrolled && pin,
      });
    } catch (error) {
      console.error("Error checking biometric status:", error);
      setBiometricAvailable(false);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    // Prevent multiple simultaneous toggles
    if (biometricLoading) {
      return;
    }

    if (!value) {
      // Disabling biometric - require PIN verification
      Alert.alert(
        "Disable Biometrics",
        "Please enter your PIN to disable biometric authentication.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            onPress: () => {
              // Navigate to PIN verify screen
              navigation.navigate("PINVerify" as any, {
                title: "Disable Biometrics",
                subtitle: "Enter your PIN to disable biometric authentication",
                onVerifySuccess: async () => {
                  try {
                    await disableBiometric();
                    setBiometricEnabled(false);
                    showToast("Biometric authentication disabled", "success");
                    navigation.goBack();
                  } catch (error: any) {
                    console.error("Error disabling biometric:", error);
                    showToast(
                      error.message || "Failed to disable biometric",
                      "error"
                    );
                    // Revert toggle state on error
                    setBiometricEnabled(true);
                  }
                },
              });
            },
          },
        ]
      );
      return;
    }

    // Enabling biometric
    setBiometricLoading(true);
    try {
      // First check if PIN exists (mandatory requirement)
      const pin = await hasPIN();
      if (!pin) {
        Alert.alert(
          "PIN Required",
          "You must set a PIN before enabling biometric authentication. Would you like to set a PIN now?",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => setBiometricLoading(false),
            },
            {
              text: "Set PIN",
              onPress: () => {
                setBiometricLoading(false);
                // Navigate to PIN setup with flag to enable biometric after
                navigation.navigate("PINSetup" as any, {
                  enableBiometricAfterSetup: true,
                });
              },
            },
          ]
        );
        return;
      }

      // Check if it can be enabled (hardware + enrollment)
      const { canEnable, reason } = await canEnableBiometric();
      if (!canEnable) {
        Alert.alert(
          "Cannot Enable Biometrics",
          reason || "Biometric authentication cannot be enabled.",
          [{ text: "OK", onPress: () => setBiometricLoading(false) }]
        );
        return;
      }

      // Try to authenticate to enable biometric
      const result = await authenticateWithBiometrics(
        "Authenticate to enable biometric login"
      );

      if (result.success) {
        await enableBiometric();
        setBiometricEnabled(true);
        setBiometricAvailable(true);
        showToast("Biometric authentication enabled", "success");
      } else {
        // Revert toggle state on failure
        setBiometricEnabled(false);

        if (result.errorCode === "USER_CANCEL") {
          // User cancelled - no need to show error
          console.log("User cancelled biometric authentication");
        } else {
          Alert.alert(
            "Authentication Failed",
            result.error || "Failed to authenticate. Please try again.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (error: any) {
      console.error("Error enabling biometric:", error);
      // Revert toggle state on error
      setBiometricEnabled(false);
      Alert.alert(
        "Error",
        error.message || "Failed to enable biometric authentication",
        [{ text: "OK" }]
      );
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!password) {
      showToast(t("modals.enterPassword"), "error");
      return;
    }
    setLoading(true);
    try {
      await deleteAccount(password);
      showToast(t("modals.deleteAccount"), "success");
    } catch (error: any) {
      showToast(error.message || t("modals.deleteAccount"), "error");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setPassword("");
    }
  };

  const handleClearData = async () => {
    if (!password) {
      showToast(t("modals.enterPassword"), "error");
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      const result = await clearAllUserData(user.uid);
      if (result.success) {
        showToast(t("modals.clearAllData"), "success");
      } else {
        showToast(result.error || t("modals.clearAllData"), "error");
      }
    } catch (error: any) {
      showToast(error.message || t("modals.clearAllData"), "error");
    } finally {
      setLoading(false);
      setShowClearModal(false);
      setPassword("");
    }
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    value,
    onPress,
    rightComponent,
    iconColor,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    iconColor?: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.settingItem, { borderColor: colors.cardBorder }]}
      disabled={!onPress && !rightComponent}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${iconColor || colors.primary}15` },
          ]}
        >
          <Ionicons
            name={icon as any}
            size={20}
            color={iconColor || colors.primary}
          />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent ||
          (value && (
            <Text style={[styles.settingValue, { color: colors.muted }]}>
              {value}
            </Text>
          ))}
        {onPress && !rightComponent && (
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t("settings.title")} showBack={false} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <Text
          style={[
            styles.sectionTitle,
            styles.firstSectionTitle,
            { color: colors.muted },
          ]}
        >
          {t("settings.profile")}
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <SettingItem
            icon="person"
            title={t("settings.profile")}
            subtitle={t("settings.profileSubtitle")}
            onPress={() => navigation.navigate("Profile")}
            iconColor={colors.primary}
          />
        </View>

        {/* Security Section */}
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>
          Security
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <SettingItem
            icon="finger-print"
            title="Biometric Authentication"
            subtitle={
              !pinExists
                ? "Set a PIN first to enable biometric authentication"
                : !biometricAvailable
                ? "Biometric authentication is not available on this device"
                : "Use Face ID, Touch ID, or Fingerprint to unlock"
            }
            rightComponent={
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                disabled={biometricLoading || !pinExists}
                trackColor={{ true: colors.primary, false: colors.inputBorder }}
                thumbColor="#fff"
              />
            }
            iconColor={colors.success}
          />
          <SettingItem
            icon="keypad"
            title="PIN Lock"
            subtitle={
              pinExists
                ? "Change or disable your PIN"
                : "Set a PIN for app security"
            }
            onPress={() => navigation.navigate("PINSetup" as any)}
            iconColor={colors.warning}
          />
          <SettingItem
            icon="lock-closed"
            title="Change Password"
            subtitle="Update your account password"
            onPress={() => navigation.navigate("ChangePassword")}
            iconColor={colors.warning}
          />
        </View>

        {/* Appearance Section */}
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>
          {t("settings.appearance")}
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <SettingItem
            icon="moon"
            title={t("settings.darkMode")}
            subtitle={t("settings.darkModeSubtitle")}
            rightComponent={
              <Switch
                value={isDark}
                onValueChange={(v) => setTheme(v ? "dark" : "light")}
                trackColor={{ true: colors.primary, false: colors.inputBorder }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* Preferences Section */}
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>
          {t("settings.preferences")}
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <SettingItem
            icon="cash"
            title={t("settings.currency")}
            subtitle={t("settings.currencySubtitle")}
            value={currency}
            onPress={() => setShowCurrencyModal(true)}
          />
          <SettingItem
            icon="language"
            title={t("settings.language")}
            subtitle={t("settings.languageSubtitle")}
            value={getCurrentLanguageName()}
            onPress={() => navigation.navigate("LanguageSelection")}
            iconColor={colors.success}
          />
        </View>

        {/* Features Section */}
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>
          {t("settings.features")}
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <SettingItem
            icon="repeat"
            title={t("settings.recurringExpenses")}
            subtitle={t("settings.recurringExpensesSubtitle")}
            onPress={() => navigation.navigate("RecurringExpenses")}
          />
          <SettingItem
            icon="notifications"
            title={t("settings.billReminders")}
            subtitle={t("settings.billRemindersSubtitle")}
            onPress={() => navigation.navigate("BillReminders")}
            iconColor={colors.warning}
          />
          <SettingItem
            icon="stats-chart"
            title={t("settings.reports")}
            subtitle={t("settings.reportsSubtitle")}
            onPress={() => navigation.navigate("Reports")}
            iconColor={colors.success}
          />
          <SettingItem
            icon="bulb"
            title={t("settings.insights")}
            subtitle={t("settings.insightsSubtitle")}
            onPress={() => navigation.navigate("Insights")}
            iconColor="#9026dc"
          />
        </View>

        {/* Data Section */}
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>
          {t("settings.data")}
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <SettingItem
            icon="download"
            title={t("settings.exportData")}
            subtitle={t("settings.exportDataSubtitle")}
            onPress={() => navigation.navigate("Export")}
          />
        </View>

        {/* Account Section */}
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>
          {t("settings.account")}
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              Alert.alert(t("settings.logout"), t("modals.logoutConfirm"), [
                { text: t("common.cancel"), style: "cancel" },
                {
                  text: t("settings.logout"),
                  style: "destructive",
                  onPress: logout,
                },
              ]);
            }}
            style={[
              styles.accountButton,
              { backgroundColor: `${colors.danger}15` },
            ]}
          >
            <Ionicons name="log-out" size={20} color={colors.danger} />
            <Text style={[styles.accountButtonText, { color: colors.danger }]}>
              {t("settings.logout")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, { color: colors.danger }]}>
          {t("settings.dangerZone")}
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <TouchableOpacity
            onPress={() => setShowClearModal(true)}
            style={[
              styles.dangerButton,
              { backgroundColor: "rgba(220, 38, 38, 0.7)" },
            ]}
          >
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.dangerText}>{t("settings.clearAllData")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowDeleteModal(true)}
            style={[
              styles.dangerButton,
              { backgroundColor: "rgba(220, 38, 38, 0.7)", marginTop: 12 },
            ]}
          >
            <Ionicons name="person-remove" size={20} color="#fff" />
            <Text style={styles.dangerText}>{t("settings.deleteAccount")}</Text>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <Text style={[styles.versionText, { color: colors.muted }]}>
          {t("settings.version")}
        </Text>
      </ScrollView>

      {/* Currency Modal */}
      <Modal
        visible={showCurrencyModal}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
                paddingBottom: Math.max(insets.bottom, 24),
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("modals.selectCurrency")}
            </Text>
            <ScrollView style={{ maxHeight: 350 }}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  onPress={() => {
                    setCurrency(c.code);
                    setShowCurrencyModal(false);
                    showToast(`Currency changed to ${c.code}`, "success");
                  }}
                  style={[
                    styles.currencyItem,
                    currency === c.code && {
                      backgroundColor: colors.primaryLight,
                    },
                  ]}
                >
                  <Text style={[styles.currencySymbol, { color: colors.text }]}>
                    {c.symbol}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.currencyCode, { color: colors.text }]}>
                      {c.code}
                    </Text>
                    <Text
                      style={[styles.currencyName, { color: colors.muted }]}
                    >
                      {c.name}
                    </Text>
                  </View>
                  {currency === c.code && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowCurrencyModal(false)}
              style={[styles.closeButton, { borderColor: colors.cardBorder }]}
            >
              <Text style={{ color: colors.text }}>{t("common.cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Clear Data Confirmation Modal */}
      <Modal
        visible={showClearModal}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
                paddingBottom: Math.max(insets.bottom, 24),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View
                style={[styles.warningIcon, { backgroundColor: "#FEE2E2" }]}
              >
                <Ionicons name="warning" size={32} color="#DC2626" />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t("modals.clearAllData")}
              </Text>
            </View>
            <Text style={[styles.modalText, { color: colors.muted }]}>
              {t("modals.clearDataWarning")}
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder={t("modals.enterPassword")}
              placeholderTextColor={colors.muted}
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.inputBackground,
                },
              ]}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setShowClearModal(false);
                  setPassword("");
                }}
                style={[styles.modalButton, { borderColor: colors.cardBorder }]}
              >
                <Text style={{ color: colors.text }}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClearData}
                disabled={loading}
                style={[styles.modalButton, { backgroundColor: "#DC2626" }]}
              >
                <Text style={{ color: "#fff" }}>
                  {loading ? t("modals.clearing") : t("settings.clearAllData")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
                paddingBottom: Math.max(insets.bottom, 24),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View
                style={[styles.warningIcon, { backgroundColor: "#FEE2E2" }]}
              >
                <Ionicons name="person-remove" size={32} color="#B91C1C" />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t("modals.deleteAccount")}
              </Text>
            </View>
            <Text style={[styles.modalText, { color: colors.muted }]}>
              {t("modals.deleteAccountWarning")}
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder={t("modals.enterPassword")}
              placeholderTextColor={colors.muted}
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.inputBackground,
                },
              ]}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setShowDeleteModal(false);
                  setPassword("");
                }}
                style={[styles.modalButton, { borderColor: colors.cardBorder }]}
              >
                <Text style={{ color: colors.text }}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={loading}
                style={[styles.modalButton, { backgroundColor: "#B91C1C" }]}
              >
                <Text style={{ color: "#fff" }}>
                  {loading ? t("modals.deleting") : t("settings.deleteAccount")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 10, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  firstSectionTitle: {
    marginTop: 0,
  },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  settingContent: { flex: 1 },
  settingRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  settingTitle: { fontSize: 16, fontWeight: "500" },
  settingSubtitle: { fontSize: 12, marginTop: 2 },
  settingValue: { fontSize: 14 },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    margin: 16,
  },
  dangerText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  versionText: { textAlign: "center", marginTop: 24, fontSize: 12 },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
    minHeight: "40%",
  },
  modalHeader: { alignItems: "center", marginBottom: 16 },
  warningIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 22, fontWeight: "700" },
  modalText: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  closeButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    marginTop: 12,
  },
  currencyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  currencySymbol: { fontSize: 24, fontWeight: "700", width: 50 },
  currencyCode: { fontSize: 16, fontWeight: "600" },
  currencyName: { fontSize: 12 },
  accountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  accountButtonText: { fontSize: 16, fontWeight: "600" },
});
