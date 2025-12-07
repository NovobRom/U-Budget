import { useState, useEffect, useCallback } from 'react';
import { 
    collection, query, onSnapshot, doc, 
    addDoc, deleteDoc, updateDoc, setDoc, 
    serverTimestamp, getDoc, arrayUnion, arrayRemove, 
    orderBy, limit, getDocs, 
    increment, writeBatch, runTransaction 
} from 'firebase/firestore';
import { db, appId } from '../firebase';
import { DEFAULT_CATEGORIES } from '../constants';
import { TRANSLATIONS } from '../translations';
import { fetchExchangeRate } from '../utils/currency';
import { toast } from 'react-hot-toast';
import { 
    Utensils, Pizza, Coffee, ShoppingBag, ShoppingCart, Home, Car, 
    Heart, Smartphone, Plane, Wallet, Briefcase, PiggyBank, Star, 
    Gift, Music, Clapperboard, BookOpen, Zap, Wifi, HelpCircle, TrendingUp,
    Bitcoin, Banknote, Landmark, PieChart, DollarSign 
} from 'lucide-react';

// Icon mapping
const ICON_MAP = {
    'utensils': Utensils, 'pizza': Pizza, 'coffee': Coffee,
    'home': Home, 'car': Car, 'heart': Heart, 'health': Heart,
    'shopping': ShoppingBag, 'cart': ShoppingCart,
    'zap': Zap, 'wifi': Wifi, 'smartphone': Smartphone,
    'plane': Plane, 'wallet': Wallet, 'briefcase': Briefcase,
    'piggy': PiggyBank, 'star': Star, 'gift': Gift,
    'music': Music, 'film': Clapperboard, 'book': BookOpen,
    'bitcoin': Bitcoin, 'cash': Banknote, 'bank': Landmark, 'stock': TrendingUp,
    'pie': PieChart, 'dollar': DollarSign, 'other': HelpCircle,
    'food': Utensils, 'cafe': Coffee, 'transport': Car, 'housing': Home,
    'tech': Smartphone, 'communication': Wifi, 'travel': Plane, 'education': BookOpen,
    'gifts': Gift, 'services': Zap, 'investments': TrendingUp, 'entertainment': Clapperboard,
    'salary': Briefcase, 'freelance': Briefcase, 'savings': PiggyBank
};

const cleanCategoriesForFirestore = (categories) => categories.map(({ icon, ...rest }) => rest);

const STORAGE_CURRENCY = 'EUR';

export const useBudget = (activeBudgetId, isPendingApproval, user, lang = 'ua', mainCurrency = 'EUR') => {
    const [rawTransactions, setRawTransactions] = useState([]);
    const [rawAssets, setRawAssets] = useState([]);
    const [rawBalance, setRawBalance] = useState(0); 
    const [rawLimits, setRawLimits] = useState({});
    
    const [legacyBaseCurrency, setLegacyBaseCurrency] = useState('UAH');

    const [transactions, setTransactions] = useState([]);
    const [assets, setAssets] = useState([]);
    const [currentBalance, setCurrentBalance] = useState(0);
    const [categoryLimits, setCategoryLimits] = useState({});
    
    const [loans, setLoans] = useState([]);
    const [allCategories, setAllCategories] = useState(DEFAULT_CATEGORIES);
    
    const [txLimit, setTxLimit] = useState(50);
    const [budgetOwnerId, setBudgetOwnerId] = useState(null);
    const [allowedUsers, setAllowedUsers] = useState([]); 
    const [budgetMembers, setBudgetMembers] = useState([]);
    const [totalCreditDebt, setTotalCreditDebt] = useState(0);

    const t = TRANSLATIONS[lang] || TRANSLATIONS['ua'];

    const getBudgetDocRef = useCallback(() => activeBudgetId ? doc(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId) : null, [activeBudgetId]);
    const getTransactionColRef = useCallback(() => activeBudgetId ? collection(db, 'artifacts', appId, 'users', activeBudgetId, 'transactions') : null, [activeBudgetId]);
    const getLoansColRef = useCallback(() => activeBudgetId ? collection(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId, 'loans') : null, [activeBudgetId]);
    const getAssetsColRef = useCallback(() => activeBudgetId ? collection(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId, 'assets') : null, [activeBudgetId]);

    // =========================================================
    // LISTENERS
    // =========================================================

    useEffect(() => {
        if (!activeBudgetId || isPendingApproval) { 
            setRawTransactions([]); setTransactions([]); 
            return; 
        }
        const q = query(getTransactionColRef(), orderBy('date', 'desc'), orderBy('createdAt', 'desc'), limit(txLimit));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setRawTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (error) => {
            console.error("Trans permissions:", error);
        });
        return () => unsubscribe();
    }, [activeBudgetId, isPendingApproval, getTransactionColRef, txLimit]);

    useEffect(() => {
        if (!activeBudgetId) return;

        // --- RESET STATE immediately to prevent stale data flickering ---
        setBudgetOwnerId(null);
        setAllowedUsers([]);
        setRawBalance(0);
        setRawLimits({});
        setAllCategories(DEFAULT_CATEGORIES);
        // ----------------------------------------------------------------

        const unsubscribe = onSnapshot(getBudgetDocRef(), async (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setBudgetOwnerId(data.ownerId);
                setAllowedUsers(data.authorizedUsers || []);
                
                // SECURITY & ACCESS CHECK
                if (user && data.ownerId !== user.uid) {
                    const isAuthorized = (data.authorizedUsers || []).includes(user.uid);
                    if (!isAuthorized) {
                        toast.error(t.access_lost);
                        // Reset to personal budget
                        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'profile'), { 
                            activeBudgetId: user.uid 
                        });
                        return; // Stop processing
                    }
                }

                const dbBaseCurr = data.baseCurrency || 'UAH';
                setLegacyBaseCurrency(dbBaseCurr);

                setRawBalance(data.currentBalance || 0);
                setRawLimits(data.limits || {});

                const storedCats = data.categories || [];
                const mergedStored = storedCats.map(stored => {
                    const def = DEFAULT_CATEGORIES.find(d => d.id === stored.id);
                    if (def) return { ...stored, icon: def.icon, color: def.color, textColor: def.textColor };
                    const mappedIcon = ICON_MAP[stored.iconId] || Star;
                    return { ...stored, icon: mappedIcon };
                });
                const missingDefaults = DEFAULT_CATEGORIES.filter(d => !mergedStored.some(s => s.id === d.id));
                setAllCategories([...mergedStored, ...missingDefaults]);
            } else {
                // If doc doesn't exist (e.g. switching to own budget for first time), create it
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
        }, (error) => {
            console.error("Budget snapshot error:", error);
            // Handle permission denied (removed user trying to read)
            if (error.code === 'permission-denied') {
                if (user) {
                    toast.error(t.access_lost);
                    updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'profile'), { 
                        activeBudgetId: user.uid 
                    });
                }
            }
        });
        return () => unsubscribe();
    }, [activeBudgetId, getBudgetDocRef, user, t]);

    useEffect(() => {
        if (!activeBudgetId || isPendingApproval) { setRawAssets([]); return; }
        const unsubscribe = onSnapshot(query(getAssetsColRef()), (snap) => { 
            setRawAssets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (error) => {});
        return () => unsubscribe();
    }, [activeBudgetId, isPendingApproval, getAssetsColRef]);

    useEffect(() => {
        if (!activeBudgetId || isPendingApproval) { setLoans([]); return; }
        const unsubscribe = onSnapshot(query(getLoansColRef()), (snap) => { 
            setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() }))); 
        }, (error) => {});
        return () => unsubscribe();
    }, [activeBudgetId, isPendingApproval, getLoansColRef]);


    // =========================================================
    // CONVERSION LOGIC
    // =========================================================

    useEffect(() => {
        let isMounted = true;
        const convertTx = async () => {
            if (rawTransactions.length === 0) { if(isMounted) setTransactions([]); return; }

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

    useEffect(() => {
        let isMounted = true;
        const convertGlobals = async () => {
            // Reset local balance instantly if rawBalance is 0 (prevents seeing old balance while rate fetches)
            if (rawBalance === 0) {
                if (isMounted) {
                    setCurrentBalance(0);
                    // Also verify if limits need reset, usually 0 balance means reset or empty budget
                }
            }

            let rate = 1;
            if (STORAGE_CURRENCY !== mainCurrency) {
                try { rate = await fetchExchangeRate(STORAGE_CURRENCY, mainCurrency); } catch(e) {}
            }
            
            if (isMounted) {
                setCurrentBalance(rawBalance * rate);
                const newLimits = {};
                Object.keys(rawLimits).forEach(catId => {
                    newLimits[catId] = rawLimits[catId] * rate;
                });
                setCategoryLimits(newLimits);
            }
        };
        convertGlobals();
        return () => { isMounted = false; };
    }, [rawBalance, rawLimits, mainCurrency]);

    useEffect(() => {
        let isMounted = true;
        const convertAssets = async () => {
            const converted = await Promise.all(rawAssets.map(async (a) => {
                let valuePerUnit = a.valuePerUnit || 1;
                if (a.type === 'crypto' && a.cryptoId) {
                    try {
                        const rate = await fetchExchangeRate(a.cryptoId, mainCurrency, true);
                        if (rate) valuePerUnit = rate;
                    } catch(e) {}
                } else if (a.originalCurrency) {
                    if (a.originalCurrency !== mainCurrency) {
                        try {
                            const rate = await fetchExchangeRate(a.originalCurrency, mainCurrency);
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
    }, [rawAssets, mainCurrency]);

    useEffect(() => {
        let isMounted = true;
        const calcDebt = async () => {
            let total = 0;
            for (const loan of loans) {
                if (loan.currentBalance <= 0) continue;
                const loanCurr = loan.currency || 'UAH';
                let rate = 1;
                if (loanCurr !== mainCurrency) {
                    try { rate = await fetchExchangeRate(loanCurr, mainCurrency); } catch (e) {}
                }
                total += loan.currentBalance * rate;
            }
            if (isMounted) setTotalCreditDebt(total);
        };
        calcDebt();
        return () => { isMounted = false; };
    }, [loans, mainCurrency]);


    // =========================================================
    // ACTIONS
    // =========================================================

    const addTransaction = async (data) => {
        const batch = writeBatch(db);
        const newTxRef = doc(getTransactionColRef());
        
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
            userName: user.displayName || user.email.split('@')[0], 
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp() 
        };

        batch.set(newTxRef, payload);

        // Strict logic: Income adds, Expense subtracts
        const adjustment = payload.type === 'income' ? amountInStorage : -amountInStorage;
        batch.update(getBudgetDocRef(), { currentBalance: increment(adjustment) });

        await batch.commit();
    };

    const updateTransaction = async (id, newData) => {
        const txRef = doc(getTransactionColRef(), id);
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
        const txRef = doc(getTransactionColRef(), id);
        const budgetRef = getBudgetDocRef();

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
    };

    const saveLimit = async (catId, limitValue) => {
        let limitInStorage = parseFloat(limitValue);
        if (mainCurrency !== STORAGE_CURRENCY) {
            const rate = await fetchExchangeRate(mainCurrency, STORAGE_CURRENCY);
            limitInStorage = limitInStorage * rate;
        }
        const newRawLimits = { ...rawLimits, [catId]: limitInStorage };
        await updateDoc(getBudgetDocRef(), { limits: newRawLimits });
    };

    // =========================================================
    // RECALCULATION (Repair Tool)
    // =========================================================

    const recalculateBalance = async () => {
        if (!activeBudgetId) return;
        
        const toastId = toast.loading("Recalculating absolute balance...");
        
        try {
            console.log("Starting REPAIR in EUR...");
            const allTxSnap = await getDocs(collection(db, 'artifacts', appId, 'users', activeBudgetId, 'transactions'));
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

                // STRICT LOGIC: Income (+), Expense (-)
                if (t.type === 'income') {
                    totalEUR += amtEUR;
                } else {
                    totalEUR -= amtEUR;
                }
            });

            await updateDoc(getBudgetDocRef(), { 
                currentBalance: totalEUR, 
                storageCurrency: STORAGE_CURRENCY 
            });
            
            setRawBalance(totalEUR);
            toast.success("Balance fixed!", { id: toastId });
            
        } catch (e) {
            console.error("Recalculation failed", e);
            toast.error("Failed to repair balance", { id: toastId });
        }
    };

    // Helpers
    const addLoan = async (data) => addDoc(getLoansColRef(), { ...data, createdAt: serverTimestamp() });
    const updateLoan = async (id, data) => updateDoc(doc(getLoansColRef(), id), data);
    const deleteLoan = async (id) => deleteDoc(doc(getLoansColRef(), id));
    const addAsset = async (data) => addDoc(getAssetsColRef(), { ...data, createdAt: serverTimestamp() });
    const updateAsset = async (id, data) => updateDoc(doc(getAssetsColRef(), id), { ...data, updatedAt: serverTimestamp() });
    const deleteAsset = async (id) => deleteDoc(doc(getAssetsColRef(), id));
    const deleteCategory = async (catId) => { const r = getBudgetDocRef(); const s = await getDoc(r); if(s.exists()) await updateDoc(r, { categories: (s.data().categories||[]).filter(c=>c.id!==catId) }); };
    const addCategory = async (catData) => { await updateDoc(getBudgetDocRef(), { categories: arrayUnion(catData) }); };
    
    // Updated: just updates the budget doc. The removed user's UI will catch this via onSnapshot.
    const removeUser = async (u) => { 
        const uid = u.uid || u; 
        await updateDoc(getBudgetDocRef(), { authorizedUsers: arrayRemove(u.originalItem || u) }); 
        setBudgetMembers(prev => prev.filter(m => m.uid !== uid)); 
    };
    
    // Updated: Explicitly switch back to own budget
    const leaveBudget = async () => { 
        if(!user) return; 
        await updateDoc(getBudgetDocRef(), { authorizedUsers: arrayRemove(user.uid) }); 
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'profile'), { activeBudgetId: user.uid }); 
    };
    
    const switchBudget = async (id) => { if(!user) return; await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'profile'), { activeBudgetId: id, isPendingApproval: false }); window.location.reload(); };
    const loadMore = () => setTxLimit(p => p + 50);

    return {
        transactions, 
        loans, 
        assets, 
        netWorthHistory: [], // Placeholder as it was not fully implemented in state
        allCategories, 
        categoryLimits,
        allowedUsers, budgetMembers, budgetOwnerId,
        totalCreditDebt, 
        currentBalance, 
        addTransaction, updateTransaction, deleteTransaction,
        addLoan, updateLoan, deleteLoan,
        addAsset, updateAsset, deleteAsset,
        saveLimit, deleteCategory, addCategory,
        removeUser, leaveBudget, switchBudget, 
        getBudgetDocRef, loadMore, hasMore: transactions.length >= txLimit, 
        recalculateBalance
    };
};