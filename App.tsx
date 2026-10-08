import React, { useEffect, useState, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider, useAuth } from "./app/context/AuthContext";
import { ThemeProvider, useTheme } from "./app/context/ThemeContext";
import { CurrencyProvider } from "./app/context/CurrencyContext";
import { CategoryProvider } from "./app/context/CategoryContext";
import { TransactionProvider } from "./app/context/TransactionContext";
import { RecurringExpenseProvider } from "./app/context/RecurringExpenseContext";
import { BillReminderProvider } from "./app/context/BillReminderContext";
import { BudgetProvider } from "./app/context/BudgetContext";
import { ToastProvider } from "./app/context/ToastContext";
import { LanguageProvider } from "./app/context/LanguageContext";
import AuthNavigator from "./app/navigation/AuthNavigator";
import MainNavigator from "./app/navigation/TabNavigator";
import PINLockComponent from "./app/components/PINLockComponent";
import { View, ActivityIndicator, Text, AppState, AppStateStatus } from "react-native";
import {
  isBiometricEnabled,
  authenticateWithBiometrics,
} from "./app/services/biometricService";
import { hasPIN } from "./app/services/pinService";

function AppContent() {
  const { user, loading } = useAuth();
  const { isDark, colors } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [showPINVerify, setShowPINVerify] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const authPromptedRef = useRef(false);
  const lastBackgroundTimeRef = useRef<number | null>(null);

  // Authenticate user (biometric first, then PIN fallback)
  const authenticateUser = async (isAppStart: boolean = false) => {
    // Only check if user is logged in
    if (!user) {
      setIsAuthenticated(true);
      return;
    }

    // Check if PIN exists (mandatory for app lock)
    const pinExists = await hasPIN();
    if (!pinExists) {
      // No PIN set, allow access
      setIsAuthenticated(true);
      return;
    }

    setIsCheckingAuth(true);

    try {
      // Check if biometric is enabled
      const biometricEnabled = await isBiometricEnabled();
      
      if (biometricEnabled) {
        // Try biometric authentication first
        const result = await authenticateWithBiometrics(
          "Authenticate to access your account"
        );

        if (result.success) {
          // Biometric success
          setIsAuthenticated(true);
          setIsCheckingAuth(false);
          return;
        } else {
          // Biometric failed or cancelled - always fallback to app's PIN screen
          // Note: With disableDeviceFallback: true, users cannot use device PIN
          // They must use the app's PIN that was set in Settings
          setShowPINVerify(true);
          setIsCheckingAuth(false);
          return;
        }
      } else {
        // Biometric not enabled - use PIN directly
        setShowPINVerify(true);
        setIsCheckingAuth(false);
        return;
      }
    } catch (error) {
      console.error("Error during authentication:", error);
      // On error, fallback to PIN
      setShowPINVerify(true);
      setIsCheckingAuth(false);
    }
  };

  // Handle PIN verification success
  const handlePINVerifySuccess = () => {
    setIsAuthenticated(true);
    setShowPINVerify(false);
  };

  // Check authentication on app start when user is loaded
  useEffect(() => {
    if (!loading && user && !authPromptedRef.current) {
      authPromptedRef.current = true;
      authenticateUser(true);
    }
  }, [loading, user]);

  // Reset authentication state when user logs out
  useEffect(() => {
    if (!user) {
      setIsAuthenticated(false);
      setShowPINVerify(false);
      setIsCheckingAuth(false);
      authPromptedRef.current = false;
      lastBackgroundTimeRef.current = null;
    }
  }, [user]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const wasInBackground = appStateRef.current.match(/inactive|background/);
      const isNowActive = nextAppState === "active";

      if (wasInBackground && isNowActive && user && isAuthenticated) {
        // App returned to foreground - check if we need to re-authenticate
        const now = Date.now();
        const timeSinceBackground = lastBackgroundTimeRef.current
          ? now - lastBackgroundTimeRef.current
          : Infinity;

        // Re-authenticate if app was in background for more than 0 seconds
        // (You can adjust this threshold, e.g., 30 seconds, 1 minute, etc.)
        if (timeSinceBackground > 0) {
          setIsAuthenticated(false);
          authPromptedRef.current = false;
          authenticateUser(false);
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App going to background - record time
        lastBackgroundTimeRef.current = Date.now();
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user, isAuthenticated]);

  // Show loading while checking auth
  if (loading || (user && !isAuthenticated && isCheckingAuth && !showPINVerify)) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={{
            marginTop: 16,
            color: colors.muted,
            fontSize: 16,
          }}
        >
          Authenticating...
        </Text>
      </View>
    );
  }

  // Show PIN verify screen if needed
  if (showPINVerify && user && !isAuthenticated) {
    return (
      <PINLockComponent
        title="Unlock App"
        subtitle="Enter your PIN to continue"
        onVerifySuccess={handlePINVerifySuccess}
      />
    );
  }

  // Show main app if authenticated
  if (!user || isAuthenticated) {
    return (
      <>
        <StatusBar style={isDark ? "light" : "dark"} />
        <NavigationContainer>
          {user ? (
            <CategoryProvider>
              <TransactionProvider>
                <RecurringExpenseProvider>
                  <BillReminderProvider>
                    <BudgetProvider>
                      <MainNavigator />
                    </BudgetProvider>
                  </BillReminderProvider>
                </RecurringExpenseProvider>
              </TransactionProvider>
            </CategoryProvider>
          ) : (
            <AuthNavigator />
          )}
        </NavigationContainer>
      </>
    );
  }

  // Fallback loading state
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
        <AuthProvider>
          <CurrencyProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </CurrencyProvider>
        </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
