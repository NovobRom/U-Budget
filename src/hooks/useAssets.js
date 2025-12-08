import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { toast } from 'react-hot-toast';
import { fetchExchangeRate } from '../utils/currency';

export const useAssets = (activeBudgetId, currency, t) => {
    const [assets, setAssets] = useState([]);
    const [rawAssets, setRawAssets] = useState([]);

    const getAssetsColRef = () => collection(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId, 'assets');

    // Listen
    useEffect(() => {
        if (!activeBudgetId) return;
        const unsubscribe = onSnapshot(getAssetsColRef(), (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRawAssets(items);
        });
        return () => unsubscribe();
    }, [activeBudgetId]);

    // Convert
    useEffect(() => {
        let isMounted = true;
        const convertAssets = async () => {
            const converted = await Promise.all(rawAssets.map(async (a) => {
                let valuePerUnit = a.valuePerUnit || 1;
                if (a.type === 'crypto' && a.cryptoId) {
                    try {
                        const rate = await fetchExchangeRate(a.cryptoId, currency, true);
                        if (rate) valuePerUnit = rate;
                    } catch(e) {}
                } else if (a.originalCurrency) {
                    if (a.originalCurrency !== currency) {
                        try {
                            const rate = await fetchExchangeRate(a.originalCurrency, currency);
                            if (rate) valuePerUnit = rate;
                        } catch(e) {}
                    } else { valuePerUnit = 1; }
                }
                return { ...a, valuePerUnit };
            }));
            if (isMounted) setAssets(converted);
        };
        convertAssets();
        return () => { isMounted = false; };
    }, [rawAssets, currency]);

    const addAsset = async (data) => {
        if (!activeBudgetId) return;
        await addDoc(getAssetsColRef(), {
            ...data,
            createdAt: serverTimestamp()
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
        deleteAsset
    };
};