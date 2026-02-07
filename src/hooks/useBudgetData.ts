import {
    doc,
    onSnapshot,
    setDoc,
    updateDoc,
    serverTimestamp,
    DocumentReference,
} from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

import { DEFAULT_CATEGORIES } from '../constants';
import { db, appId } from '../firebase';
import { Category } from '../types';

const STORAGE_CURRENCY = 'EUR';

interface BudgetData {
    currentBalance: number;
    allowedUsers: string[];
    ownerId: string | null;
    categories: Category[];
    limits: Record<string, number>;
    baseCurrency: string;
}

const cleanCategoriesForFirestore = (categories: Category[]): Omit<Category, 'icon'>[] =>
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    categories.map(({ icon, ...rest }) => rest);

/**
 * useBudgetData Hook
 * Handles core Firestore subscription for budget document
 */
export const useBudgetData = (
    activeBudgetId: string | null,
    isPendingApproval: boolean,
    user: { uid: string } | null,
    t: any
) => {
    const [budgetData, setBudgetData] = useState<BudgetData>({
        currentBalance: 0,
        allowedUsers: [],
        ownerId: null,
        categories: [],
        limits: {},
        baseCurrency: 'UAH', // legacy fallback
    });

    const [loading, setLoading] = useState<boolean>(true);

    const getBudgetDocRef = useCallback(
        (): DocumentReference | null =>
            activeBudgetId
                ? doc(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId)
                : null,
        [activeBudgetId]
    );

    // Core budget subscription
    useEffect(() => {
        if (!activeBudgetId || isPendingApproval) {
            setLoading(false);
            return;
        }

        const docRef = getBudgetDocRef();
        if (!docRef) return;

        const unsubscribe = onSnapshot(
            docRef,
            async (snap) => {
                if (snap.exists()) {
                    const data = snap.data();

                    // Security check: verify user has access
                    if (user && data.ownerId !== user.uid) {
                        const isAuthorized = (data.authorizedUsers || []).includes(user.uid);
                        if (!isAuthorized) {
                            toast.error(t.access_lost || 'Access denied');
                            // Redirect to user's own budget
                            await updateDoc(
                                doc(
                                    db,
                                    'artifacts',
                                    appId,
                                    'users',
                                    user.uid,
                                    'metadata',
                                    'profile'
                                ),
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
                        baseCurrency: data.baseCurrency || 'UAH',
                    });
                } else {
                    // Create budget document if it doesn't exist
                    if (user && activeBudgetId === user.uid) {
                        await setDoc(docRef, {
                            createdAt: serverTimestamp(),
                            ownerId: user.uid,
                            categories: cleanCategoriesForFirestore(
                                DEFAULT_CATEGORIES as unknown as Category[]
                            ),
                            limits: {},
                            currentBalance: 0,
                            storageCurrency: STORAGE_CURRENCY,
                            baseCurrency: 'UAH',
                        });
                    }
                }
                setLoading(false);
            },
            (error) => {
                console.error('Budget snapshot error:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [activeBudgetId, isPendingApproval, getBudgetDocRef, user, t]);

    return {
        budgetData,
        loading,
        getBudgetDocRef,
    };
};
