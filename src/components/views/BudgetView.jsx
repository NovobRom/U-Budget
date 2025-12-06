import React, { useState, useMemo, useRef, Suspense, lazy } from 'react';
import { 
    Calendar, ChevronDown, Search, Share2, Users, Wallet, TrendingDown, TrendingUp,
    Download, RefreshCw, Pencil, Trash2, Plus, BarChart3, X, ArrowRight
} from 'lucide-react';
import { BudgetProgress } from '../BudgetProgress';

// Lazy load charts
const SimpleDonutChart = lazy(() => 
    import('../Charts').then(module => ({ default: module.SimpleDonutChart }))
);
const SimpleBarChart = lazy(() => 
    import('../Charts').then(module => ({ default: module.SimpleBarChart }))
);

const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`}></div>
);

export default function BudgetView({ 
    transactions, categories, limits, currency, formatMoney, t,
    onOpenSettings, onOpenInvite, onOpenJoin, onOpenRecurring,
    onAddTransaction, onEditTransaction, onDeleteTransaction, onExport,
    getCategoryStyles, getCategoryName, lang,
    currentBalance, loadMore, hasMore 
}) {
    const [timeFilter, setTimeFilter] = useState('this_month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [historyFilter, setHistoryFilter] = useState('all');
    const historyRef = useRef(null);

    const isCustomRange = timeFilter === 'custom';

    const filteredTransactions = useMemo(() => {
        const now = new Date(); 
        const m = now.getMonth(); 
        const y = now.getFullYear();
        
        let list = transactions.filter(t => { 
            const d = new Date(t.date); 
            if (timeFilter === 'this_month') return d.getMonth() === m && d.getFullYear() === y; 
            if (timeFilter === 'last_month') { 
                const last = new Date(y, m - 1, 1); 
                return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear(); 
            } 
            if (timeFilter === 'this_year') return d.getFullYear() === y; 
            if (timeFilter === 'custom') {
                if (!customStartDate && !customEndDate) return true;
                const start = customStartDate ? new Date(customStartDate) : new Date('1970-01-01');
                const end = customEndDate ? new Date(customEndDate) : new Date('9999-12-31');
                end.setHours(23, 59, 59, 999);
                return d >= start && d <= end;
            }
            return true; 
        });

        if (historyFilter !== 'all') { list = list.filter(t => t.type === historyFilter); }
        return list.filter(t => !searchTerm || t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [transactions, timeFilter, searchTerm, historyFilter, customStartDate, customEndDate]);

    const { income, expense, expensesByCategory } = useMemo(() => {
        const inc = filteredTransactions.filter(t => t.type === 'income').reduce((a, c) => a + c.amount, 0);
        const exp = filteredTransactions.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0);
        
        const byCat = categories.filter(c => c.type === 'expense').map(c => ({ 
            ...c, 
            total: filteredTransactions.filter(t => t.type === 'expense' && t.category === c.id).reduce((a, x) => a + x.amount, 0) 
        })).filter(x => x.total > 0).sort((a,b) => b.total - a.total);
        
        return { income: inc, expense: exp, balance: inc - exp, expensesByCategory: byCat };
    }, [filteredTransactions, categories]);

    const trendsData = useMemo(() => {
        const data = []; const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1); 
            const label = d.toLocaleString(lang === 'en' ? 'en-US' : lang === 'ua' ? 'uk-UA' : 'pl-PL', { month: 'short' });
            const monthTrans = transactions.filter(t => { const td = new Date(t.date); return !isNaN(td) && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear(); });
            const inc = monthTrans.filter(t => t.type === 'income').reduce((acc, c) => acc + (Number(c.amount)||0), 0); 
            const exp = monthTrans.filter(t => t.type === 'expense').reduce((acc, c) => acc + (Number(c.amount)||0), 0);
            data.push({ label, income: inc, expense: exp });
        }
        return data;
    }, [transactions, lang]);

    const displayBalance = currentBalance || 0;

    const handleCardClick = (filterType) => {
        setHistoryFilter(filterType);
        setTimeout(() => { historyRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 50);
    };

    return (
        <>
            <div className="flex flex-col gap-3 px-1 mb-4 min-h-[50px]">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                    <div className="grid grid-cols-2 sm:flex gap-3 w-full sm:w-auto flex-1">
                        <div className="relative flex-1 min-w-[140px]">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="w-full appearance-none pl-9 pr-8 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer shadow-sm">
                                <option value="this_month">{t.this_month}</option>
                                <option value="last_month">{t.last_month}</option>
                                <option value="this_year">{t.this_year}</option>
                                <option value="all">{t.all_time}</option>
                                <option value="custom">📅 {lang === 'ua' ? 'Обрати дати' : 'Custom Range'}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                        </div>
                        <div className="relative flex-1 min-w-[140px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input type="text" placeholder={t.search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 outline-none shadow-sm" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-auto">
                        <button onClick={onOpenRecurring} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 px-3 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:bg-blue-100 transition-colors"><RefreshCw size={16} /> <span className="hidden sm:inline">Recurring</span></button>
                        <button onClick={onOpenInvite} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 px-3 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-100 transition-colors"><Share2 size={16} /></button>
                        <button onClick={onOpenJoin} className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors"><Users size={16} /></button>
                    </div>
                </div>
                {isCustomRange && (
                    <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar size={16} className="text-blue-500 group-hover:text-blue-600 transition-colors" /></div>
                            <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm cursor-pointer" />
                            {!customStartDate && <span className="absolute left-10 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">{lang === 'ua' ? 'З дати...' : 'From...'}</span>}
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><ArrowRight size={16} className="text-indigo-500 group-hover:text-indigo-600 transition-colors" /></div>
                            <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm cursor-pointer" />
                             {!customEndDate && <span className="absolute left-10 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">{lang === 'ua' ? 'До дати...' : 'To...'}</span>}
                            {(customStartDate || customEndDate) && (<button onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all z-10"><X size={12}/></button>)}
                        </div>
                    </div>
                )}
            </div>

            {/* CLS FIX: Added min-h container for BudgetProgress to prevent shifting */}
            <div className="min-h-[100px]">
                <BudgetProgress categories={categories} transactions={transactions} limits={limits} currency={currency} formatMoney={formatMoney} onOpenSettings={onOpenSettings} label={t.limits_title} />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                 <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-5 rounded-2xl shadow-sm border border-blue-700 flex flex-col justify-center cursor-pointer min-h-[120px]" onClick={() => handleCardClick('all')}>
                     <div className="flex justify-between items-center mb-2"><span className="text-sm opacity-80 font-medium">{t.total_balance}</span><Wallet className="opacity-80" size={18}/></div>
                     <div className="text-2xl font-bold">{formatMoney(displayBalance, currency)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-white to-rose-50 dark:from-slate-800 dark:to-rose-900/20 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[120px]" onClick={() => handleCardClick('expense')}>
                     <div className="flex justify-between items-center mb-2"><span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.expense}</span><TrendingDown className="text-red-500" size={18}/></div>
                     <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatMoney(expense, currency)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-white to-green-50 dark:from-slate-800 dark:to-green-900/20 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[120px]" onClick={() => handleCardClick('income')}>
                     <div className="flex justify-between items-center mb-2"><span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.income}</span><TrendingUp className="text-green-500" size={18}/></div>
                     <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatMoney(income, currency)}</div>
                  </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
                <div className="hidden lg:block space-y-4">
                    {/* FIX: Changed h-[400px] to min-h-[400px] h-auto.
                       This prevents the chart legend (History list inside Donut chart) 
                       from overflowing and covering the Trends chart below it on web version.
                    */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center min-h-[400px] h-auto">
                        {expensesByCategory.length > 0 ? (
                            <Suspense fallback={<Skeleton className="w-full h-full rounded-2xl" />}>
                                <SimpleDonutChart data={expensesByCategory} total={expense} currencyCode={currency} formatMoney={formatMoney} label={t.expense} getCategoryName={getCategoryName} otherLabel={t.other} />
                            </Suspense>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm py-10">No data for chart</div>
                        )}
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-[350px]">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white"><BarChart3 className="text-blue-600 dark:text-blue-400" size={20} /> Trends</h3>
                        <div className="h-[250px]">
                            <Suspense fallback={<Skeleton className="w-full h-full rounded-2xl" />}>
                                <SimpleBarChart data={trendsData} currency={currency} />
                            </Suspense>
                        </div>
                    </div>
                </div>

                <div className="lg:hidden bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center mx-auto w-full min-h-[350px]">
                    <Suspense fallback={<Skeleton className="w-64 h-64 rounded-full" />}>
                        <SimpleDonutChart data={expensesByCategory} total={expense} currencyCode={currency} formatMoney={formatMoney} label={t.expense} getCategoryName={getCategoryName} otherLabel={t.other} />
                    </Suspense>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden flex flex-col h-[600px] lg:h-[765px] shadow-sm border border-slate-100 dark:border-slate-800" ref={historyRef}>
                    <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center font-bold shrink-0">
                        <div className="flex items-center gap-2">
                            <span>{t.history}</span>
                            {historyFilter !== 'all' && (<span className="px-2 py-0.5 text-[10px] uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg flex items-center gap-1">{t[historyFilter]} <button onClick={(e) => { e.stopPropagation(); setHistoryFilter('all'); }}><X size={10}/></button></span>)}
                        </div>
                        <button onClick={() => onExport(filteredTransactions)} className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl hover:bg-slate-200 transition-colors"><Download size={16}/></button>
                    </div>
                    <div className="overflow-auto p-0 flex-1">
                        {filteredTransactions.length === 0 && (
                            <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2 h-full justify-center">
                                <Wallet size={48} className="opacity-20 mb-2"/>
                                {t.no_trans}
                            </div>
                        )}
                        {filteredTransactions.map(tData => {
                            const style = getCategoryStyles(tData.category);
                            return (
                                <div key={tData.id} className="flex justify-between items-center p-4 border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors group" onClick={() => onEditTransaction(tData)}>
                                    <div className="flex gap-3 items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${style.color.includes('bg-') ? style.color.replace('bg-', 'bg-opacity-20 bg-') : 'bg-slate-100'} ${style.textColor.replace('text-white', 'text-slate-600')}`}>{style.icon && React.createElement(style.icon, {size:18})}</div>
                                        <div><div className="font-bold text-sm dark:text-slate-200">{style.name}</div><div className="text-xs text-slate-500 flex items-center gap-1">{tData.isRecurring && <RefreshCw size={10} className="text-indigo-500"/>} {tData.description}</div><div className="text-[10px] text-slate-400 flex items-center gap-1">{tData.date} {tData.userName && <span>• {tData.userName}</span>}</div></div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`font-bold ${tData.type==='income'?'text-green-600':'text-slate-900 dark:text-white'}`}>{tData.type==='income'?'+':'-'}{formatMoney(tData.amount, currency)}</div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100">
                                            <button onClick={(e) => { e.stopPropagation(); onEditTransaction(tData); }} className="text-slate-300 hover:text-blue-500"><Pencil size={14}/></button>
                                            <button onClick={(e) => { e.stopPropagation(); onDeleteTransaction(tData.id); }} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {hasMore && historyFilter === 'all' && !isCustomRange && (
                            <div className="p-4 text-center">
                                <button 
                                    onClick={loadMore}
                                    className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {lang === 'ua' ? 'Завантажити ще...' : 'Load more...'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="block lg:hidden bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 min-h-[300px]">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white"><BarChart3 className="text-blue-600 dark:text-blue-400" size={20} /> Trends</h3>
                    <div className="h-[200px]">
                        <Suspense fallback={<Skeleton className="w-full h-full rounded-2xl" />}>
                            <SimpleBarChart data={trendsData} currency={currency} />
                        </Suspense>
                    </div>
                </div>
            </div>
            <button onClick={onAddTransaction} className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform z-50"><Plus size={28}/></button>
        </>
    );
}