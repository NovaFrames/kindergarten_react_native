// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyC_NhCA6f6FD5o7TpOXfKkdDo2a157LKQA",
  authDomain: "kindergarten-d5db8.firebaseapp.com",
  projectId: "kindergarten-d5db8",
  storageBucket: "kindergarten-d5db8.firebasestorage.app",
  messagingSenderId: "540183968829",
  appId: "1:540183968829:web:527b4c8f93d94095a47e54",
  measurementId: "G-V9MH5Y4V64"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const messaging = getMessaging(app);

export { messaging, getToken, onMessage };
export { db, storage,auth };

