import { useState, useEffect } from 'react';
import { 
    onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
    signOut, sendPasswordResetEmail, updateProfile, 
    GoogleAuthProvider, signInWithPopup, OAuthProvider, sendEmailVerification 
} from 'firebase/auth';
import { auth, db, appId } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeBudgetId, setActiveBudgetId] = useState(null);
    const [isPendingApproval, setIsPendingApproval] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Перезавантажуємо юзера, щоб отримати актуальний статус emailVerified
                await currentUser.reload();
                // Важливо: створюємо копію об'єкта, щоб React побачив оновлення
                setUser({ ...currentUser }); 

                const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'metadata', 'profile');
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    setActiveBudgetId(data.activeBudgetId || currentUser.uid);
                    setIsPendingApproval(data.isPendingApproval || false);
                } else {
                    await setDoc(userRef, { 
                        email: currentUser.email, 
                        createdAt: new Date(),
                        activeBudgetId: currentUser.uid,
                        isPendingApproval: false
                    });
                    setActiveBudgetId(currentUser.uid);
                }
            } else {
                setUser(null);
                setActiveBudgetId(null);
                setIsPendingApproval(false);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const register = async (email, password, name) => {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName: name });
        
        // 🔥 ВАЖЛИВО: Відправка листа підтвердження
        try {
            await sendEmailVerification(res.user);
        } catch (e) {
            console.error("Error sending verification email:", e);
        }

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