import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyB387FzPy9hsgoFnoreLSPw8w4Az6PuICM",
    // FIXED: Use the default firebaseapp domain for authDomain.
    // Using a custom domain here (like ubudget.app) causes popup redirect loops
    // because the auth handler (/__/auth/handler) might not be correctly routed.
    authDomain: "smartbudget-7b00a.firebaseapp.com",
    projectId: "smartbudget-7b00a",
    storageBucket: "smartbudget-7b00a.firebasestorage.app",
    messagingSenderId: "367187608778",
    appId: "1:367187608778:web:891200fff0881767746033"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// Exporting projectId as appId to maintain compatibility with other files
export const appId = "smartbudget-7b00a";