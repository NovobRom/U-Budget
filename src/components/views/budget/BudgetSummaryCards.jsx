import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

export default function BudgetSummaryCards({
    displayBalance, income, expense, currency, formatMoney, t, onCardClick, loading = false
}) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-5 rounded-2xl shadow-sm border border-blue-700 flex flex-col justify-center cursor-pointer min-h-[120px]" onClick={() => onCardClick('all')}>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm opacity-80 font-medium">{t.total_balance}</span>
                </div>
                <div className="text-2xl font-bold">{formatMoney(displayBalance, currency)}</div>
            </div>
            <div className={`bg-gradient-to-br from-white to-rose-50 dark:from-slate-800 dark:to-rose-900/20 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[120px] ${loading ? 'animate-pulse' : ''}`} onClick={() => onCardClick('expense')}>
                <div className="flex justify-between items-center mb-2"><span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.expense}</span><TrendingDown className="text-red-500" size={18} /></div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatMoney(expense, currency)}</div>
            </div>
            <div className={`bg-gradient-to-br from-white to-green-50 dark:from-slate-800 dark:to-green-900/20 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[120px] ${loading ? 'animate-pulse' : ''}`} onClick={() => onCardClick('income')}>
                <div className="flex justify-between items-center mb-2"><span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.income}</span><TrendingUp className="text-green-500" size={18} /></div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatMoney(income, currency)}</div>
            </div>
        </div>
    );
}
