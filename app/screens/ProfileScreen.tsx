import React, { useState, useEffect } from "react";
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
import { useLanguage } from "../context/LanguageContext";
import ScreenHeader from "../components/ScreenHeader";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeColors();
  const {
    getUserProfile,
    updateProfile,
  } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await getUserProfile();
      if (profile) {
        setUsername(profile.username || "");
        setBio(profile.bio || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      showToast(t("profile.usernameRequired"), "error");
      return;
    }
    setLoading(true);
    try {
      await updateProfile({ username: username.trim(), bio: bio.trim() });
      showToast(t("profile.profileUpdated"), "success");
      navigation.goBack();
    } catch (error: any) {
      showToast(error.message || t("profile.failedToUpdateProfile"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t("profile.title")} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info Card */}
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
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Ionicons name="person" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t("profile.profileInfo")}
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.muted }]}>{t("profile.username")}</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.inputBorder,
                backgroundColor: colors.inputBackground,
              },
            ]}
            placeholder={t("profile.yourName")}
            placeholderTextColor={colors.muted}
          />

          <Text style={[styles.label, { color: colors.muted }]}>{t("profile.bio")}</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            style={[
              styles.input,
              styles.bioInput,
              {
                color: colors.text,
                borderColor: colors.inputBorder,
                backgroundColor: colors.inputBackground,
              },
            ]}
            placeholder={t("profile.writeAboutYourself")}
            placeholderTextColor={colors.muted}
          />

          <TouchableOpacity
            onPress={handleSaveProfile}
            disabled={loading}
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}>{t("profile.saveProfile")}</Text>
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  bioInput: { height: 90, textAlignVertical: "top", paddingTop: 14 },
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
