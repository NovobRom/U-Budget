import { useState, useEffect, useMemo } from 'react';
import { 
    collection, query, orderBy, limit, onSnapshot, 
    doc, writeBatch, 
    serverTimestamp, increment, runTransaction
} from 'firebase/firestore';
import { db, appId } from '../firebase';
import { toast } from 'react-hot-toast';
import { fetchExchangeRate } from '../utils/currency';
import { useCurrencyRates } from './useCurrencyRates';

const STORAGE_CURRENCY = 'EUR';

export const useTransactions = (activeBudgetId, user, t, mainCurrency = 'EUR', legacyBaseCurrency = 'UAH') => {
    const [rawTransactions, setRawTransactions] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [loadingTx, setLoadingTx] = useState(false);
    const [txLimit, setTxLimit] = useState(50);

    // Helper for paths
    const getTxColRef = () => collection(db, 'artifacts', appId, 'users', activeBudgetId, 'transactions');
    const getBudgetDocRef = () => doc(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId);

    // 1. Real-time Transaction Listener
    useEffect(() => {
        if (!activeBudgetId) {
            setRawTransactions([]);
            return;
        }

        setLoadingTx(true);

        const q = query(
            getTxColRef(),
            orderBy('date', 'desc'),
            orderBy('createdAt', 'desc'),
            limit(txLimit)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRawTransactions(txs);
            setHasMore(snapshot.docs.length === txLimit);
            setLoadingTx(false);
        }, (error) => {
            console.error("Error fetching transactions:", error);
            setLoadingTx(false);
        });

        // Cleanup listener on unmount or dependency change
        return () => unsubscribe();
    }, [activeBudgetId, txLimit]);

    // 2. Identify Currencies needed for View
    const currenciesNeeded = useMemo(() => {
        const set = new Set();
        set.add(legacyBaseCurrency);
        rawTransactions.forEach(t => { 
            if (t.originalCurrency) set.add(t.originalCurrency);
        });
        return Array.from(set);
    }, [rawTransactions, legacyBaseCurrency]);

    // 3. Fetch Rates Efficiently (Cached)
    const rates = useCurrencyRates(currenciesNeeded, mainCurrency);

    // 4. Memoized Display Conversion
    const transactions = useMemo(() => {
        return rawTransactions.map(t => {
            const sourceCurr = t.originalCurrency || legacyBaseCurrency;
            const sourceAmt = t.originalAmount !== undefined ? t.originalAmount : t.amount;
            const rate = rates[sourceCurr] || 1; 
            
            return { ...t, amount: Math.abs(sourceAmt) * rate };
        });
    }, [rawTransactions, rates, legacyBaseCurrency]);

    const loadMore = () => {
        setTxLimit(prev => prev + 50);
    };

    // NOTE: The write functions below (add/update/delete) are maintained for compatibility,
    // but the actual app logic seems to use 'useBudgetStore' for writing. 
    // If these are used, the onSnapshot listener above will automatically handle the UI update.

    const addTransaction = async (data) => {
        if (!activeBudgetId || !user) return;
        
        const batch = writeBatch(db);
        const newTxRef = doc(getTxColRef());
        
        const inputCurrency = data.originalCurrency || mainCurrency;
        let rateToStorage = 1;

        if (inputCurrency !== STORAGE_CURRENCY) {
            try {
                rateToStorage = await fetchExchangeRate(inputCurrency, STORAGE_CURRENCY);
            } catch (e) { console.error("Rate error:", e); }
        }

        const absOriginal = Math.abs(data.originalAmount);
        const amountInStorage = absOriginal * rateToStorage;

        const payload = { 
            ...data, 
            originalAmount: absOriginal,
            amount: amountInStorage, 
            userId: user.uid,
            userName: user.displayName || user.email?.split('@')[0], 
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp() 
        };

        batch.set(newTxRef, payload);

        const adjustment = payload.type === 'income' ? amountInStorage : -amountInStorage;
        batch.update(getBudgetDocRef(), { currentBalance: increment(adjustment) });

        await batch.commit();
    };

    const updateTransaction = async (id, newData) => {
        if (!activeBudgetId) return;
        const txRef = doc(getTxColRef(), id);
        const budgetRef = getBudgetDocRef();

        await runTransaction(db, async (transaction) => {
            const txDoc = await transaction.get(txRef);
            if (!txDoc.exists()) throw new Error("Transaction does not exist!");
            
            const oldData = txDoc.data();
            const oldStorageAmount = Math.abs(parseFloat(oldData.amount));
            const oldImpact = oldData.type === 'income' ? oldStorageAmount : -oldStorageAmount;

            const inputCurrency = newData.originalCurrency || mainCurrency;
            let newRateToStorage = 1;
            if (inputCurrency !== STORAGE_CURRENCY) {
                newRateToStorage = await fetchExchangeRate(inputCurrency, STORAGE_CURRENCY);
            }
            
            const absNewOriginal = Math.abs(newData.originalAmount);
            const newStorageAmount = absNewOriginal * newRateToStorage;
            const newImpact = newData.type === 'income' ? newStorageAmount : -newStorageAmount;

            const diff = newImpact - oldImpact;

            transaction.update(txRef, { 
                ...newData, 
                originalAmount: absNewOriginal,
                amount: newStorageAmount, 
                updatedAt: serverTimestamp() 
            });
            
            if (Math.abs(diff) > 0.0001) {
                transaction.update(budgetRef, { currentBalance: increment(diff) });
            }
        });
    };

    const deleteTransaction = async (id) => {
        if (!activeBudgetId) return;
        if (!confirm(t.confirm_delete || 'Delete?')) return;

        const txRef = doc(getTxColRef(), id);
        const budgetRef = getBudgetDocRef();

        try {
            await runTransaction(db, async (transaction) => {
                const txDoc = await transaction.get(txRef);
                if (!txDoc.exists()) throw new Error("Transaction not found");
                
                const oldData = txDoc.data();
                const oldStorageAmount = Math.abs(parseFloat(oldData.amount));
                const adjustment = oldData.type === 'income' ? -oldStorageAmount : oldStorageAmount;

                transaction.delete(txRef);
                transaction.update(budgetRef, { currentBalance: increment(adjustment) });
            });
            toast.success(t.success_delete || 'Deleted');
        } catch (e) {
            console.error(e);
            toast.error("Error deleting transaction");
        }
    };

    return {
        transactions,
        loadMore,
        hasMore,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        loadingTx
    };
};