import { useState, useEffect, useCallback } from 'react';
import { 
    collection, query, onSnapshot, doc, 
    addDoc, deleteDoc, updateDoc, setDoc, 
    serverTimestamp, getDoc, arrayUnion, arrayRemove, orderBy, limit, getDocs, where
} from 'firebase/firestore';
import { db, appId } from '../firebase';
import { DEFAULT_CATEGORIES } from '../constants';
import { TRANSLATIONS } from '../translations';
import { fetchExchangeRate } from '../utils/currency';
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
    
    // Список ID учасників (сирі дані з бази)
    const [allowedUsers, setAllowedUsers] = useState([]);
    // Оброблені дані учасників (з іменами)
    const [budgetMembers, setBudgetMembers] = useState([]);

    const [totalCreditDebt, setTotalCreditDebt] = useState(0);
    const t = TRANSLATIONS[lang] || TRANSLATIONS['ua'];

    const getBudgetDocRef = useCallback(() => activeBudgetId ? doc(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId) : null, [activeBudgetId]);
    const getTransactionColRef = useCallback(() => activeBudgetId ? collection(db, 'artifacts', appId, 'users', activeBudgetId, 'transactions') : null, [activeBudgetId]);
    const getLoansColRef = useCallback(() => activeBudgetId ? collection(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId, 'loans') : null, [activeBudgetId]);
    const getAssetsColRef = useCallback(() => activeBudgetId ? collection(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId, 'assets') : null, [activeBudgetId]);
    const getHistoryColRef = useCallback(() => activeBudgetId ? collection(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId, 'history_snapshots') : null, [activeBudgetId]);

    // 1. Transactions Listener
    useEffect(() => {
        if (!activeBudgetId || isPendingApproval) { setTransactions([]); return; }
        const q = query(getTransactionColRef());
        return onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(d => ({ 
                id: d.id, 
                ...d.data(), 
                amount: Number(d.data().amount), 
                createdAt: d.data().createdAt 
            }));
            list.sort((a, b) => {
                const dateA = new Date(a.date); const dateB = new Date(b.date);
                if (dateB - dateA !== 0) return dateB - dateA;
                return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
            });
            setTransactions(list);
        });
    }, [activeBudgetId, isPendingApproval, getTransactionColRef]);

    // 2. Budget Settings Listener
    useEffect(() => {
        if (!activeBudgetId) return;
        const budgetRef = getBudgetDocRef();
        return onSnapshot(budgetRef, async (snap) => {
            if (snap.exists()) {
                const data = snap.data();
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
                        limits: {} 
                    });
                }
            }
        });
    }, [activeBudgetId, getBudgetDocRef, user]);

    // 2.1 NEW: Robust Member Fetching (Fixes Empty List)
    useEffect(() => {
        const fetchMembers = async () => {
            if (!allowedUsers || allowedUsers.length === 0) {
                setBudgetMembers([]);
                return;
            }

            console.log("Raw allowedUsers from DB:", allowedUsers); // DEBUG

            const membersData = [];
            
            for (const item of allowedUsers) {
                let targetUid = null;
                let fallbackName = "Unknown";

                // 🔥 ВИТЯГУЄМО UID НЕЗАЛЕЖНО ВІД ФОРМАТУ ДАНИХ
                if (typeof item === 'string') {
                    targetUid = item;
                    fallbackName = `User ${item.substring(0, 4)}...`;
                } else if (item && typeof item === 'object' && item.uid) {
                    targetUid = item.uid;
                    fallbackName = item.displayName || item.email || "User (Obj)";
                } else {
                    console.warn("Skipping invalid user item:", item);
                    continue;
                }

                try {
                    // 1. Якщо це поточний юзер
                    if (user && user.uid === targetUid) {
                        membersData.push({
                            uid: targetUid,
                            displayName: user.displayName || 'Me',
                            email: user.email,
                            photoURL: user.photoURL,
                            isCurrentUser: true,
                            originalItem: item // Зберігаємо для видалення
                        });
                        continue;
                    }

                    // 2. Пробуємо завантажити профіль
                    const profileRef = doc(db, 'artifacts', appId, 'users', targetUid, 'metadata', 'profile');
                    const profileSnap = await getDoc(profileRef);
                    
                    if (profileSnap.exists()) {
                        const pData = profileSnap.data();
                        membersData.push({
                            uid: targetUid,
                            displayName: pData.displayName || fallbackName,
                            email: pData.email || 'No Email',
                            photoURL: pData.photoURL,
                            isCurrentUser: false,
                            originalItem: item
                        });
                    } else {
                        // 3. Якщо профіль недоступний (правила) або не існує - показуємо хоч щось
                        membersData.push({ 
                            uid: targetUid, 
                            displayName: fallbackName, 
                            email: targetUid,
                            isCurrentUser: false,
                            originalItem: item
                        });
                    }
                } catch (error) {
                    console.error(`Failed to fetch profile for ${targetUid}`, error);
                    // 4. Навіть при помилці додаємо юзера, щоб його можна було видалити
                    membersData.push({ 
                        uid: targetUid, 
                        displayName: "Error loading user", 
                        email: targetUid,
                        isCurrentUser: false,
                        originalItem: item
                    });
                }
            }
            
            console.log("Processed Budget Members:", membersData); // DEBUG
            setBudgetMembers(membersData);
        };

        fetchMembers();
    }, [allowedUsers, user]);


    // 3. Loans Listener
    useEffect(() => {
        if (!activeBudgetId || isPendingApproval) { setLoans([]); return; }
        return onSnapshot(query(getLoansColRef()), (snap) => { 
            setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() }))); 
        });
    }, [activeBudgetId, isPendingApproval, getLoansColRef]);

    // 3.1 Calculate Total Debt (Async)
    useEffect(() => {
        let isMounted = true;
        const calculateTotalDebt = async () => {
            if (loans.length === 0) {
                if (isMounted) setTotalCreditDebt(0);
                return;
            }
            let total = 0;
            for (const loan of loans) {
                if (loan.currentBalance <= 0) continue;
                const loanCurrency = loan.currency || 'UAH';
                let rate = 1;
                if (loanCurrency !== mainCurrency) {
                    try {
                        const fetchedRate = await fetchExchangeRate(loanCurrency, mainCurrency);
                        if (fetchedRate) rate = fetchedRate;
                    } catch (error) { console.error("Rate fetch error", error); }
                }
                total += loan.currentBalance * rate;
            }
            if (isMounted) setTotalCreditDebt(total);
        };
        calculateTotalDebt();
        return () => { isMounted = false; };
    }, [loans, mainCurrency]);

    // 4. Assets Listener & History
    useEffect(() => {
        if (!activeBudgetId || isPendingApproval) { setAssets([]); return; }
        
        const unsubscribeAssets = onSnapshot(query(getAssetsColRef()), (snap) => { 
            setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() }))); 
        });

        const qHistory = query(getHistoryColRef(), orderBy('date', 'asc'));
        const unsubscribeHistory = onSnapshot(qHistory, (snap) => {
            setNetWorthHistory(snap.docs.map(d => d.data()));
        });

        return () => {
            unsubscribeAssets();
            unsubscribeHistory();
        };
    }, [activeBudgetId, isPendingApproval, getAssetsColRef, getHistoryColRef]);

    // 4.1 Automatic Snapshot Logic
    useEffect(() => {
        const recordSnapshot = async () => {
            if (assets.length === 0 || !activeBudgetId) return;

            let total = 0;
            for (const asset of assets) {
                const amount = parseFloat(asset.amount) || 0;
                const value = parseFloat(asset.valuePerUnit) || 1;
                total += amount * value;
            }

            if (isNaN(total)) return;

            const today = new Date();
            const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            
            const q = query(getHistoryColRef(), orderBy('date', 'desc'), limit(1));
            const snapshot = await getDocs(q);
            
            let needsSnapshot = false;
            if (snapshot.empty) {
                needsSnapshot = true;
            } else {
                const lastData = snapshot.docs[0].data();
                const lastDate = lastData.date.substring(0, 7);
                if (lastDate !== currentMonthKey) {
                    needsSnapshot = true;
                }
            }

            if (needsSnapshot) {
                await addDoc(getHistoryColRef(), {
                    date: new Date().toISOString().split('T')[0],
                    total: total,
                    currency: mainCurrency,
                    createdAt: serverTimestamp()
                });
            }
        };

        const timer = setTimeout(recordSnapshot, 3000);
        return () => clearTimeout(timer);
    }, [assets, activeBudgetId, getHistoryColRef, mainCurrency]);

    // Actions
    const addTransaction = async (data) => {
        const payload = { ...data, amount: parseFloat(data.amount), userName: user.displayName || user.email.split('@')[0], updatedAt: serverTimestamp() };
        await addDoc(getTransactionColRef(), { ...payload, createdAt: serverTimestamp() });
    };
    const updateTransaction = async (id, data) => {
         const payload = { ...data, amount: parseFloat(data.amount), userName: user.displayName || user.email.split('@')[0], updatedAt: serverTimestamp() };
        await updateDoc(doc(getTransactionColRef(), id), payload);
    };
    const deleteTransaction = async (id) => deleteDoc(doc(getTransactionColRef(), id));

    const addLoan = async (data) => addDoc(getLoansColRef(), { ...data, createdAt: serverTimestamp() });
    const updateLoan = async (id, data) => updateDoc(doc(getLoansColRef(), id), data);
    const deleteLoan = async (id) => deleteDoc(doc(getLoansColRef(), id));

    const addAsset = async (data) => addDoc(getAssetsColRef(), { ...data, createdAt: serverTimestamp() });
    const updateAsset = async (id, data) => updateDoc(doc(getAssetsColRef(), id), { ...data, updatedAt: serverTimestamp() });
    const deleteAsset = async (id) => deleteDoc(doc(getAssetsColRef(), id));

    const saveLimit = async (catId, limit) => {
        const newLimits = { ...categoryLimits, [catId]: parseFloat(limit) };
        await updateDoc(getBudgetDocRef(), { limits: newLimits });
    };
    const deleteCategory = async (catId) => {
        const budgetRef = getBudgetDocRef();
        const snap = await getDoc(budgetRef);
        if (snap.exists()) {
            const data = snap.data();
            const updatedCats = (data.categories || []).filter(c => c.id !== catId);
            await updateDoc(budgetRef, { categories: updatedCats });
        }
    };
    const addCategory = async (catData) => {
         await updateDoc(getBudgetDocRef(), { categories: arrayUnion(catData) });
    };

    const removeUser = async (userToRemove) => {
        // Ми видаляємо те, що прийшло з allowedUsers (оригінальний елемент)
        // Якщо це був об'єкт - видаляємо об'єкт. Якщо рядок - рядок.
        let itemToRemove = userToRemove;
        
        // Якщо ми отримали оброблений об'єкт з budgetMembers, дістаємо оригінал
        if (userToRemove && userToRemove.originalItem) {
            itemToRemove = userToRemove.originalItem;
        }

        const budgetRef = getBudgetDocRef();
        if (budgetRef) {
            await updateDoc(budgetRef, {
                authorizedUsers: arrayRemove(itemToRemove)
            });
            // Оновлюємо локальний стейт для швидкості
            const uidToRemove = userToRemove.uid || userToRemove;
            setBudgetMembers(prev => prev.filter(m => m.uid !== uidToRemove));
        }
    };

    return {
        transactions, loans, assets, netWorthHistory,
        allCategories, categoryLimits, 
        allowedUsers,  
        budgetMembers, // <-- Цей масив тепер гарантовано заповнений
        totalCreditDebt,
        addTransaction, updateTransaction, deleteTransaction,
        addLoan, updateLoan, deleteLoan,
        addAsset, updateAsset, deleteAsset,
        saveLimit, deleteCategory, addCategory,
        removeUser,
        getBudgetDocRef
    };
};