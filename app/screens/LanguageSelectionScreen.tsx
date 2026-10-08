import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";
import { useLanguage, Language } from "../context/LanguageContext";
import { MainStackParamList } from "../navigation/TabNavigator";
import ScreenHeader from "../components/ScreenHeader";

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const languages: { code: Language; name: string; nativeName: string; flag: string }[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
];

export default function LanguageSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useThemeColors();
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageSelect = async (lang: Language) => {
    await setLanguage(lang);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t("languageSelection.title")} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {t("languageSelection.subtitle")}
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          {languages.map((lang, index) => {
            const isSelected = language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleLanguageSelect(lang.code)}
                style={[
                  styles.languageItem,
                  index !== languages.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.cardBorder,
                  },
                  isSelected && {
                    backgroundColor: colors.primaryLight,
                  },
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.languageLeft}>
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <View style={styles.languageInfo}>
                    <Text style={[styles.languageName, { color: colors.text }]}>
                      {lang.nativeName}
                    </Text>
                    <Text style={[styles.languageEnglish, { color: colors.muted }]}>
                      {lang.name}
                    </Text>
                  </View>
                </View>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.currentLanguageText, { color: colors.muted }]}>
          {t("languageSelection.currentLanguage")}: {t("languageName")}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 20,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  languageLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  flag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  languageEnglish: {
    fontSize: 13,
  },
  currentLanguageText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
});

