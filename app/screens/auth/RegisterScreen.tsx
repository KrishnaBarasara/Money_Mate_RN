import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { useThemeColors } from "../../context/ThemeContext";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { Ionicons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const { colors } = useThemeColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password);
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.hero}>
          <View style={[styles.logoContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="person-add" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Join MoneyMate and start managing your finances</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Sign Up</Text>
          <Text style={[styles.cardSubtitle, { color: colors.muted }]}>Create your account to get started</Text>

          <View style={styles.fieldGroup}>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <Ionicons name="mail" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput placeholder="Email address" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={[styles.input, { color: colors.text }]} />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <Ionicons name="lock-closed" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput placeholder="Password" placeholderTextColor={colors.muted} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} style={[styles.input, { color: colors.text, flex: 1 }]} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <Ionicons name="lock-closed" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput placeholder="Confirm password" placeholderTextColor={colors.muted} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} style={[styles.input, { color: colors.text, flex: 1 }]} />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={onRegister} disabled={loading} style={[styles.button, { backgroundColor: colors.primary }]}>
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.buttonText}>{loading ? "Creating..." : "Sign Up"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.linkButton}>
            <Text style={[styles.linkText, { color: colors.text }]}>
              Already have an account? <Text style={{ color: colors.primary, fontWeight: "700" }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  contentContainer: { padding: 24, paddingTop: 60 },
  backButton: { marginBottom: 20 },
  hero: { alignItems: "center", marginBottom: 40 },
  logoContainer: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center", marginBottom: 24 },
  appName: { fontSize: 32, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: "center" },
  card: { borderRadius: 24, padding: 24, borderWidth: 1 },
  cardTitle: { fontSize: 28, fontWeight: "800", marginBottom: 8 },
  cardSubtitle: { fontSize: 14, marginBottom: 32 },
  fieldGroup: { marginBottom: 20 },
  inputContainer: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 16, borderWidth: 1.5, minHeight: 52 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, paddingVertical: 14 },
  eyeIcon: { padding: 4 },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 12, gap: 8, marginTop: 8 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  linkButton: { alignItems: "center", marginTop: 24 },
  linkText: { fontSize: 14 },
});
