import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  Auth,  // <-- ADD THIS
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC_NhCA6f6FD5o7TpOXfKkdDo2a157LKQA",
  authDomain: "kindergarten-d5db8.firebaseapp.com",
  projectId: "kindergarten-d5db8",
  storageBucket: "kindergarten-d5db8.firebasestorage.app",
  messagingSenderId: "540183968829",
  appId: "1:540183968829:web:527b4c8f93d94095a47e54",
  measurementId: "G-V9MH5Y4V64",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Typed auth variable
let auth: Auth;   // <--- STRICT TYPE HERE

if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
