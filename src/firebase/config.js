// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCu1hEUUtvM3h4pFPWjqP4_mBeV7HQwDx0",
  authDomain: "mittiarts-invoice.firebaseapp.com",
  projectId: "mittiarts-invoice",
  storageBucket: "mittiarts-invoice.firebasestorage.app",
  messagingSenderId: "22118896739",
  appId: "1:22118896739:web:25cea9bee63b92ad849456",
  measurementId: "G-DVSGH9N5WX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Default export
export default app;