import { useState, useEffect, useCallback } from 'react';
import { 
    collection, query, onSnapshot, doc, 
    addDoc, deleteDoc, updateDoc, setDoc, 
    serverTimestamp, getDoc, arrayUnion, arrayRemove, 
    orderBy, limit, getDocs, where, 
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
    // --- Raw Data (Stored in EUR or Original Currency) ---
    const [rawTransactions, setRawTransactions] = useState([]);
    const [rawAssets, setRawAssets] = useState([]);
    const [rawBalance, setRawBalance] = useState(0); // In EUR
    const [rawLimits, setRawLimits] = useState({}); // In EUR
    
    // Legacy base currency (read from DB to handle old transactions correctly)
    const [legacyBaseCurrency, setLegacyBaseCurrency] = useState('UAH');

    // --- Processed Data (Converted to UI Main Currency) ---
    const [transactions, setTransactions] = useState([]);
    const [assets, setAssets] = useState([]);
    const [currentBalance, setCurrentBalance] = useState(0);
    const [categoryLimits, setCategoryLimits] = useState({});
    
    const [loans, setLoans] = useState([]);
    const [netWorthHistory, setNetWorthHistory] = useState([]);
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
    const getHistoryColRef = useCallback(() => activeBudgetId ? collection(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId, 'history_snapshots') : null, [activeBudgetId]);

    // =========================================================
    // 1. DATA LISTENERS
    // =========================================================

    // 1.1 Transactions
    useEffect(() => {
        if (!activeBudgetId || isPendingApproval) { 
            setRawTransactions([]); setTransactions([]); 
            return; 
        }
        const q = query(getTransactionColRef(), orderBy('date', 'desc'), orderBy('createdAt', 'desc'), limit(txLimit));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setRawTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, [activeBudgetId, isPendingApproval, getTransactionColRef, txLimit]);

    // 1.2 Budget Settings
    useEffect(() => {
        if (!activeBudgetId) return;
        const unsubscribe = onSnapshot(getBudgetDocRef(), async (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setBudgetOwnerId(data.ownerId);
                setAllowedUsers(data.authorizedUsers || []);
                
                // IMPORTANT: Read the legacy base currency if exists, else UAH
                const dbBaseCurr = data.baseCurrency || 'UAH';
                setLegacyBaseCurrency(dbBaseCurr);

                // Store raw values (assumed EUR if migrated, or mixed if not)
                if (data.currentBalance !== undefined) {
                    setRawBalance(data.currentBalance);
                } else {
                    // Trigger migration if field missing
                    recalculateBalance(dbBaseCurr);
                }

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
        });
        return () => unsubscribe();
    }, [activeBudgetId, getBudgetDocRef, user]);

    // 1.3 Assets
    useEffect(() => {
        if (!activeBudgetId || isPendingApproval) { setRawAssets([]); return; }
        const unsubscribe = onSnapshot(query(getAssetsColRef()), (snap) => { 
            setRawAssets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, [activeBudgetId, isPendingApproval, getAssetsColRef]);

    // 1.4 Loans
    useEffect(() => {
        if (!activeBudgetId || isPendingApproval) { setLoans([]); return; }
        const unsubscribe = onSnapshot(query(getLoansColRef()), (snap) => { 
            setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() }))); 
        });
        return () => unsubscribe();
    }, [activeBudgetId, isPendingApproval, getLoansColRef]);


    // =========================================================
    // 2. CONVERSION LOGIC (To UI Main Currency)
    // =========================================================

    // 2.1 Convert Transactions History
    useEffect(() => {
        let isMounted = true;
        const convertTx = async () => {
            if (rawTransactions.length === 0) { if(isMounted) setTransactions([]); return; }

            const currenciesNeeded = new Set();
            currenciesNeeded.add(legacyBaseCurrency); // Add legacy base for fallbacks
            
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
                // If originalCurrency exists, use it. Else assume legacyBaseCurrency.
                const sourceCurr = t.originalCurrency || legacyBaseCurrency;
                const sourceAmt = t.originalAmount !== undefined ? t.originalAmount : t.amount;
                
                const rate = rates[sourceCurr] || 1;
                return { ...t, amount: sourceAmt * rate };
            });
            setTransactions(converted);
        };
        convertTx();
        return () => { isMounted = false; };
    }, [rawTransactions, mainCurrency, legacyBaseCurrency]);

    // 2.2 Convert Balance & Limits (From STORAGE_CURRENCY [EUR] -> Main Currency)
    useEffect(() => {
        let isMounted = true;
        const convertGlobals = async () => {
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

    // 2.3 Convert Assets
    useEffect(() => {
        let isMounted = true;
        const convertAssets = async () => {
            const converted = await Promise.all(rawAssets.map(async (a) => {
                let valuePerUnit = a.valuePerUnit || 1;
                
                // Crypto: Fetch live rate
                if (a.type === 'crypto' && a.cryptoId) {
                    try {
                        const rate = await fetchExchangeRate(a.cryptoId, mainCurrency, true);
                        if (rate) valuePerUnit = rate;
                    } catch(e) {}
                } 
                // Fiat/Stock: Convert Original
                else if (a.originalCurrency) {
                    if (a.originalCurrency !== mainCurrency) {
                        try {
                            const rate = await fetchExchangeRate(a.originalCurrency, mainCurrency);
                            if (rate) valuePerUnit = rate;
                        } catch(e) {}
                    } else {
                        valuePerUnit = 1;
                    }
                }
                return { ...a, valuePerUnit };
            }));
            if (isMounted) setAssets(converted);
        };
        convertAssets();
        return () => { isMounted = false; };
    }, [rawAssets, mainCurrency]);

    // 2.4 Total Debt
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
    // 3. ACTIONS
    // =========================================================

    const addTransaction = async (data) => {
        const batch = writeBatch(db);
        const newTxRef = doc(getTransactionColRef());
        
        // Convert to STORAGE_CURRENCY (EUR) for DB Balance consistency
        const inputCurrency = data.originalCurrency || mainCurrency;
        let amountInStorage = data.originalAmount;

        if (inputCurrency !== STORAGE_CURRENCY) {
            try {
                const rateToStorage = await fetchExchangeRate(inputCurrency, STORAGE_CURRENCY);
                amountInStorage = data.originalAmount * rateToStorage;
            } catch (e) {
                console.error("Rate error:", e);
            }
        }

        const payload = { 
            ...data, 
            amount: amountInStorage, 
            userName: user.displayName || user.email.split('@')[0], 
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp() 
        };

        batch.set(newTxRef, payload);

        const adjustment = payload.type === 'income' ? payload.amount : -payload.amount;
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
            const oldStorageAmount = parseFloat(oldData.amount);
            const oldImpact = oldData.type === 'income' ? oldStorageAmount : -oldStorageAmount;

            let newStorageAmount = newData.originalAmount;
            const inputCurrency = newData.originalCurrency || mainCurrency;
            
            if (inputCurrency !== STORAGE_CURRENCY) {
                const rate = await fetchExchangeRate(inputCurrency, STORAGE_CURRENCY);
                newStorageAmount = newData.originalAmount * rate;
            }

            const newImpact = newData.type === 'income' ? newStorageAmount : -newStorageAmount;
            const diff = newImpact - oldImpact;

            transaction.update(txRef, { 
                ...newData, 
                amount: newStorageAmount, 
                updatedAt: serverTimestamp() 
            });
            
            if (Math.abs(diff) > 0.001) {
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
            const oldStorageAmount = parseFloat(oldData.amount);
            const adjustment = oldData.type === 'income' ? -oldStorageAmount : oldStorageAmount;

            transaction.delete(txRef);
            transaction.update(budgetRef, { currentBalance: increment(adjustment) });
        });
    };

    const saveLimit = async (catId, limitValue) => {
        // limitValue is in Main Currency. Convert to STORAGE_CURRENCY (EUR)
        let limitInStorage = parseFloat(limitValue);
        if (mainCurrency !== STORAGE_CURRENCY) {
            const rate = await fetchExchangeRate(mainCurrency, STORAGE_CURRENCY);
            limitInStorage = limitInStorage * rate;
        }
        
        const newRawLimits = { ...rawLimits, [catId]: limitInStorage };
        await updateDoc(getBudgetDocRef(), { limits: newRawLimits });
    };

    // =========================================================
    // 4. UTILS & REPAIR
    // =========================================================

    // Recalculates total balance from scratch in EUR
    // Handles legacy data by assuming it is in `legacyBaseCurrency` (default UAH)
    const recalculateBalance = async (baseCurr = legacyBaseCurrency) => {
        if (!activeBudgetId) return;
        
        try {
            console.log("Recalculating Balance in EUR. Assuming legacy data is:", baseCurr);
            const allTxSnap = await getDocs(collection(db, 'artifacts', appId, 'users', activeBudgetId, 'transactions'));
            const txs = allTxSnap.docs.map(d => d.data());
            
            const currenciesToFetch = new Set();
            currenciesToFetch.add(baseCurr);
            txs.forEach(t => { 
                if(t.originalCurrency) currenciesToFetch.add(t.originalCurrency);
            });

            const rates = {};
            await Promise.all(Array.from(currenciesToFetch).map(async (code) => {
                if (code === STORAGE_CURRENCY) rates[code] = 1;
                else try {
                    rates[code] = await fetchExchangeRate(code, STORAGE_CURRENCY);
                } catch(e) { rates[code] = 1; }
            }));

            let total = 0;
            txs.forEach(t => {
                let amtEUR = 0;
                
                // If NEW transaction (has originalCurrency)
                if (t.originalAmount !== undefined && t.originalCurrency) {
                    const rate = rates[t.originalCurrency] || 1;
                    amtEUR = t.originalAmount * rate;
                } 
                // If LEGACY transaction (no originalCurrency)
                else {
                    const legacyAmount = parseFloat(t.amount) || 0;
                    const rate = rates[baseCurr] || 1; // Convert from Legacy Base to EUR
                    amtEUR = legacyAmount * rate;
                }

                if (t.type === 'income') total += amtEUR;
                else total -= amtEUR;
            });

            await updateDoc(getBudgetDocRef(), { currentBalance: total, storageCurrency: STORAGE_CURRENCY });
            setRawBalance(total);
            console.log("Recalculated Balance (EUR):", total);
            toast.success("Balance recalculated!");
            
        } catch (e) {
            console.error("Recalculation failed", e);
        }
    };

    // 4.2 Snapshot (Unchanged)
    useEffect(() => { 
        const recordSnapshot = async () => {
            if (assets.length === 0 || !activeBudgetId) return;
            // Calculate total net worth in Main Currency for snapshot
            let total = 0;
            for (const asset of assets) { 
                total += asset.amount * asset.valuePerUnit; 
            }
            if (isNaN(total)) return;
            
            const today = new Date();
            const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            const q = query(getHistoryColRef(), orderBy('date', 'desc'), limit(1));
            const snapshot = await getDocs(q);
            
            let needsSnapshot = false;
            if (snapshot.empty) { needsSnapshot = true; } 
            else { 
                const lastData = snapshot.docs[0].data(); 
                const lastDate = lastData.date.substring(0, 7); 
                if (lastDate !== currentMonthKey) needsSnapshot = true; 
            }
            
            if (needsSnapshot) { 
                await addDoc(getHistoryColRef(), { 
                    date: new Date().toISOString().split('T')[0], 
                    total: total, 
                    currency: mainCurrency, // Snapshot in display currency of that time
                    createdAt: serverTimestamp() 
                }); 
            }
        };
        const timer = setTimeout(recordSnapshot, 3000);
        return () => clearTimeout(timer);
    }, [assets, activeBudgetId, getHistoryColRef, mainCurrency]);

    // 5. Auto-eject (Unchanged)
    useEffect(() => {
        if (!user || !activeBudgetId || !budgetOwnerId) return;
        if (activeBudgetId === user.uid) return;
        if (user.uid === budgetOwnerId) return;
        const isAuthorized = allowedUsers.some(u => { const uid = typeof u === 'object' ? u.uid : u; return uid === user.uid; });
        if (!isAuthorized) {
            updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'profile'), { activeBudgetId: user.uid });
        }
    }, [user, activeBudgetId, budgetOwnerId, allowedUsers]);

    // Helpers
    const addLoan = async (data) => addDoc(getLoansColRef(), { ...data, createdAt: serverTimestamp() });
    const updateLoan = async (id, data) => updateDoc(doc(getLoansColRef(), id), data);
    const deleteLoan = async (id) => deleteDoc(doc(getLoansColRef(), id));
    const addAsset = async (data) => addDoc(getAssetsColRef(), { ...data, createdAt: serverTimestamp() });
    const updateAsset = async (id, data) => updateDoc(doc(getAssetsColRef(), id), { ...data, updatedAt: serverTimestamp() });
    const deleteAsset = async (id) => deleteDoc(doc(getAssetsColRef(), id));
    const deleteCategory = async (catId) => { const r = getBudgetDocRef(); const s = await getDoc(r); if(s.exists()) await updateDoc(r, { categories: (s.data().categories||[]).filter(c=>c.id!==catId) }); };
    const addCategory = async (catData) => { await updateDoc(getBudgetDocRef(), { categories: arrayUnion(catData) }); };
    const removeUser = async (u) => { const uid = u.uid || u; await updateDoc(getBudgetDocRef(), { authorizedUsers: arrayRemove(u.originalItem || u) }); setBudgetMembers(prev => prev.filter(m => m.uid !== uid)); };
    const leaveBudget = async () => { if(!user) return; await updateDoc(getBudgetDocRef(), { authorizedUsers: arrayRemove(user.uid) }); await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'profile'), { activeBudgetId: null }); window.location.reload(); };
    const switchBudget = async (id) => { if(!user) return; await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'profile'), { activeBudgetId: id, isPendingApproval: false }); window.location.reload(); };
    const loadMore = () => setTxLimit(p => p + 50);

    return {
        transactions, 
        loans, 
        assets, 
        netWorthHistory,
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