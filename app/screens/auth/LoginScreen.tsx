import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { useThemeColors } from "../../context/ThemeContext";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

const REMEMBER_ME_KEY = "rememberedEmail";

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { colors } = useThemeColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Load remembered email on mount
  useEffect(() => {
    loadRememberedEmail();
  }, []);

  // Prevent keyboard issues on mount (especially after navigation)
  useEffect(() => {
    // Dismiss any existing keyboard
    Keyboard.dismiss();

    // Small delay to ensure screen is fully rendered before allowing interactions
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);

    return () => {
      clearTimeout(timer);
      Keyboard.dismiss();
    };
  }, []);

  const loadRememberedEmail = async () => {
    try {
      const rememberedEmail = await SecureStore.getItemAsync(REMEMBER_ME_KEY);
      if (rememberedEmail) {
        setEmail(rememberedEmail);
        setRememberMe(true);
      }
    } catch (error) {
      console.error("Error loading remembered email:", error);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");

    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email");
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    return isValid;
  };

  const handleRememberMeToggle = async () => {
    const newValue = !rememberMe;
    setRememberMe(newValue);

    try {
      if (newValue) {
        // Save email when remember me is enabled
        if (email.trim()) {
          await SecureStore.setItemAsync(REMEMBER_ME_KEY, email.trim());
        }
      } else {
        // Clear saved email when remember me is disabled
        await SecureStore.deleteItemAsync(REMEMBER_ME_KEY);
      }
    } catch (error) {
      console.error("Error saving remember me preference:", error);
    }
  };

  const onLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
      
      // Handle remember me functionality
      if (rememberMe) {
        // Save email to secure storage
        await SecureStore.setItemAsync(REMEMBER_ME_KEY, email.trim());
      } else {
        // Remove saved email if remember me is unchecked
        await SecureStore.deleteItemAsync(REMEMBER_ME_KEY);
      }
    } catch (error: any) {
      let message = "Please check your credentials and try again.";
      if (error.code === "auth/user-not-found") {
        message = "No account found with this email.";
      } else if (error.code === "auth/wrong-password") {
        message = "Incorrect password.";
      } else if (error.code === "auth/too-many-requests") {
        message = "Too many failed attempts. Please try again later.";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address.";
      }
      Alert.alert("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        style={[styles.root, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View>
          {/* Hero Section */}
          <View style={styles.hero}>
            <View
              style={[
                styles.logoContainer,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Ionicons name="wallet" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>
              MoneyMate
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Manage your finances with ease
            </Text>
          </View>

          {/* Login Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Welcome Back
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.muted }]}>
              Sign in to your account to continue
            </Text>

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: emailError
                      ? colors.danger
                      : colors.inputBorder,
                  },
                ]}
              >
                <Ionicons
                  name="mail"
                  size={20}
                  color={emailError ? colors.danger : colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={emailInputRef}
                  placeholder="Email address"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={(text: string) => {
                    setEmail(text);
                    if (emailError) setEmailError("");
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  autoFocus={false}
                  style={[styles.input, { color: colors.text }]}
                  selectionColor={colors.primary}
                  underlineColorAndroid="transparent"
                  editable={isMounted}
                  blurOnSubmit={false}
                />
              </View>
              {emailError ? (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {emailError}
                </Text>
              ) : null}
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: passwordError
                      ? colors.danger
                      : colors.inputBorder,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={passwordError ? colors.danger : colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={passwordInputRef}
                  placeholder="Password"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={(text: string) => {
                    setPassword(text);
                    if (passwordError) setPasswordError("");
                  }}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  autoFocus={false}
                  style={[styles.input, { color: colors.text, flex: 1 }]}
                  selectionColor={colors.primary}
                  underlineColorAndroid="transparent"
                  editable={isMounted}
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {passwordError}
                </Text>
              ) : null}
            </View>

            {/* Remember Me and Forgot Password Row */}
            <View style={styles.rememberForgotRow}>
              <TouchableOpacity
                onPress={handleRememberMeToggle}
                style={styles.rememberMeContainer}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: rememberMe
                        ? colors.primary
                        : "transparent",
                      borderColor: rememberMe
                        ? colors.primary
                        : colors.inputBorder,
                    },
                  ]}
                >
                  {rememberMe && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={[styles.rememberMeText, { color: colors.text }]}>
                  Remember Me
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword")}
                style={styles.forgotPassword}
              >
                <Text
                  style={[styles.forgotPasswordText, { color: colors.primary }]}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={onLogin}
              disabled={loading}
              activeOpacity={0.8}
              style={[
                styles.loginButton,
                { backgroundColor: colors.primary },
                loading && { opacity: 0.7 },
              ]}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.loginButtonText}>Signing in...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="log-in" size={20} color="#fff" />
                  <Text style={styles.loginButtonText}>Sign In</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <TouchableOpacity
              onPress={() => navigation.navigate("Register")}
              style={styles.registerButton}
            >
              <Text style={[styles.registerButtonText, { color: colors.text }]}>
                Don't have an account?{" "}
                <Text style={{ color: colors.primary, fontWeight: "700" }}>
                  Sign Up
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  contentContainer: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  hero: { alignItems: "center", marginBottom: 40 },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  appName: { fontSize: 36, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: "center" },
  card: { borderRadius: 24, padding: 24, borderWidth: 1 },
  cardTitle: { fontSize: 28, fontWeight: "800", marginBottom: 8 },
  cardSubtitle: { fontSize: 14, marginBottom: 32 },
  fieldGroup: { marginBottom: 20 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1.5,
    minHeight: 52,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, paddingVertical: 14 },
  eyeIcon: { padding: 4 },
  errorText: { fontSize: 12, marginTop: 6, marginLeft: 4 },
  rememberForgotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: -8,
    marginBottom: 8,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  rememberMeText: { fontSize: 14, fontWeight: "500" },
  forgotPassword: {},
  forgotPasswordText: { fontSize: 14, fontWeight: "600" },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  loadingContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  buttonContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  registerButton: { alignItems: "center" },
  registerButtonText: { fontSize: 14, marginTop: 24 },
});
