import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAR4DSPAi1SfiGe4wEeQHIDn5WlQ57-y70",
  authDomain: "moneymate-e8c0b.firebaseapp.com",
  projectId: "moneymate-e8c0b",
  storageBucket: "moneymate-e8c0b.firebasestorage.app",
  messagingSenderId: "208506545686",
  appId: "1:208506545686:web:5cdac2495d11faa3857737",
  measurementId: "G-05YE4XH77H",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

export default app;
