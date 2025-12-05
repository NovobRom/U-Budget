import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyB387FzPy9hsgoFnoreLSPw8w4Az6PuICM",
    authDomain: "smartbudget-7b00a.firebaseapp.com",
    projectId: "smartbudget-7b00a",
    storageBucket: "smartbudget-7b00a.firebasestorage.app",
    messagingSenderId: "367187608778",
    appId: "1:367187608778:web:891200fff0881767746033"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = "smartbudget-7b00a"; // Використовуємо ID як константу