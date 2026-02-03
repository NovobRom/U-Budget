import React, { useState, useMemo, useRef, Suspense, lazy, useEffect } from 'react';
import { Plus, BarChart3 } from 'lucide-react';
import { BudgetProgress } from '../BudgetProgress';
import TransactionList from './budget/TransactionList';
import BudgetToolbar from './budget/BudgetToolbar';
import BudgetSummaryCards from './budget/BudgetSummaryCards';
import BudgetCharts from './budget/BudgetCharts';
import { useTransactionTotals } from '../../hooks/useTransactionTotals';
import { doc, updateDoc, deleteDoc, writeBatch, collection, getDocs, query } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import ConfirmModal from '../modals/ConfirmModal';

// Mobile-only chart import can remain lazily or be moved. Charts inside BudgetCharts are already lazy.
// We need the mobile second chart? Line 270 in original...
const SimpleBarChart = lazy(() =>
    import('../Charts').then(module => ({ default: module.SimpleBarChart }))
);
const MonobankConnect = lazy(() => import('../integrations/MonobankConnect'));

const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`}></div>
);

export default function BudgetView({
    activeBudgetId,
    transactions, categories, limits, currency, formatMoney, t,
    onOpenSettings, onOpenInvite, onOpenRecurring, onAddTransaction, onEditTransaction,
    onDeleteTransaction,
    onExport,
    onOpenJoin,
    getCategoryStyles, getCategoryName, lang,
    currentBalance, loadMore, hasMore,
    onSaveTransaction // Passed from AppRoutes
}) {
    const [timeFilter, setTimeFilter] = useState('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [historyFilter, setHistoryFilter] = useState('all');
    const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
    const historyRef = useRef(null);

    // Server-side aggregated totals
    const { totalIncome: rawIncome, totalExpense: rawExpense, loading: totalsLoading } = useTransactionTotals(
        activeBudgetId,
        timeFilter,
        customStartDate,
        customEndDate
    );

    // Exchange Rate State
    const [exchangeRate, setExchangeRate] = useState(1);

    // Fetch Exchange Rate
    useEffect(() => {
        let isActive = true;
        const fetchRate = async () => {
            // Default to 1 if currencies match
            if (currency === 'EUR' || currency === 'UAH' && lang === 'ua') { // Assuming base is EUR, but check logic
                // Actually logic says STORAGE_CURRENCY = 'EUR'
            }

            const STORAGE_CURRENCY = 'EUR';
            if (currency === STORAGE_CURRENCY) {
                if (isActive) setExchangeRate(1);
                return;
            }

            try {
                const { fetchExchangeRateCached } = await import('../../utils/currency');
                const rate = await fetchExchangeRateCached(STORAGE_CURRENCY, currency);

                if (isActive) {
                    setExchangeRate(rate);
                }
            } catch (e) {
                console.error('Conversion error in BudgetView:', e);
                if (isActive) setExchangeRate(1);
            }
        };

        fetchRate();

        return () => { isActive = false; };
    }, [currency]);

    // Derived totals (always consistent with exchangeRate)
    const totalIncome = useMemo(() => rawIncome * exchangeRate, [rawIncome, exchangeRate]);
    const totalExpense = useMemo(() => rawExpense * exchangeRate, [rawExpense, exchangeRate]);

    const isCustomRange = timeFilter === 'custom';

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const getStartOfDay = (dateStr) => {
            const d = new Date(dateStr);
            d.setHours(0, 0, 0, 0);
            return d;
        };

        let list = transactions.filter(t => {
            const d = new Date(t.date);

            if (timeFilter === 'this_month') {
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            }
            if (timeFilter === 'last_month') {
                const last = new Date(currentYear, currentMonth - 1, 1);
                return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
            }
            if (timeFilter === 'this_year') {
                return d.getFullYear() === currentYear;
            }
            if (timeFilter === 'custom') {
                if (!customStartDate && !customEndDate) return true;
                const txDate = getStartOfDay(t.date);
                const start = customStartDate ? getStartOfDay(customStartDate) : new Date('1970-01-01');
                const end = customEndDate ? getStartOfDay(customEndDate) : new Date('9999-12-31');
                return txDate >= start && txDate <= end;
            }
            return true;
        });

        if (historyFilter !== 'all') {
            list = list.filter(t => t.type === historyFilter);
        }

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            list = list.filter(t => t.description.toLowerCase().includes(lowerTerm));
        }

        return list;
    }, [transactions, timeFilter, searchTerm, historyFilter, customStartDate, customEndDate]);

    const handleToggleHidden = async (transaction) => {
        try {
            const txRef = doc(db, 'artifacts', appId, 'users', activeBudgetId, 'transactions', transaction.id);
            await updateDoc(txRef, {
                isHidden: !transaction.isHidden
            });
            // toast.success(t.success_update || 'Updated'); // Toast not imported? 
        } catch (error) {
            console.error('Error toggling hidden:', error);
        }
    };

    // expensesByCategory is calculated from visible filtered transactions for charts
    const expensesByCategory = useMemo(() => {
        const expenseMap = {};

        filteredTransactions.forEach(t => {
            if (t.type === 'expense' && t.category && !t.isHidden) {
                const amount = Number(t.amount) || 0;
                expenseMap[t.category] = (expenseMap[t.category] || 0) + amount;
            }
        });

        return categories
            .filter(c => c.type === 'expense')
            .map(c => {
                const rawTotal = expenseMap[c.id] || 0;
                // Apply exchange rate
                const total = rawTotal * exchangeRate;
                return { ...c, total };
            })
            .filter(x => x.total > 0)
            .sort((a, b) => b.total - a.total);
    }, [filteredTransactions, categories, exchangeRate]);

    const trendsData = useMemo(() => {
        // Dynamic trends based on timeFilter
        // if timeFilter is short (month), show Days.
        // if timeFilter is long (year), show Months.
        // if 'all', show Years or Months depending on span.

        let mode = 'month';
        if (timeFilter === 'this_month' || timeFilter === 'last_month') mode = 'day';
        else if (timeFilter === 'this_year') mode = 'month';
        else if (timeFilter === 'custom') {
            const start = customStartDate ? new Date(customStartDate) : new Date();
            const end = customEndDate ? new Date(customEndDate) : new Date();
            const diffDays = Math.abs((end - start) / (1000 * 60 * 60 * 24));
            mode = diffDays < 62 ? 'day' : 'month';
        } else if (timeFilter === 'all') {
            mode = 'month'; // Default to month for all time usually looks best unless very long history
        }

        const map = new Map();

        // sort transactions by date first to ensure order if we iterate
        // actually we can just map and then sort keys
        filteredTransactions.forEach(t => { // Use FILTERED transactions for Trends to match user current view
            if (!t.date || t.isHidden) return;
            const d = new Date(t.date);
            let key, label;

            if (mode === 'day') {
                key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                label = d.toLocaleDateString(lang === 'ua' ? 'uk-UA' : 'en-US', { day: 'numeric', month: 'short' });
            } else if (mode === 'month') {
                key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                label = d.toLocaleString(lang === 'ua' ? 'uk-UA' : 'en-US', { month: 'short', year: 'numeric' });
            } else {
                key = `${d.getFullYear()}`;
                label = `${d.getFullYear()}`;
            }

            if (!map.has(key)) map.set(key, { key, label, income: 0, expense: 0 });
            const bucket = map.get(key);
            const val = (Number(t.amount) || 0) * exchangeRate;

            // Rounding happens at display time or here. Let's keep high precision here.
            if (t.type === 'income') bucket.income += val;
            else if (t.type === 'expense') bucket.expense += val;
        });

        // Fill gaps if 'day' mode and within standard ranges?
        // For simplicity and "Vibe", let's just sort the existing data points.
        // If user wants to see empty days, we can add loop later.
        // But for "Trends", seeing the flow is enough.

        return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));

    }, [filteredTransactions, timeFilter, lang, exchangeRate, customStartDate, customEndDate]);

    const handleClearHistory = async () => {
        try {
            // Delete ALL transactions for this budget visible in "All Time"
            // Or really ALL in Firestore? User said "Clear History" -> implies current budget.
            // Safe approach: Delete from Firestore collection.

            const q = query(collection(db, 'artifacts', appId, 'users', activeBudgetId, 'transactions'));
            const snapshot = await getDocs(q);

            if (snapshot.empty) return;

            // Batch delete
            const batches = [];
            let batch = writeBatch(db);
            let count = 0;

            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
                count++;
                if (count >= 400) {
                    batches.push(batch.commit());
                    batch = writeBatch(db);
                    count = 0;
                }
            });
            if (count > 0) batches.push(batch.commit());

            await Promise.all(batches);

            // Also reset currentBalance to 0 in the budget document
            // To get budget doc path, we need to know where it is.
            // In usageBudgetData: doc(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId)
            const budgetDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId);
            await updateDoc(budgetDocRef, {
                currentBalance: 0
            });

            // UI should update automatically via real-time listeners if logic uses them.
            // BudgetView uses `transactions` prop. If it comes from onSnapshot, it will clear.

        } catch (error) {
            console.error("Failed to clear history:", error);
            // Maybe alert user
        }
    };

    const displayBalance = currentBalance || 0;

    const handleCardClick = (filterType) => {
        setHistoryFilter(filterType);
        setTimeout(() => { historyRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 50);
    };

    return (
        <>
            <BudgetToolbar
                timeFilter={timeFilter} setTimeFilter={setTimeFilter}
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                isCustomRange={isCustomRange}
                customStartDate={customStartDate} setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate} setCustomEndDate={setCustomEndDate}
                t={t}
                onRecurring={onOpenRecurring}
                onInvite={onOpenInvite}
                onJoin={onOpenJoin}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div><BudgetProgress categories={categories} transactions={transactions} limits={limits} currency={currency} formatMoney={formatMoney} onOpenSettings={onOpenSettings} label={t.limits_title} /></div>
                <div className="col-span-1 md:col-span-1 lg:col-span-2">
                    <Suspense fallback={<Skeleton className="h-full w-full" />}>
                        <MonobankConnect
                            lang={lang}
                            onSyncTransactions={(tx) => onSaveTransaction(tx, null)}
                            existingTransactions={transactions}
                        />
                    </Suspense>
                </div>
            </div>

            <BudgetSummaryCards
                displayBalance={displayBalance}
                income={totalIncome}
                expense={totalExpense}
                loading={totalsLoading}
                currency={currency}
                formatMoney={formatMoney}
                t={t}
                onCardClick={handleCardClick}
            />

            <div className="grid lg:grid-cols-3 gap-4">
                <BudgetCharts
                    expensesByCategory={expensesByCategory}
                    expense={totalExpense}
                    trendsData={trendsData}
                    currency={currency}
                    formatMoney={formatMoney}
                    t={t}
                    getCategoryName={getCategoryName}
                />

                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden flex flex-col h-[600px] lg:h-[765px] shadow-sm border border-slate-100 dark:border-slate-800" ref={historyRef}>
                    <TransactionList
                        transactions={filteredTransactions}
                        onEdit={onEditTransaction}
                        onDelete={onDeleteTransaction}
                        onExport={onExport}
                        getCategoryStyles={getCategoryStyles}
                        formatMoney={formatMoney}
                        currency={currency}
                        t={t}
                        hasMore={hasMore}
                        loadMore={loadMore}
                        historyFilter={historyFilter}
                        setHistoryFilter={setHistoryFilter}
                        isCustomRange={isCustomRange}
                        lang={lang}
                        // exchangeRate removed - transactions already converted
                        onToggleHidden={handleToggleHidden}
                        onClearHistory={() => setIsConfirmClearOpen(true)}
                    />
                </div>

                <div className="block lg:hidden bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 min-h-[300px]">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white"><BarChart3 className="text-blue-600 dark:text-blue-400" size={20} /> {t.trends_title}</h3>
                    <div className="h-[200px]">
                        <Suspense fallback={<Skeleton className="w-full h-full rounded-2xl" />}>
                            <SimpleBarChart data={trendsData} currency={currency} />
                        </Suspense>
                    </div>
                </div>
            </div>
            <button onClick={onAddTransaction} className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform z-50"><Plus size={28} /></button>
            <ConfirmModal
                isOpen={isConfirmClearOpen}
                onClose={() => setIsConfirmClearOpen(false)}
                onConfirm={handleClearHistory}
                title={t.confirm_clear_history_title}
                message={t.confirm_clear_history_msg}
                t={{ btn_cancel: t.btn_cancel || "Cancel", btn_confirm: t.btn_confirm || "Delete All" }}
            />
        </>
    );
}
