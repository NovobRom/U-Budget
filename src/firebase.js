import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smartbudget-7b00a.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smartbudget-7b00a",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smartbudget-7b00a.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "367187608778",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:367187608778:web:891200fff0881767746033"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// Exporting projectId as appId to maintain compatibility with other files
export const appId = "smartbudget-7b00a";