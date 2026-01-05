
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
// Instructions:
// 1. Go to console.firebase.google.com
// 2. Enable Authentication -> Sign-in method -> Email/Password
// 3. Enable Firestore Database -> Create Database -> Start in Test Mode (for development)

const firebaseConfig = {
  apiKey: "AIzaSyDdnUnqG6IX0ixF7Nm9itysK7RN6R6j4HA",
  authDomain: "jogo-9bddf.firebaseapp.com",
  projectId: "jogo-9bddf",
  storageBucket: "jogo-9bddf.firebasestorage.app",
  messagingSenderId: "840947424744",
  appId: "1:840947424744:web:52d5e9c7e7be3c3a54985d",
  measurementId: "G-CNFBRFQ5FC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Authentication and Database instances for use in the app
export const auth = getAuth(app);
export const db = getFirestore(app);

// Note: To add multiplayer features later, you would typically add 
// Realtime Database or restructure Firestore to have a 'lobbies' collection.
