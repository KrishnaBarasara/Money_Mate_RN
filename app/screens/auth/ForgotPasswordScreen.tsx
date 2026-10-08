import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { useThemeColors } from "../../context/ThemeContext";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { Ionicons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { resetPassword } = useAuth();
  const { colors } = useThemeColors();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      Alert.alert("Success", "Password reset email sent. Please check your inbox.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.hero}>
        <View style={[styles.logoContainer, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name="key" size={48} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Forgot Password?</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Enter your email and we'll send you instructions to reset your password</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
          <Ionicons name="mail" size={20} color={colors.primary} style={styles.inputIcon} />
          <TextInput placeholder="Email address" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={[styles.input, { color: colors.text }]} />
        </View>

        <TouchableOpacity onPress={onResetPassword} disabled={loading} style={[styles.button, { backgroundColor: colors.primary }]}>
          <Ionicons name="send" size={20} color="#fff" />
          <Text style={styles.buttonText}>{loading ? "Sending..." : "Send Reset Link"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkButton}>
          <Text style={[styles.linkText, { color: colors.primary }]}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  contentContainer: { padding: 24, paddingTop: 60 },
  backButton: { marginBottom: 20 },
  hero: { alignItems: "center", marginBottom: 40 },
  logoContainer: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  card: { borderRadius: 24, padding: 24, borderWidth: 1 },
  inputContainer: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 16, borderWidth: 1.5, minHeight: 52, marginBottom: 20 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, paddingVertical: 14 },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 12, gap: 8 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  linkButton: { alignItems: "center", marginTop: 24 },
  linkText: { fontSize: 14, fontWeight: "600" },
});
