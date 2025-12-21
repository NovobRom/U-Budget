import { useState, useEffect, useCallback } from 'react';
import { 
    onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
    signOut, sendPasswordResetEmail, updateProfile, 
    GoogleAuthProvider, signInWithPopup, sendEmailVerification 
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
                setUser({ ...currentUser }); 

                const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'metadata', 'profile');
                
                // Real-time listener for user profile changes
                profileUnsubscribe = onSnapshot(userRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setActiveBudgetId(data.activeBudgetId || currentUser.uid);
                        setIsPendingApproval(data.isPendingApproval || false);
                    } else {
                        // Create profile if it doesn't exist (fail-safe)
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
        
        // 1. Update display name immediately
        await updateProfile(res.user, { displayName: name });
        
        // 2. Create the user document immediately explicitly
        await setDoc(doc(db, 'artifacts', appId, 'users', res.user.uid, 'metadata', 'profile'), {
            email, 
            displayName: name, 
            createdAt: new Date(),
            activeBudgetId: res.user.uid,
            isPendingApproval: false
        });

        // 3. Send verification email with explicit error handling
        try {
            await sendEmailVerification(res.user);
            console.log("Verification email sent successfully to:", email);
        } catch (e) {
            console.error("Error sending verification email (Critical):", e);
            // We don't throw here to allow the user to be logged in, 
            // but we log it clearly.
        }
        
        return res.user;
    };

    // NEW: Function to manually resend email
    const resendVerificationEmail = async () => {
        if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
            console.log("Resend verification email triggered.");
        } else {
            throw new Error("No user logged in to send verification email to.");
        }
    };

    const googleLogin = useCallback(async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        
        try {
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (error) {
            console.error("Google Login Error:", error.code, error.message);
            throw error;
        }
    }, []);

    const logout = () => signOut(auth);
    const resetPassword = (email) => sendPasswordResetEmail(auth, email);

    return { 
        user, loading, activeBudgetId, isPendingApproval, 
        login, register, logout, resetPassword, googleLogin,
        resendVerificationEmail // Exported the new function
    };
};