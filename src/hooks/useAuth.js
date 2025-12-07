import { useState, useEffect, useCallback } from 'react';
import { 
    onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
    signOut, sendPasswordResetEmail, updateProfile, 
    GoogleAuthProvider, signInWithPopup, OAuthProvider, sendEmailVerification 
} from 'firebase/auth';
import { auth, db, appId } from '../firebase';
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
                // Reload user to get fresh token/claims if needed
                // await currentUser.reload(); // Optional: can be aggressive, use carefully
                setUser({ ...currentUser }); 

                const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'metadata', 'profile');
                
                // Real-time listener for user profile changes
                profileUnsubscribe = onSnapshot(userRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setActiveBudgetId(data.activeBudgetId || currentUser.uid);
                        setIsPendingApproval(data.isPendingApproval || false);
                    } else {
                        // Create profile if it doesn't exist
                        try {
                            await setDoc(userRef, { 
                                email: currentUser.email, 
                                displayName: currentUser.displayName || '',
                                photoURL: currentUser.photoURL || '',
                                createdAt: new Date(),
                                activeBudgetId: currentUser.uid,
                                isPendingApproval: false
                            });
                            setActiveBudgetId(currentUser.uid);
                        } catch (e) {
                            console.error("Error creating profile:", e);
                        }
                    }
                    setLoading(false);
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
        // Document creation is handled by the useEffect listener fallback, 
        // but explicit creation here is safer for immediate feedback
        await setDoc(doc(db, 'artifacts', appId, 'users', res.user.uid, 'metadata', 'profile'), {
            email, 
            displayName: name, 
            createdAt: new Date(),
            activeBudgetId: res.user.uid,
            isPendingApproval: false
        });
    };

    const googleLogin = useCallback(async () => {
        const provider = new GoogleAuthProvider();
        // Force account selection to prevent infinite redirect loops on some browsers
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        
        try {
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (error) {
            // Log specific error for debugging
            console.error("Google Login Error:", error.code, error.message);
            throw error;
        }
    }, []);

    const appleLogin = useCallback(async () => {
        const provider = new OAuthProvider('apple.com');
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Apple Login Error:", error);
            throw error;
        }
    }, []);

    const logout = () => signOut(auth);
    const resetPassword = (email) => sendPasswordResetEmail(auth, email);

    return { 
        user, loading, activeBudgetId, isPendingApproval, 
        login, register, logout, resetPassword, googleLogin, appleLogin 
    };
};