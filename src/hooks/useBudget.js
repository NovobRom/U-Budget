import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, arrayRemove, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { toast } from 'react-hot-toast';
import { TRANSLATIONS } from '../translations';
import { fetchExchangeRate } from '../utils/currency';
import { DEFAULT_CATEGORIES } from '../constants';

// Sub-hooks
import { useTransactions } from './useTransactions';
import { useAssets } from './useAssets';
import { useLoans } from './useLoans';
import { useCategories } from './useCategories';

const STORAGE_CURRENCY = 'EUR';

const cleanCategoriesForFirestore = (categories) => categories.map(({ icon, ...rest }) => rest);

export const useBudget = (activeBudgetId, isPendingApproval, user, lang, currency) => {
    const [budgetData, setBudgetData] = useState({
        currentBalance: 0,
        allowedUsers: [],
        ownerId: null,
        categories: [],
        limits: {},
        baseCurrency: 'UAH' // legacy fallback
    });
    
    // Converted global states
    const [currentBalance, setCurrentBalance] = useState(0);
    const [convertedLimits, setConvertedLimits] = useState({});

    const [loading, setLoading] = useState(true);
    const t = TRANSLATIONS[lang] || TRANSLATIONS['ua'];

    const getBudgetDocRef = useCallback(() => activeBudgetId ? doc(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId) : null, [activeBudgetId]);

    // --- CORE BUDGET SUBSCRIPTION ---
    useEffect(() => {
        if (!activeBudgetId || isPendingApproval) {
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(getBudgetDocRef(), async (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                
                // Security check logic from original file
                if (user && data.ownerId !== user.uid) {
                    const isAuthorized = (data.authorizedUsers || []).includes(user.uid);
                    if (!isAuthorized) {
                        toast.error(t.access_lost);
                        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'profile'), { activeBudgetId: user.uid });
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
                 // Create if not exists (Original logic)
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

    // --- GLOBAL CONVERSION (Balance & Limits) ---
    useEffect(() => {
        let isMounted = true;
        const convertGlobals = async () => {
            let rate = 1;
            if (STORAGE_CURRENCY !== currency) {
                try { rate = await fetchExchangeRate(STORAGE_CURRENCY, currency); } catch(e) {}
            }
            
            if (isMounted) {
                setCurrentBalance(budgetData.currentBalance * rate);
                const newLimits = {};
                Object.keys(budgetData.limits).forEach(catId => {
                    newLimits[catId] = budgetData.limits[catId] * rate;
                });
                setConvertedLimits(newLimits);
            }
        };
        convertGlobals();
        return () => { isMounted = false; };
    }, [budgetData.currentBalance, budgetData.limits, currency]);

    // --- SUB-HOOKS ---
    const transactionLogic = useTransactions(activeBudgetId, user, t, currency, budgetData.baseCurrency);
    const assetLogic = useAssets(activeBudgetId, currency, t);
    const loanLogic = useLoans(activeBudgetId, currency, t);
    
    // We pass convertedLimits to useCategories so it returns correct values for UI
    const categoryLogic = useCategories(
        activeBudgetId, 
        { categories: budgetData.categories, limits: convertedLimits }, 
        t, 
        currency
    );

    // --- CORE ACTIONS (User Management) ---

    const removeUser = async (u) => {
        if (!activeBudgetId) return;
        const uid = u.uid || u; // Handle both object and string
        try {
            await updateDoc(getBudgetDocRef(), {
                authorizedUsers: arrayRemove(u.originalItem || u) // Try to remove raw item
            });
            // Original code didn't toast here but updated local state
        } catch (e) {
            console.error(e);
            toast.error("Error removing user");
        }
    };

    const leaveBudget = async () => {
        if (!activeBudgetId || !user) return;
        try {
            await updateDoc(getBudgetDocRef(), { authorizedUsers: arrayRemove(user.uid) });
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'profile'), { activeBudgetId: user.uid });
        } catch (e) {
            toast.error("Error leaving budget");
        }
    };

    const switchBudget = async (id) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'profile'), { activeBudgetId: id, isPendingApproval: false });
            window.location.reload();
        } catch (e) {
            toast.error("Error switching budget");
        }
    };

    return {
        // Core Data
        loading: loading || transactionLogic.loadingTx,
        currentBalance,
        allowedUsers: budgetData.allowedUsers,
        budgetOwnerId: budgetData.ownerId,
        
        // Sub-hook Data
        transactions: transactionLogic.transactions,
        hasMore: transactionLogic.hasMore,
        assets: assetLogic.assets,
        loans: loanLogic.loans,
        totalCreditDebt: loanLogic.totalCreditDebt,
        allCategories: categoryLogic.allCategories,
        categoryLimits: categoryLogic.categoryLimits,

        // Actions
        loadMore: transactionLogic.loadMore,
        recalculateBalance: transactionLogic.recalculateBalance,
        
        addTransaction: transactionLogic.addTransaction,
        updateTransaction: transactionLogic.updateTransaction,
        deleteTransaction: transactionLogic.deleteTransaction,
        
        addAsset: assetLogic.addAsset,
        updateAsset: assetLogic.updateAsset,
        deleteAsset: assetLogic.deleteAsset,
        
        addLoan: loanLogic.addLoan,
        updateLoan: loanLogic.updateLoan,
        deleteLoan: loanLogic.deleteLoan,
        
        addCategory: categoryLogic.addCategory,
        deleteCategory: categoryLogic.deleteCategory,
        saveLimit: categoryLogic.saveLimit,
        
        removeUser,
        leaveBudget,
        switchBudget
    };
};