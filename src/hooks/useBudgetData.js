import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { toast } from 'react-hot-toast';
import { DEFAULT_CATEGORIES } from '../constants';

const STORAGE_CURRENCY = 'EUR';

const cleanCategoriesForFirestore = (categories) => categories.map(({ icon, ...rest }) => rest);

/**
 * useBudgetData Hook
 * Handles core Firestore subscription for budget document
 *
 * @param {string} activeBudgetId - Current budget ID
 * @param {boolean} isPendingApproval - Whether user is pending approval
 * @param {object} user - Current user object
 * @param {object} t - Translations
 *
 * @returns {object} { budgetData, loading, getBudgetDocRef }
 *   - budgetData: Raw budget data from Firestore (in STORAGE_CURRENCY)
 *   - loading: Loading state
 *   - getBudgetDocRef: Function to get budget document reference
 */
export const useBudgetData = (activeBudgetId, isPendingApproval, user, t) => {
    const [budgetData, setBudgetData] = useState({
        currentBalance: 0,
        allowedUsers: [],
        ownerId: null,
        categories: [],
        limits: {},
        baseCurrency: 'UAH' // legacy fallback
    });

    const [loading, setLoading] = useState(true);

    const getBudgetDocRef = useCallback(() =>
        activeBudgetId ? doc(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId) : null,
        [activeBudgetId]
    );

    // Core budget subscription
    useEffect(() => {
        if (!activeBudgetId || isPendingApproval) {
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(getBudgetDocRef(), async (snap) => {
            if (snap.exists()) {
                const data = snap.data();

                // Security check: verify user has access
                if (user && data.ownerId !== user.uid) {
                    const isAuthorized = (data.authorizedUsers || []).includes(user.uid);
                    if (!isAuthorized) {
                        toast.error(t.access_lost || 'Access denied');
                        // Redirect to user's own budget
                        await updateDoc(
                            doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'profile'),
                            { activeBudgetId: user.uid }
                        );
                        return;
                    }
                }

                setBudgetData({
                    currentBalance: data.currentBalance || 0,
                    allowedUsers: data.authorizedUsers || [],
                    ownerId: data.ownerId,
                    categories: data.categories || [],
                    limits: data.limits || {},
                    baseCurrency: data.baseCurrency || 'UAH'
                });
            } else {
                // Create budget document if it doesn't exist
                if (user && activeBudgetId === user.uid) {
                    await setDoc(getBudgetDocRef(), {
                        createdAt: serverTimestamp(),
                        ownerId: user.uid,
                        categories: cleanCategoriesForFirestore(DEFAULT_CATEGORIES),
                        limits: {},
                        currentBalance: 0,
                        storageCurrency: STORAGE_CURRENCY,
                        baseCurrency: 'UAH'
                    });
                }
            }
            setLoading(false);
        }, (error) => {
            console.error("Budget snapshot error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [activeBudgetId, isPendingApproval, getBudgetDocRef, user, t]);

    return {
        budgetData,
        loading,
        getBudgetDocRef
    };
};
