import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

import { db, appId } from '../firebase';
import { fetchExchangeRate } from '../utils/currency';

export const useAssets = (activeBudgetId, currency, t) => {
    const [assets, setAssets] = useState([]);
    const [rawAssets, setRawAssets] = useState([]);

    const getAssetsColRef = useCallback(
        () =>
            collection(
                db,
                'artifacts',
                appId,
                'public',
                'data',
                'budgets',
                activeBudgetId,
                'assets'
            ),
        [activeBudgetId]
    );

    // Listen
    useEffect(() => {
        if (!activeBudgetId) return;
        const unsubscribe = onSnapshot(getAssetsColRef(), (snapshot) => {
            const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setRawAssets(items);
        });
        return () => unsubscribe();
    }, [activeBudgetId]);

    // Convert assets to display currency
    useEffect(() => {
        let isMounted = true;
        const convertAssets = async () => {
            const converted = await Promise.all(
                rawAssets.map(async (a) => {
                    let convertedValue = a.amount || 0;
                    const assetCurrency = a.currency || a.originalCurrency || 'USD'; // Default to USD if missing (common for assets)

                    // Convert to display currency
                    if (a.type === 'crypto' && a.cryptoId) {
                        try {
                            const rate = await fetchExchangeRate(a.cryptoId, currency, true);
                            if (rate)
                                convertedValue = Math.round((a.amount || 0) * rate * 100) / 100;
                        } catch (e) {
                            console.error('Failed to convert crypto asset:', e);
                            // Fallback: assume 1
                            convertedValue = Math.round((a.amount || 0) * 100) / 100;
                        }
                    } else if (assetCurrency && assetCurrency !== currency) {
                        try {
                            const rate = await fetchExchangeRate(assetCurrency, currency);
                            if (rate)
                                convertedValue =
                                    Math.round(
                                        (a.amount || 0) * (a.valuePerUnit || 1) * rate * 100
                                    ) / 100;
                        } catch (e) {
                            console.error('Failed to convert asset:', e);
                            // Fallback: keep original value but it might be wrong scale
                            convertedValue =
                                Math.round((a.amount || 0) * (a.valuePerUnit || 1) * 100) / 100;
                        }
                    } else {
                        // Same currency - just multiply amount by valuePerUnit and round
                        convertedValue =
                            Math.round((a.amount || 0) * (a.valuePerUnit || 1) * 100) / 100;
                    }

                    return { ...a, convertedValue };
                })
            );
            if (isMounted) setAssets(converted);
        };
        convertAssets();
        return () => {
            isMounted = false;
        };
    }, [rawAssets, currency]);

    const addAsset = async (data) => {
        if (!activeBudgetId) return;
        await addDoc(getAssetsColRef(), {
            ...data,
            createdAt: serverTimestamp(),
        });
    };

    const updateAsset = async (id, data) => {
        if (!activeBudgetId) return;
        await updateDoc(doc(getAssetsColRef(), id), { ...data, updatedAt: serverTimestamp() });
    };

    const deleteAsset = async (id) => {
        if (!confirm(t.confirm_delete || 'Delete?')) return;
        await deleteDoc(doc(getAssetsColRef(), id));
        toast.success(t.success_delete || 'Deleted');
    };

    return {
        assets,
        addAsset,
        updateAsset,
        deleteAsset,
    };
};
