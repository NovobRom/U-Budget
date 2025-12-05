import { useState, useEffect, useCallback } from 'react';
import { 
    collection, query, onSnapshot, doc, 
    addDoc, deleteDoc, updateDoc, setDoc, 
    serverTimestamp, getDoc, arrayUnion, arrayRemove, 
    orderBy, limit, getDocs, where, 
    increment, writeBatch, runTransaction // 🔥 Added for atomic balance updates
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

export const useBudget = (activeBudgetId, isPendingApproval, user, lang = 'ua', mainCurrency = 'EUR') => {
    const [transactions, setTransactions] = useState([]);
    const [loans, setLoans] = useState([]);
    const [assets, setAssets] = useState([]);
    const [netWorthHistory, setNetWorthHistory] = useState([]);
    const [allCategories, setAllCategories] = useState(DEFAULT_CATEGORIES);
    const [categoryLimits, setCategoryLimits] = useState({});
    
    // Optimization: Transaction limit
    const [txLimit, setTxLimit] = useState(50);
    
    // Auth & Team State
    const [budgetOwnerId, setBudgetOwnerId] = useState(null);
    const [allowedUsers, setAllowedUsers] = useState([]); 
    const [budgetMembers, setBudgetMembers] = useState([]);

    const [totalCreditDebt, setTotalCreditDebt] = useState(0);
    // 🔥 NEW: State for the stored balance
    const [currentBalance, setCurrentBalance] = useState(0); 

    const t = TRANSLATIONS[lang] || TRANSLATIONS['ua'];

    const getBudgetDocRef = useCallback(() => activeBudgetId ? doc(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId) : null, [activeBudgetId]);
    const getTransactionColRef = useCallback(() => activeBudgetId ? collection(db, 'artifacts', appId, 'users', activeBudgetId, 'transactions') : null, [activeBudgetId]);
    const getLoansColRef = useCallback(() => activeBudgetId ? collection(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId, 'loans') : null, [activeBudgetId]);
    const getAssetsColRef = useCallback(() => activeBudgetId ? collection(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId, 'assets') : null, [activeBudgetId]);
    const getHistoryColRef = useCallback(() => activeBudgetId ? collection(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId, 'history_snapshots') : null, [activeBudgetId]);

    // 1. Transactions Listener (OPTIMIZED)
    useEffect(() => {
        if (!activeBudgetId || isPendingApproval) { setTransactions([]); return; }
        
        const q = query(
            getTransactionColRef(),
            orderBy('date', 'desc'),
            orderBy('createdAt', 'desc'),
            limit(txLimit)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(d => ({ 
                id: d.id, 
                ...d.data(), 
                amount: Number(d.data().amount), 
                createdAt: d.data().createdAt 
            }));
            setTransactions(list);
        }, (error) => {
            console.error("Error fetching transactions:", error);
        });
        
        return () => unsubscribe();
    }, [activeBudgetId, isPendingApproval, getTransactionColRef, txLimit]);

    // Helper: Migration to calculate balance if missing
    const recalculateBalance = async () => {
        if (!activeBudgetId) return;
        try {
            console.log("Migrating: Recalculating total balance...");
            const allTxSnap = await getDocs(getTransactionColRef());
            let total = 0;
            allTxSnap.forEach(doc => {
                const d = doc.data();
                const amt = parseFloat(d.amount) || 0;
                if (d.type === 'income') total += amt;
                else total -= amt;
            });
            await updateDoc(getBudgetDocRef(), { currentBalance: total });
            console.log("Migration complete. Balance:", total);
        } catch (e) {
            console.error("Migration failed", e);
        }
    };

    const loadMore = () => {
        setTxLimit(prev => prev + 50);
    };

    // 2. Budget Settings Listener & BALANCE SYNC
    useEffect(() => {
        if (!activeBudgetId) return;
        const budgetRef = getBudgetDocRef();
        
        const unsubscribe = onSnapshot(budgetRef, async (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setBudgetOwnerId(data.ownerId);

                // 🔥 NEW: Sync currentBalance
                if (data.currentBalance !== undefined) {
                    setCurrentBalance(data.currentBalance);
                } else {
                    // MIGRATION: If field is missing, calculate it once
                    recalculateBalance();
                }

                const storedCats = data.categories || [];
                const filteredStoredCats = storedCats.filter(c => c.name !== 'Rent & Utilities' && c.name !== 'Tech & Services');
                
                const mergedStored = filteredStoredCats.map(stored => {
                    const def = DEFAULT_CATEGORIES.find(d => d.id === stored.id);
                    if (def) { return { ...stored, icon: def.icon, color: def.color, textColor: def.textColor }; }
                    const lowerId = stored.id.toLowerCase();
                    const mappedIcon = ICON_MAP[lowerId] || ICON_MAP[stored.iconId];
                    if (mappedIcon) { return { ...stored, icon: mappedIcon, color: stored.color || 'bg-slate-500', textColor: stored.textColor || 'text-white' }; }
                    if (stored.isCustom && stored.iconId) { const IconComponent = ICON_MAP[stored.iconId] || Star; return { ...stored, icon: IconComponent }; }
                    if (stored.id === 'other') { return { ...stored, icon: ShoppingBag, color: 'bg-slate-500', textColor: 'text-white' }; }
                    return { ...stored, icon: Star };
                });

                const missingDefaults = DEFAULT_CATEGORIES.filter(d => !mergedStored.some(s => s.id === d.id));
                setAllCategories([...mergedStored, ...missingDefaults]);
                setAllowedUsers(data.authorizedUsers || []);
                setCategoryLimits(data.limits || {});
            } else {
                if (user && activeBudgetId === user.uid) {
                    await setDoc(budgetRef, { 
                        createdAt: serverTimestamp(), 
                        ownerId: user.uid, 
                        categories: cleanCategoriesForFirestore(DEFAULT_CATEGORIES), 
                        limits: {},
                        currentBalance: 0 // Init with 0
                    });
                }
            }
        }, (error) => {
            console.error("Error fetching budget settings:", error);
        });
        
        return () => unsubscribe();
    }, [activeBudgetId, getBudgetDocRef, user]);

    // ... (UseEffect 2.1 Fetch Members - NO CHANGES, omitted for brevity) ...
    // ... (UseEffect 3 Loans - NO CHANGES) ...
    // ... (UseEffect 3.1 Debt Calc - NO CHANGES) ...
    // ... (UseEffect 4 Assets - NO CHANGES) ...
    // ... (UseEffect 4.1 Snapshot - NO CHANGES) ...
    // ... (UseEffect 5 Auto-eject - NO CHANGES) ...

    // 🔥 ACTIONS (UPDATED WITH ATOMIC BALANCE UPDATES)

    const addTransaction = async (data) => {
        const batch = writeBatch(db);
        const newTxRef = doc(getTransactionColRef()); // Auto ID
        const payload = { 
            ...data, 
            amount: parseFloat(data.amount), 
            userName: user.displayName || user.email.split('@')[0], 
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp() 
        };

        // 1. Create Transaction
        batch.set(newTxRef, payload);

        // 2. Update Budget Balance (Atomic)
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
            
            // Calculate old impact
            const oldAmount = parseFloat(oldData.amount);
            const oldImpact = oldData.type === 'income' ? oldAmount : -oldAmount;

            // Calculate new impact
            const newAmount = parseFloat(newData.amount);
            const newImpact = newData.type === 'income' ? newAmount : -newAmount;

            const diff = newImpact - oldImpact;

            const payload = { 
                ...newData, 
                amount: newAmount, 
                userName: user.displayName || user.email.split('@')[0], 
                updatedAt: serverTimestamp() 
            };

            transaction.update(txRef, payload);
            if (diff !== 0) {
                transaction.update(budgetRef, { currentBalance: increment(diff) });
            }
        });
    };

    const deleteTransaction = async (id) => {
        const txRef = doc(getTransactionColRef(), id);
        const budgetRef = getBudgetDocRef();

        await runTransaction(db, async (transaction) => {
            const txDoc = await transaction.get(txRef);
            if (!txDoc.exists()) throw new Error("Transaction does not exist!");
            
            const oldData = txDoc.data();
            const oldAmount = parseFloat(oldData.amount);
            
            // Reverse the impact (if it was income (+), we subtract (-). If expense (-), we add (+))
            const adjustment = oldData.type === 'income' ? -oldAmount : oldAmount;

            transaction.delete(txRef);
            transaction.update(budgetRef, { currentBalance: increment(adjustment) });
        });
    };

    // ... (Other actions like Loans, Assets, Categories remain the same) ...
    // IMPORTANT: Make sure to include the logic from useEffect 2.1, 3, 3.1, 4, 4.1, 5 here 
    // Since I'm providing the FULL file content conceptually, I will restore the truncated parts below to ensure you have a copy-paste file.
    
    // (Restoring the necessary Effects for full file integrity)
    useEffect(() => { // 2.1 Members
        const fetchMembers = async () => {
            const uniqueIds = new Set();
            if (budgetOwnerId) uniqueIds.add(budgetOwnerId);
            if (allowedUsers) allowedUsers.forEach(uid => uniqueIds.add(uid));
            const combinedList = Array.from(uniqueIds);
            if (combinedList.length === 0) { setBudgetMembers([]); return; }
            const membersData = [];
            for (const item of combinedList) {
                let targetUid = null;
                let fallbackName = "Unknown";
                if (typeof item === 'string') { targetUid = item; fallbackName = `User ${item.substring(0, 4)}...`; } 
                else if (item && typeof item === 'object' && item.uid) { targetUid = item.uid; fallbackName = item.displayName || item.email || "User (Obj)"; }
                if (!targetUid) continue;
                try {
                    if (user && user.uid === targetUid) {
                        membersData.push({ uid: targetUid, displayName: user.displayName || 'Me', email: user.email, photoURL: user.photoURL, isCurrentUser: true, isOwner: targetUid === budgetOwnerId, originalItem: item });
                        continue;
                    }
                    const profileRef = doc(db, 'artifacts', appId, 'users', targetUid, 'metadata', 'profile');
                    const profileSnap = await getDoc(profileRef);
                    if (profileSnap.exists()) {
                        const pData = profileSnap.data();
                        membersData.push({ uid: targetUid, displayName: pData.displayName || fallbackName, email: pData.email || 'No Email', photoURL: pData.photoURL, isCurrentUser: false, isOwner: targetUid === budgetOwnerId, originalItem: item });
                    } else {
                        membersData.push({ uid: targetUid, displayName: fallbackName, email: targetUid, isCurrentUser: false, isOwner: targetUid === budgetOwnerId, originalItem: item });
                    }
                } catch (error) { membersData.push({ uid: targetUid, displayName: "Error", email: targetUid, isCurrentUser: false, isOwner: targetUid === budgetOwnerId, originalItem: item }); }
            }
            membersData.sort((a, b) => (b.isOwner ? 1 : 0) - (a.isOwner ? 1 : 0));
            setBudgetMembers(membersData);
        };
        fetchMembers();
    }, [allowedUsers, budgetOwnerId, user]);

    useEffect(() => { // 3. Loans
        if (!activeBudgetId || isPendingApproval) { setLoans([]); return; }
        const unsubscribe = onSnapshot(query(getLoansColRef()), (snap) => { setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() }))); }, (e) => console.error(e));
        return () => unsubscribe();
    }, [activeBudgetId, isPendingApproval, getLoansColRef]);

    useEffect(() => { // 3.1 Debt
        let isMounted = true;
        const calculateTotalDebt = async () => {
            if (loans.length === 0) { if (isMounted) setTotalCreditDebt(0); return; }
            let total = 0;
            for (const loan of loans) {
                if (loan.currentBalance <= 0) continue;
                const loanCurrency = loan.currency || 'UAH';
                let rate = 1;
                if (loanCurrency !== mainCurrency) { try { const fetchedRate = await fetchExchangeRate(loanCurrency, mainCurrency); if (fetchedRate) rate = fetchedRate; } catch (e) {} }
                total += loan.currentBalance * rate;
            }
            if (isMounted) setTotalCreditDebt(total);
        };
        calculateTotalDebt();
        return () => { isMounted = false; };
    }, [loans, mainCurrency]);

    useEffect(() => { // 4. Assets
        if (!activeBudgetId || isPendingApproval) { setAssets([]); return; }
        const unsubscribeAssets = onSnapshot(query(getAssetsColRef()), (snap) => { setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() }))); }, (e) => console.error(e));
        const qHistory = query(getHistoryColRef(), orderBy('date', 'asc'));
        const unsubscribeHistory = onSnapshot(qHistory, (snap) => { setNetWorthHistory(snap.docs.map(d => d.data())); }, (e) => console.error(e));
        return () => { unsubscribeAssets(); unsubscribeHistory(); };
    }, [activeBudgetId, isPendingApproval, getAssetsColRef, getHistoryColRef]);

    useEffect(() => { // 4.1 Snapshot
        const recordSnapshot = async () => {
            if (assets.length === 0 || !activeBudgetId) return;
            let total = 0;
            for (const asset of assets) { const amount = parseFloat(asset.amount) || 0; const value = parseFloat(asset.valuePerUnit) || 1; total += amount * value; }
            if (isNaN(total)) return;
            const today = new Date();
            const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            const q = query(getHistoryColRef(), orderBy('date', 'desc'), limit(1));
            const snapshot = await getDocs(q);
            let needsSnapshot = false;
            if (snapshot.empty) { needsSnapshot = true; } 
            else { const lastData = snapshot.docs[0].data(); const lastDate = lastData.date.substring(0, 7); if (lastDate !== currentMonthKey) needsSnapshot = true; }
            if (needsSnapshot) { await addDoc(getHistoryColRef(), { date: new Date().toISOString().split('T')[0], total: total, currency: mainCurrency, createdAt: serverTimestamp() }); }
        };
        const timer = setTimeout(recordSnapshot, 3000);
        return () => clearTimeout(timer);
    }, [assets, activeBudgetId, getHistoryColRef, mainCurrency]);

    useEffect(() => { // 5. Auto-eject
        if (!user || !activeBudgetId || !budgetOwnerId) return;
        if (activeBudgetId === user.uid) return;
        if (user.uid === budgetOwnerId) return;
        const isAuthorized = allowedUsers.some(u => { const uid = typeof u === 'object' ? u.uid : u; return uid === user.uid; });
        if (!isAuthorized) {
            console.warn("User removed from budget. Ejecting...");
            const userProfileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'profile');
            updateDoc(userProfileRef, { activeBudgetId: user.uid }).then(() => { toast.error("You have been removed from this budget."); }).catch(err => { console.error("Failed to auto-eject:", err); });
        }
    }, [user, activeBudgetId, budgetOwnerId, allowedUsers]);

    // Simple helpers for others
    const addLoan = async (data) => addDoc(getLoansColRef(), { ...data, createdAt: serverTimestamp() });
    const updateLoan = async (id, data) => updateDoc(doc(getLoansColRef(), id), data);
    const deleteLoan = async (id) => deleteDoc(doc(getLoansColRef(), id));
    const addAsset = async (data) => addDoc(getAssetsColRef(), { ...data, createdAt: serverTimestamp() });
    const updateAsset = async (id, data) => updateDoc(doc(getAssetsColRef(), id), { ...data, updatedAt: serverTimestamp() });
    const deleteAsset = async (id) => deleteDoc(doc(getAssetsColRef(), id));
    const saveLimit = async (catId, limit) => { const newLimits = { ...categoryLimits, [catId]: parseFloat(limit) }; await updateDoc(getBudgetDocRef(), { limits: newLimits }); };
    const deleteCategory = async (catId) => { const budgetRef = getBudgetDocRef(); const snap = await getDoc(budgetRef); if (snap.exists()) { const data = snap.data(); const updatedCats = (data.categories || []).filter(c => c.id !== catId); await updateDoc(budgetRef, { categories: updatedCats }); } };
    const addCategory = async (catData) => { await updateDoc(getBudgetDocRef(), { categories: arrayUnion(catData) }); };
    const removeUser = async (userToRemove) => { let itemToRemove = userToRemove; if (userToRemove && userToRemove.originalItem) itemToRemove = userToRemove.originalItem; const uid = typeof userToRemove === 'object' ? userToRemove.uid : userToRemove; const budgetRef = getBudgetDocRef(); if (budgetRef && uid) { await updateDoc(budgetRef, { authorizedUsers: arrayRemove(itemToRemove) }); setBudgetMembers(prev => prev.filter(m => m.uid !== uid)); } };
    const leaveBudget = async () => { if (!user || !activeBudgetId) return; const budgetRef = getBudgetDocRef(); await updateDoc(budgetRef, { authorizedUsers: arrayRemove(user.uid) }); const userProfileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'profile'); await updateDoc(userProfileRef, { activeBudgetId: null }); window.location.reload(); };
    const switchBudget = async (newBudgetId) => { if (!user || !newBudgetId) return; const userProfileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'profile'); await updateDoc(userProfileRef, { activeBudgetId: newBudgetId, isPendingApproval: false }); window.location.reload(); };

    return {
        transactions, loans, assets, netWorthHistory,
        allCategories, categoryLimits, 
        allowedUsers, budgetMembers, budgetOwnerId,
        totalCreditDebt, 
        currentBalance, // 🔥 EXPORTED
        addTransaction, updateTransaction, deleteTransaction,
        addLoan, updateLoan, deleteLoan,
        addAsset, updateAsset, deleteAsset,
        saveLimit, deleteCategory, addCategory,
        removeUser, leaveBudget, switchBudget, 
        getBudgetDocRef,
        loadMore, 
        hasMore: transactions.length >= txLimit,
        recalculateBalance // Exported just in case you want to call it manually, but it runs on useEffect
    };
};