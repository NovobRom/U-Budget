import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';

import { db, appId } from '../firebase';

import { useCurrencyRates } from './useCurrencyRates';

const STORAGE_CURRENCY = 'EUR';

export const useTransactions = (
    activeBudgetId,
    user,
    t,
    mainCurrency = 'EUR',
    legacyBaseCurrency = 'UAH'
) => {
    const [rawTransactions, setRawTransactions] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [loadingTx, setLoadingTx] = useState(false);
    const [txLimit, setTxLimit] = useState(50);

    // Helper for paths
    const getTxColRef = () =>
        collection(db, 'artifacts', appId, 'users', activeBudgetId, 'transactions');
    const getBudgetDocRef = () =>
        doc(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId);

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

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const txs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setRawTransactions(txs);
                setHasMore(snapshot.docs.length === txLimit);
                setLoadingTx(false);
            },
            (error) => {
                console.error('Error fetching transactions:', error);
                setLoadingTx(false);
            }
        );

        // Cleanup listener on unmount or dependency change
        return () => unsubscribe();
    }, [activeBudgetId, txLimit]);

    // 2. Identify Currencies needed for View
    const currenciesNeeded = useMemo(() => {
        const set = new Set();
        set.add(legacyBaseCurrency);
        rawTransactions.forEach((t) => {
            if (t.originalCurrency) set.add(t.originalCurrency);
        });
        return Array.from(set);
    }, [rawTransactions, legacyBaseCurrency]);

    // 3. Fetch Rates Efficiently (Cached)
    const rates = useCurrencyRates(currenciesNeeded, mainCurrency);

    // 4. Memoized Display Conversion
    const transactions = useMemo(() => {
        return rawTransactions.map((t) => {
            const sourceCurr = t.originalCurrency || legacyBaseCurrency;
            const sourceAmt = t.originalAmount !== undefined ? t.originalAmount : t.amount;
            const rate = rates[sourceCurr] || 1;

            // Round to 2 decimal places to avoid floating point issues
            const convertedAmount = Math.round(Math.abs(sourceAmt) * rate * 100) / 100;
            return { ...t, amount: convertedAmount };
        });
    }, [rawTransactions, rates, legacyBaseCurrency]);

    const loadMore = () => {
        setTxLimit((prev) => prev + 50);
    };

    // NOTE: This hook is READ-ONLY. It provides real-time transaction data via onSnapshot.
    // All WRITE operations (add/update/delete) are handled by useBudgetStore -> transactionsService.
    // The listener automatically updates UI when Firestore changes.

    return {
        transactions, // Converted for display
        loadMore,
        hasMore,
        loadingTx, // Loading state
    };
};
