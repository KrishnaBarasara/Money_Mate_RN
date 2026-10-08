import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { Alert, AppState, AppStateStatus, Platform, Keyboard } from "react-native";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as updateAuthProfile,
  updateEmail as updateAuthEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword as updateAuthPassword,
  deleteUser,
} from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import * as FileSystem from "expo-file-system";
import { clearAllUserData } from "../services/dataClearService";

type UserProfile = {
  username: string;
  bio?: string;
  profilePhotoUrl?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (profile: UserProfile) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  updatePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  uploadProfilePhoto: (imageUri: string) => Promise<void>;
  getUserProfile: () => Promise<UserProfile | null>;
  deleteAccount: (password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Function to check if user session is still valid
  const validateUserSession = useCallback(async () => {
    if (!auth.currentUser) return;

    try {
      // Force token refresh to check if user still exists
      await auth.currentUser.getIdToken(true);
    } catch (error: any) {
      console.log("Token validation error:", error.code);

      // Check for errors indicating user was deleted or disabled
      const invalidUserErrors = [
        "auth/user-not-found",
        "auth/user-disabled",
        "auth/user-token-expired",
        "auth/invalid-user-token",
        "auth/requires-recent-login",
      ];

      if (
        invalidUserErrors.includes(error.code) ||
        error.message?.includes("user") ||
        error.message?.includes("token")
      ) {
        console.log("User session invalid, signing out...");

        // Sign out the user
        try {
          await signOut(auth);
        } catch (signOutError) {
          console.error("Error signing out:", signOutError);
        }

        // Show alert to user
        Alert.alert(
          "Session Ended",
          "Your account has been deleted or your session has expired. Please log in again.",
          [{ text: "OK" }]
        );
      }
    }
  }, []);

  // Set up auth state listener and periodic validation
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      // Dismiss keyboard when auth state changes (especially on logout/delete)
      if (Platform.OS === "android") {
        Keyboard.dismiss();
      }
      
      setUser(u);
      setLoading(false);

      // Clear existing interval when auth state changes
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
        validationIntervalRef.current = null;
      }

      // Set up periodic validation only if user is logged in
      if (u) {
        // Validate every 30 seconds
        validationIntervalRef.current = setInterval(() => {
          validateUserSession();
        }, 30000);
      }
    });

    return () => {
      unsub();
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }
    };
  }, [validateUserSession]);

  // Validate session when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App has come to foreground, validate session
        validateUserSession();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [validateUserSession]);

  // Helper function to check if error indicates user was deleted
  const handleAuthError = async (error: any) => {
    const invalidUserErrors = [
      "auth/user-not-found",
      "auth/user-disabled",
      "auth/user-token-expired",
      "auth/invalid-user-token",
      "auth/requires-recent-login",
      "permission-denied",
    ];

    const errorCode = error.code || "";
    const errorMessage = error.message || "";

    if (
      invalidUserErrors.includes(errorCode) ||
      errorMessage.includes("No document to update") ||
      errorMessage.includes("Missing or insufficient permissions")
    ) {
      console.log("User appears to be deleted, signing out...");

      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error("Error signing out:", signOutError);
      }

      Alert.alert(
        "Session Ended",
        "Your account has been deleted or your session has expired. Please log in again.",
        [{ text: "OK" }]
      );

      throw new Error("Account deleted or session expired");
    }
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const getUserProfile = async (): Promise<UserProfile | null> => {
    if (!user) return null;

    try {
      // Validate that user still exists
      await auth.currentUser?.getIdToken(true);

      const profileDoc = await getDoc(doc(db, "users", user.uid));
      if (profileDoc.exists()) {
        return profileDoc.data() as UserProfile;
      }
      return null;
    } catch (error: any) {
      console.error("Error getting user profile:", error);
      await handleAuthError(error);
      return null;
    }
  };

  const updateProfile = async (profile: UserProfile) => {
    if (!user) throw new Error("User not authenticated");

    try {
      // First validate that user still exists
      await auth.currentUser?.getIdToken(true);

      // Update Firestore profile
      const userRef = doc(db, "users", user.uid);
      const existingProfile = await getDoc(userRef);

      if (existingProfile.exists()) {
        await updateDoc(userRef, {
          username: profile.username,
          bio: profile.bio || "",
          updatedAt: new Date().toISOString(),
        });
      } else {
        await setDoc(userRef, {
          username: profile.username,
          bio: profile.bio || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Update Firebase Auth display name
      await updateAuthProfile(user, {
        displayName: profile.username,
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      await handleAuthError(error);
      throw new Error(error.message || "Failed to update profile");
    }
  };

  const updateEmail = async (newEmail: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await updateAuthEmail(user, newEmail.trim());
    } catch (error: any) {
      console.error("Error updating email:", error);
      throw new Error(error.message || "Failed to update email");
    }
  };

  const updatePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (!user || !user.email) throw new Error("User not authenticated");

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updateAuthPassword(user, newPassword);
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.code === "auth/wrong-password") {
        throw new Error("Current password is incorrect");
      }
      throw new Error(error.message || "Failed to update password");
    }
  };

  const uploadProfilePhoto = async (imageUri: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      // First validate that user still exists
      await auth.currentUser?.getIdToken(true);

      // Convert image to base64 (compressed)
      // Read as base64 string
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create data URL for display
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      // Update Firestore profile with base64 image
      const userRef = doc(db, "users", user.uid);
      const existingProfile = await getDoc(userRef);

      if (existingProfile.exists()) {
        await updateDoc(userRef, {
          profilePhotoUrl: dataUrl,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await setDoc(userRef, {
          profilePhotoUrl: dataUrl,
          username: user.displayName || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Note: Firebase Auth photoURL doesn't support data URLs well,
      // so we'll just store it in Firestore
    } catch (error: any) {
      console.error("Error uploading profile photo:", error);
      await handleAuthError(error);
      throw new Error(error.message || "Failed to upload profile photo");
    }
  };

  const deleteAccount = async (password: string) => {
    if (!user) throw new Error("User not authenticated");
    if (!user.email) throw new Error("User email not found");

    try {
      // Step 1: Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Step 2: Delete all user data from Firestore
      const result = await clearAllUserData(user.uid);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete user data");
      }

      // Step 3: Delete user profile from Firestore
      const userRef = doc(db, "users", user.uid);
      const userProfile = await getDoc(userRef);
      if (userProfile.exists()) {
        await deleteDoc(userRef);
      }

      // Step 4: Delete Firebase Auth account
      await deleteUser(user);

      // Step 5: Sign out (should happen automatically, but just in case)
      await signOut(auth);
    } catch (error: any) {
      console.error("Error deleting account:", error);
      throw new Error(error.message || "Failed to delete account");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        resetPassword,
        updateProfile,
        updateEmail,
        updatePassword,
        uploadProfilePhoto,
        getUserProfile,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
