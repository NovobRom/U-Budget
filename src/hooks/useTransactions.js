import { useState, useEffect } from 'react';
import { 
    collection, query, orderBy, limit, startAfter, getDocs, 
    addDoc, deleteDoc, doc, updateDoc, writeBatch, getDoc, 
    serverTimestamp, increment, runTransaction 
} from 'firebase/firestore';
import { db, appId } from '../firebase';
import { toast } from 'react-hot-toast';
import { fetchExchangeRate } from '../utils/currency';

const STORAGE_CURRENCY = 'EUR';

export const useTransactions = (activeBudgetId, user, t, mainCurrency = 'EUR', legacyBaseCurrency = 'UAH') => {
    const [transactions, setTransactions] = useState([]);
    const [rawTransactions, setRawTransactions] = useState([]);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingTx, setLoadingTx] = useState(false);
    const [txLimit, setTxLimit] = useState(50);

    // Helper for paths
    const getTxColRef = () => collection(db, 'artifacts', appId, 'users', activeBudgetId, 'transactions');
    const getBudgetDocRef = () => doc(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId);

    // 1. Fetch RAW transactions
    useEffect(() => {
        if (!activeBudgetId) {
            setRawTransactions([]);
            return;
        }

        const fetchTransactions = async () => {
            setLoadingTx(true);
            try {
                const q = query(
                    getTxColRef(),
                    orderBy('date', 'desc'),
                    orderBy('createdAt', 'desc'),
                    limit(txLimit)
                );
                const snapshot = await getDocs(q);
                const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRawTransactions(txs);
                setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
                setHasMore(snapshot.docs.length === txLimit);
            } catch (error) {
                console.error("Error fetching transactions:", error);
                // Handle permission errors silently or via UI
            }
            setLoadingTx(false);
        };

        fetchTransactions();
    }, [activeBudgetId, txLimit]);

    // 2. Convert transactions based on currency
    useEffect(() => {
        let isMounted = true;
        const convertTx = async () => {
            if (rawTransactions.length === 0) { 
                if(isMounted) setTransactions([]); 
                return; 
            }

            const currenciesNeeded = new Set();
            currenciesNeeded.add(legacyBaseCurrency); 
            
            rawTransactions.forEach(t => { 
                if (t.originalCurrency) currenciesNeeded.add(t.originalCurrency);
            });

            const rates = {};
            await Promise.all(Array.from(currenciesNeeded).map(async (code) => {
                try {
                    if (code === mainCurrency) rates[code] = 1;
                    else rates[code] = await fetchExchangeRate(code, mainCurrency);
                } catch(e) { rates[code] = 1; }
            }));

            if (!isMounted) return;

            const converted = rawTransactions.map(t => {
                const sourceCurr = t.originalCurrency || legacyBaseCurrency;
                const sourceAmt = t.originalAmount !== undefined ? t.originalAmount : t.amount;
                const rate = rates[sourceCurr] || 1;
                // Always display ABSOLUTE amount in UI
                return { ...t, amount: Math.abs(sourceAmt) * rate };
            });
            setTransactions(converted);
        };
        convertTx();
        return () => { isMounted = false; };
    }, [rawTransactions, mainCurrency, legacyBaseCurrency]);

    const loadMore = () => {
        setTxLimit(prev => prev + 50);
    };

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
        
        // Optimistic update for UI feel (optional, but good)
        // We rely on the snapshot listener update mostly, but re-fetching happens
        setTxLimit(prev => prev); // Trigger refetch
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
        setTxLimit(prev => prev); // Trigger refetch
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
                // Reverse impact
                const adjustment = oldData.type === 'income' ? -oldStorageAmount : oldStorageAmount;

                transaction.delete(txRef);
                transaction.update(budgetRef, { currentBalance: increment(adjustment) });
            });
            toast.success(t.success_delete || 'Deleted');
            setRawTransactions(prev => prev.filter(t => t.id !== id));
        } catch (e) {
            console.error(e);
            toast.error("Error deleting transaction");
        }
    };

    const recalculateBalance = async () => {
        if (!activeBudgetId) return;
        const toastId = toast.loading("Recalculating absolute balance...");
        try {
            const allTxSnap = await getDocs(getTxColRef());
            const txs = allTxSnap.docs.map(d => d.data());
            
            const currenciesToFetch = new Set();
            currenciesToFetch.add(legacyBaseCurrency);
            txs.forEach(t => { 
                if(t.originalCurrency) currenciesToFetch.add(t.originalCurrency);
            });

            const rates = {};
            await Promise.all(Array.from(currenciesToFetch).map(async (code) => {
                if (code === STORAGE_CURRENCY) {
                    rates[code] = 1;
                } else {
                    try {
                        rates[code] = await fetchExchangeRate(code, STORAGE_CURRENCY);
                    } catch(e) { rates[code] = 1; }
                }
            }));

            let totalEUR = 0;
            txs.forEach(t => {
                let amtEUR = 0;
                if (t.originalAmount !== undefined && t.originalCurrency) {
                    const rate = rates[t.originalCurrency] || 1;
                    amtEUR = Math.abs(t.originalAmount) * rate;
                } else {
                    const legacyAmount = Math.abs(parseFloat(t.amount) || 0);
                    const rate = rates[legacyBaseCurrency] || 1; 
                    amtEUR = legacyAmount * rate;
                }

                if (t.type === 'income') totalEUR += amtEUR;
                else totalEUR -= amtEUR;
            });

            await updateDoc(getBudgetDocRef(), { 
                currentBalance: totalEUR, 
                storageCurrency: STORAGE_CURRENCY 
            });
            toast.success("Balance fixed!", { id: toastId });
            return totalEUR; // Optional return
        } catch (e) {
            console.error("Recalculation failed", e);
            toast.error("Failed to repair balance", { id: toastId });
        }
    };

    return {
        transactions,
        loadMore,
        hasMore,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        recalculateBalance,
        loadingTx
    };
};