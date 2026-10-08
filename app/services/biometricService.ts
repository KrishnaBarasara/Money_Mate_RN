import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { hasPIN } from "./pinService";

const BIOMETRIC_ENABLED_KEY = "biometricEnabled";

export interface BiometricResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

/**
 * Check if biometric authentication is supported on the device
 */
export const isBiometricSupported = async (): Promise<boolean> => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    return compatible;
  } catch (error) {
    console.error("Error checking biometric support:", error);
    return false;
  }
};

/**
 * Check if biometric authentication is enrolled on the device
 */
export const isBiometricEnrolled = async (): Promise<boolean> => {
  try {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error("Error checking biometric enrollment:", error);
    return false;
  }
};

/**
 * Get available authentication types on the device
 */
export const getSupportedAuthenticationTypes =
  async (): Promise<LocalAuthentication.AuthenticationType[]> => {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return types;
    } catch (error) {
      console.error("Error getting supported auth types:", error);
      return [];
    }
  };

/**
 * Authenticate using biometrics (Face ID, Touch ID, or Fingerprint)
 */
export const authenticateWithBiometrics = async (
  promptMessage?: string
): Promise<BiometricResult> => {
  try {
    // Check if hardware is available
    const hasHardware = await isBiometricSupported();
    if (!hasHardware) {
      return {
        success: false,
        error: "Biometric authentication is not supported on this device",
        errorCode: "NOT_SUPPORTED",
      };
    }

    // Check if biometrics are enrolled
    const isEnrolled = await isBiometricEnrolled();
    if (!isEnrolled) {
      return {
        success: false,
        error: "No biometric credentials enrolled. Please set up Face ID, Touch ID, or Fingerprint in your device settings.",
        errorCode: "NOT_ENROLLED",
      };
    }

    // Get supported types for better error messages
    const supportedTypes = await getSupportedAuthenticationTypes();
    const hasFaceId = supportedTypes.includes(
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
    );
    const hasFingerprint = supportedTypes.includes(
      LocalAuthentication.AuthenticationType.FINGERPRINT
    );

    // Determine appropriate prompt message
    const defaultMessage = hasFaceId
      ? "Authenticate with Face ID"
      : hasFingerprint
      ? "Authenticate with Fingerprint"
      : "Authenticate to continue";

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || defaultMessage,
      cancelLabel: "Cancel",
      disableDeviceFallback: true, // Disable device fallback - use app's PIN screen instead
      fallbackLabel: "Use App PIN",
    });

    if (result.success) {
      return { success: true };
    } else {
      // Handle different error cases
      let errorMessage = "Authentication failed";
      let errorCode = "AUTHENTICATION_FAILED";

      if (result.error === "user_cancel") {
        errorMessage = "Authentication cancelled";
        errorCode = "USER_CANCEL";
      } else if (result.error === "user_fallback") {
        errorMessage = "User chose to use PIN";
        errorCode = "USER_FALLBACK";
      } else if (result.error === "system_cancel") {
        errorMessage = "Authentication was cancelled by the system";
        errorCode = "SYSTEM_CANCEL";
      } else if (result.error === "passcode_not_set") {
        errorMessage = "No passcode is set on the device";
        errorCode = "PASSCODE_NOT_SET";
      } else if (result.error === "not_available") {
        errorMessage = "Biometric authentication is not available";
        errorCode = "NOT_AVAILABLE";
      } else if (result.error === "not_enrolled") {
        errorMessage = "No biometric credentials enrolled";
        errorCode = "NOT_ENROLLED";
      } else if (result.error === "lockout") {
        errorMessage = "Too many failed attempts. Biometric authentication is locked.";
        errorCode = "LOCKOUT";
      } else if (result.error === "lockout_permanent") {
        errorMessage = "Biometric authentication is permanently locked. Please use your device PIN or password.";
        errorCode = "LOCKOUT_PERMANENT";
      }

      return {
        success: false,
        error: errorMessage,
        errorCode,
      };
    }
  } catch (error: any) {
    console.error("Biometric authentication error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred during authentication",
      errorCode: "UNKNOWN_ERROR",
    };
  }
};

/**
 * Check if biometric authentication is enabled in app settings
 */
export const isBiometricEnabled = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return value === "true";
  } catch (error) {
    console.error("Error checking biometric enabled status:", error);
    return false;
  }
};

/**
 * Enable biometric authentication in app settings
 */
export const enableBiometric = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");
  } catch (error) {
    console.error("Error enabling biometric:", error);
    throw error;
  }
};

/**
 * Disable biometric authentication in app settings
 */
export const disableBiometric = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
  } catch (error) {
    console.error("Error disabling biometric:", error);
    throw error;
  }
};

/**
 * Check if biometric authentication can be enabled
 * (checks PIN requirement, hardware support and enrollment)
 */
export const canEnableBiometric = async (): Promise<{
  canEnable: boolean;
  reason?: string;
}> => {
  // First check if PIN is set (mandatory requirement)
  const pinExists = await hasPIN();
  if (!pinExists) {
    return {
      canEnable: false,
      reason: "PIN must be set before enabling biometric authentication",
    };
  }

  const hasHardware = await isBiometricSupported();
  if (!hasHardware) {
    return {
      canEnable: false,
      reason: "Biometric authentication is not supported on this device",
    };
  }

  const isEnrolled = await isBiometricEnrolled();
  if (!isEnrolled) {
    return {
      canEnable: false,
      reason: "No biometric credentials enrolled. Please set up Face ID, Touch ID, or Fingerprint in your device settings.",
    };
  }

  return { canEnable: true };
};

