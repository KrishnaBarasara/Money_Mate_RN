import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = "light" | "dark" | "system";

type ThemeColors = {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  muted: string;
  primary: string;
  primaryLight: string;
  success: string;
  danger: string;
  warning: string;
  inputBackground: string;
  inputBorder: string;
  tabBar: string;
  tabBarBorder: string;
};

type ThemeContextType = {
  theme: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (theme: ThemeMode) => void;
};

const lightColors: ThemeColors = {
  background: "#F9FAFB",
  card: "#FFFFFF",
  cardBorder: "#E5E7EB",
  text: "#1F2937",
  muted: "#6B7280",
  primary: "#6366F1",
  primaryLight: "#E0E7FF",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  inputBackground: "#F3F4F6",
  inputBorder: "#D1D5DB",
  tabBar: "#FFFFFF",
  tabBarBorder: "#E5E7EB",
};

const darkColors: ThemeColors = {
  background: "#0F172A",
  card: "#1E293B",
  cardBorder: "#334155",
  text: "#F1F5F9",
  muted: "#94A3B8",
  primary: "#818CF8",
  primaryLight: "#312E81",
  success: "#34D399",
  danger: "#F87171",
  warning: "#FBBF24",
  inputBackground: "#1E293B",
  inputBorder: "#475569",
  tabBar: "#1E293B",
  tabBarBorder: "#334155",
};

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>("system");

  useEffect(() => {
    // Load saved theme
    AsyncStorage.getItem("theme").then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "system") {
        setThemeState(saved);
      }
    });
  }, []);

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem("theme", newTheme);
  };

  const isDark =
    theme === "dark" || (theme === "system" && systemColorScheme === "dark");

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export const useThemeColors = () => {
  const { colors } = useContext(ThemeContext);
  return { colors };
};
