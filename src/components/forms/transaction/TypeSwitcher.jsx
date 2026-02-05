import React from 'react';

export default function TypeSwitcher({ type, setType, t }) {
    return (
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                    type === 'expense'
                        ? 'bg-white dark:bg-slate-700 shadow text-red-500'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
            >
                {t.expense}
            </button>
            <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                    type === 'income'
                        ? 'bg-white dark:bg-slate-700 shadow text-green-500'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
            >
                {t.income}
            </button>
        </div>
    );
}
