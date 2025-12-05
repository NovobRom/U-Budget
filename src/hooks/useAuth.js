import { useState, useEffect } from 'react';
import { 
    onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
    signOut, sendPasswordResetEmail, updateProfile, 
    GoogleAuthProvider, signInWithPopup, OAuthProvider, sendEmailVerification 
} from 'firebase/auth';
import { auth, db, appId } from '../firebase';
// Додаємо onSnapshot
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeBudgetId, setActiveBudgetId] = useState(null);
    const [isPendingApproval, setIsPendingApproval] = useState(false);

    useEffect(() => {
        let profileUnsubscribe = null;

        const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Перезавантажуємо юзера
                await currentUser.reload();
                setUser({ ...currentUser }); 

                const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'metadata', 'profile');
                
                // 🔥 ЗМІНА: Використовуємо onSnapshot замість getDoc
                profileUnsubscribe = onSnapshot(userRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        // Миттєве оновлення ID бюджету
                        setActiveBudgetId(data.activeBudgetId || currentUser.uid);
                        setIsPendingApproval(data.isPendingApproval || false);
                    } else {
                        // Якщо профілю немає - створюємо
                        await setDoc(userRef, { 
                            email: currentUser.email, 
                            createdAt: new Date(),
                            activeBudgetId: currentUser.uid,
                            isPendingApproval: false
                        });
                        setActiveBudgetId(currentUser.uid);
                    }
                    setLoading(false); // Завантаження завершено після отримання даних
                }, (error) => {
                    console.error("Profile sync error:", error);
                    setLoading(false);
                });

            } else {
                setUser(null);
                setActiveBudgetId(null);
                setIsPendingApproval(false);
                setLoading(false);
                if (profileUnsubscribe) profileUnsubscribe();
            }
        });

        return () => {
            authUnsubscribe();
            if (profileUnsubscribe) profileUnsubscribe();
        };
    }, []);

    // ... (решта функцій login, register залишаються без змін) ...
    const login = async (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const register = async (email, password, name) => {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName: name });
        try {
            await sendEmailVerification(res.user);
        } catch (e) {
            console.error("Error sending verification email:", e);
        }
        // Створюємо документ, onSnapshot підхопить його автоматично
        await setDoc(doc(db, 'artifacts', appId, 'users', res.user.uid, 'metadata', 'profile'), {
            email, 
            displayName: name, 
            createdAt: new Date(),
            activeBudgetId: res.user.uid,
            isPendingApproval: false
        });
    };

    const googleLogin = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const appleLogin = async () => {
        const provider = new OAuthProvider('apple.com');
        await signInWithPopup(auth, provider);
    };

    const logout = () => signOut(auth);
    const resetPassword = (email) => sendPasswordResetEmail(auth, email);

    return { 
        user, loading, activeBudgetId, isPendingApproval, 
        login, register, logout, resetPassword, googleLogin, appleLogin 
    };
};