import { Settings } from 'lucide-react';
import React from 'react';

export const BudgetProgress = ({
    categories,
    transactions,
    limits,
    currency,
    formatMoney,
    onOpenSettings,
    label,
}) => {
    // Filter expenses for current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyExpenses = transactions.filter((t) => {
        const d = new Date(t.date);
        return (
            t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear
        );
    });

    const getCategorySpent = (catId) => {
        return monthlyExpenses
            .filter((t) => t.category === catId)
            .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    };

    const categoriesWithLimits = categories.filter(
        (c) => limits && limits[c.id] > 0 && c.type === 'expense'
    );

    if (categoriesWithLimits.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    {label || 'Expense Limits'}
                </h3>
                <button onClick={onOpenSettings} className="text-slate-400 hover:text-blue-500">
                    <Settings size={16} />
                </button>
            </div>
            <div className="space-y-4">
                {categoriesWithLimits.map((cat) => {
                    const spent = getCategorySpent(cat.id);
                    const limit = limits[cat.id];
                    const percent = Math.min(100, (spent / limit) * 100);
                    const isOver = spent > limit;

                    const Icon = cat.icon;

                    return (
                        <div key={cat.id}>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    {Icon && <Icon size={12} />} {cat.name}
                                </span>
                                <span className={isOver ? 'text-red-500' : 'text-slate-500'}>
                                    {formatMoney(spent, currency)} / {formatMoney(limit, currency)}
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : percent > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                    style={{ width: `${percent}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
