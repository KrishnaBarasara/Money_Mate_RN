import * as SecureStore from "expo-secure-store";

const PIN_STORAGE_KEY = "userPin";
const PIN_LENGTH_KEY = "pinLength"; // Store whether PIN is 4 or 6 digits

export type PINLength = 4 | 6;

export interface PINService {
  hasPIN: () => Promise<boolean>;
  setPIN: (pin: string, length: PINLength) => Promise<void>;
  verifyPIN: (pin: string) => Promise<boolean>;
  deletePIN: () => Promise<void>;
  getPINLength: () => Promise<PINLength>;
}

/**
 * Check if a PIN is set
 */
export const hasPIN = async (): Promise<boolean> => {
  try {
    const pin = await SecureStore.getItemAsync(PIN_STORAGE_KEY);
    return pin !== null && pin.length > 0;
  } catch (error) {
    console.error("Error checking PIN:", error);
    return false;
  }
};

/**
 * Set or update PIN
 */
export const setPIN = async (pin: string, length: PINLength = 4): Promise<void> => {
  try {
    if (pin.length !== length) {
      throw new Error(`PIN must be exactly ${length} digits`);
    }
    
    // Validate PIN contains only digits
    if (!/^\d+$/.test(pin)) {
      throw new Error("PIN must contain only digits");
    }

    await SecureStore.setItemAsync(PIN_STORAGE_KEY, pin);
    await SecureStore.setItemAsync(PIN_LENGTH_KEY, length.toString());
  } catch (error) {
    console.error("Error setting PIN:", error);
    throw error;
  }
};

/**
 * Verify PIN
 */
export const verifyPIN = async (pin: string): Promise<boolean> => {
  try {
    const storedPin = await SecureStore.getItemAsync(PIN_STORAGE_KEY);
    if (!storedPin) {
      return false;
    }
    return pin === storedPin;
  } catch (error) {
    console.error("Error verifying PIN:", error);
    return false;
  }
};

/**
 * Delete PIN
 */
export const deletePIN = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(PIN_STORAGE_KEY);
    await SecureStore.deleteItemAsync(PIN_LENGTH_KEY);
  } catch (error) {
    console.error("Error deleting PIN:", error);
    throw error;
  }
};

/**
 * Get PIN length preference (4 or 6 digits)
 */
export const getPINLength = async (): Promise<PINLength> => {
  try {
    const lengthStr = await SecureStore.getItemAsync(PIN_LENGTH_KEY);
    if (lengthStr === "6") {
      return 6;
    }
    return 4; // Default to 4 digits
  } catch (error) {
    console.error("Error getting PIN length:", error);
    return 4; // Default to 4 digits
  }
};

/**
 * Validate PIN format
 */
export const validatePIN = (pin: string, length: PINLength): boolean => {
  return /^\d+$/.test(pin) && pin.length === length;
};

