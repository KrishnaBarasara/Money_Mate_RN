import React, { useState, useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as SecureStore from "expo-secure-store";
import PINLockScreen from "../screens/PINLockScreen";
import { useAuth } from "../context/AuthContext";

type Props = {
  children: React.ReactNode;
};

const LAST_UNLOCK_KEY = "lastUnlockTimestamp";
const BACKGROUND_UNLOCK_VALIDITY_MS = 30000; // 30 seconds for background transitions
const MOUNT_UNLOCK_VALIDITY_MS = 1000; // 1 second for app mount (very strict)

export default function LockManager({ children }: Props) {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const isFromBackground = useRef(false);

  // Track if this is the first mount after login
  const isFirstMountAfterLogin = useRef(true);

  // Check lock status on mount and when user changes
  useEffect(() => {
    if (!user) {
      setIsLocked(false);
      setIsChecking(false);
      isFirstMountAfterLogin.current = true;
      return;
    }

    const checkLockStatus = async (isMount: boolean = false) => {
      setIsChecking(true);
      const pin = await SecureStore.getItemAsync("userPin");
      
      // Only lock if PIN is enabled
      if (pin) {
        const lastUnlock = await SecureStore.getItemAsync(LAST_UNLOCK_KEY);
        const now = Date.now();
        
        if (isMount) {
          // On mount (app killed/reopened or fresh login):
          // - If first mount after login: Set timestamp and don't lock
          // - If timestamp exists but expired: Lock (app was killed)
          // - If timestamp is recent: Don't lock (very recent unlock)
          if (isFirstMountAfterLogin.current) {
            // Fresh login - set timestamp and don't lock
            await SecureStore.setItemAsync(LAST_UNLOCK_KEY, now.toString());
            setIsLocked(false);
            isFirstMountAfterLogin.current = false;
          } else if (!lastUnlock) {
            // No timestamp but not first mount - set timestamp and don't lock
            await SecureStore.setItemAsync(LAST_UNLOCK_KEY, now.toString());
            setIsLocked(false);
          } else {
            const timeSinceUnlock = now - parseInt(lastUnlock);
            if (timeSinceUnlock > MOUNT_UNLOCK_VALIDITY_MS) {
              // Timestamp expired - lock (app was killed)
              setIsLocked(true);
            } else {
              // Timestamp is recent - don't lock
              setIsLocked(false);
            }
          }
        } else {
          // From background: Use more lenient validity window
          if (!lastUnlock || now - parseInt(lastUnlock) > BACKGROUND_UNLOCK_VALIDITY_MS) {
            setIsLocked(true);
          } else {
            setIsLocked(false);
          }
        }
      } else {
        setIsLocked(false);
      }
      setIsChecking(false);
    };

    // On mount, always check (app might have been killed)
    checkLockStatus(true);

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      // Track if app was in background
      if (appState.current.match(/inactive|background/)) {
        isFromBackground.current = true;
      }
      
      // Lock when app comes back from background to active
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        checkLockStatus(false); // false = from background, not mount
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user]);

  const handleUnlock = async () => {
    // Save unlock timestamp
    await SecureStore.setItemAsync(LAST_UNLOCK_KEY, Date.now().toString());
    setIsLocked(false);
  };

  // Reset first mount flag and clear data when user logs out
  useEffect(() => {
    if (!user) {
      SecureStore.deleteItemAsync(LAST_UNLOCK_KEY).catch(() => {});
      SecureStore.deleteItemAsync("biometricEnabled").catch(() => {});
      isFirstMountAfterLogin.current = true;
    } else {
      // When user logs in, set timestamp immediately to prevent lock on first mount
      SecureStore.setItemAsync(LAST_UNLOCK_KEY, Date.now().toString()).catch(() => {});
    }
  }, [user]);

  // Show loading while checking lock status
  if (isChecking) {
    return <>{children}</>;
  }

  // Don't show lock screen if user is not logged in or lock is not needed
  if (!user || !isLocked) {
    return <>{children}</>;
  }

  return <PINLockScreen onUnlock={handleUnlock} />;
}

