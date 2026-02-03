import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    // Try environment variable, fall back to hardcoded key (TEMPORARY FIX for debugging)
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB387FzPy9hsgoFnoreLSPw8w4Az6PuICM",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smartbudget-7b00a.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smartbudget-7b00a",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smartbudget-7b00a.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "367187608778",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:367187608778:web:891200fff0881767746033"
};

// Debug: Check if env vars are loaded (look in Browser Console)
console.log('[Firebase Config] API Key loaded from env:', !!import.meta.env.VITE_FIREBASE_API_KEY);
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
    console.warn('[Firebase Config] Using hardcoded fallback key. Check .env.local configuration.');
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// Exporting projectId as appId to maintain compatibility with other files
export const appId = "smartbudget-7b00a";