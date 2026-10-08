import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import translations from "../translations";

export type Language = "en" | "es" | "fr" | "de" | "hi" | "zh" | "ja" | "ar" | "ko";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  getCurrentLanguageName: () => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "app_language";

const getDefaultLanguage = (): Language => {
  // Default to English - user can change it in settings
  // In the future, you can add device locale detection here if needed
  return "en";
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && translations[savedLanguage as Language]) {
        setLanguageState(savedLanguage as Language);
      } else {
        const defaultLang = getDefaultLanguage();
        setLanguageState(defaultLang);
        await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, defaultLang);
      }
    } catch (error) {
      console.log("Error loading language:", error);
      setLanguageState(getDefaultLanguage());
    } finally {
      setIsReady(true);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, lang);
    } catch (error) {
      console.log("Error saving language:", error);
    }
  };

  const t = (key: string): string => {
    if (!isReady) return key;
    const keys = key.split(".");
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found
        value = translations.en;
        for (const k2 of keys) {
          if (value && typeof value === "object" && k2 in value) {
            value = value[k2];
          } else {
            return key;
          }
        }
        break;
      }
    }
    
    return typeof value === "string" ? value : key;
  };

  const getCurrentLanguageName = (): string => {
    return translations[language]?.languageName || "English";
  };

  if (!isReady) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getCurrentLanguageName }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

