import { Plus, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';

export default function LimitsManager({
    categories,
    limits,
    onSaveLimit,
    onDeleteCategory,
    currency,
    t,
    getCategoryName,
}) {
    const [isEditingLimit, setIsEditingLimit] = useState(false);

    const LimitEditor = () => (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-4 shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold dark:text-white text-sm uppercase tracking-wider">
                        {t.add_limit_label}
                    </h3>
                    <button
                        onClick={() => setIsEditingLimit(false)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {categories
                        .filter((c) => c.type === 'expense')
                        .map((cat) => (
                            <div
                                key={cat.id}
                                className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700"
                            >
                                <span className="text-sm font-bold dark:text-white flex items-center gap-2 truncate">
                                    {cat.icon &&
                                        React.createElement(cat.icon, {
                                            size: 16,
                                            className: cat.textColor,
                                        })}
                                    <span className="truncate max-w-[120px]">
                                        {getCategoryName(cat)}
                                    </span>
                                </span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder={t.limit_placeholder}
                                        className="w-20 p-2 text-right bg-white dark:bg-slate-700 rounded-lg text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-blue-500 transition-colors dark:text-white"
                                        defaultValue={limits[cat.id] || ''}
                                        onBlur={(e) => onSaveLimit(cat.id, e.target.value)}
                                    />
                                    <span className="text-xs text-slate-400 font-bold">
                                        {currency}
                                    </span>
                                </div>
                            </div>
                        ))}
                </div>
                <button
                    onClick={() => setIsEditingLimit(false)}
                    className="w-full mt-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity text-sm"
                >
                    {t.save_btn}
                </button>
            </div>
        </div>
    );

    return (
        <div className="mb-6">
            {isEditingLimit && <LimitEditor />}

            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-xs uppercase text-slate-500">{t.limits_title}</h3>
                <button
                    onClick={() => setIsEditingLimit(true)}
                    className="text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded-lg transition-colors"
                >
                    <Plus size={14} /> {t.add_limit_btn}
                </button>
            </div>

            <div className="space-y-2 mb-6">
                {categories
                    .filter((c) => c.type === 'expense' && limits[c.id] > 0)
                    .map((c) => (
                        <div
                            key={c.id}
                            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700"
                        >
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${c.color} ${c.textColor}`}
                            >
                                {c.icon && React.createElement(c.icon, { size: 14 })}
                            </div>
                            <div className="flex-1 text-sm font-bold dark:text-white truncate">
                                {getCategoryName(c)}
                            </div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-700 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                                {limits[c.id]}{' '}
                                <span className="text-xs text-slate-400">{currency}</span>
                            </div>
                            <button
                                onClick={() => onSaveLimit(c.id, 0)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                {categories.filter((c) => c.type === 'expense' && limits[c.id] > 0).length ===
                    0 && (
                    <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                        {t.no_limits_set}
                    </div>
                )}
            </div>

            {['expense', 'income'].map((type) => {
                const customCats = categories.filter((c) => c.type === type && c.isCustom);
                if (customCats.length === 0) return null;
                return (
                    <div key={type} className="mb-4">
                        <h3 className="font-bold text-xs uppercase text-slate-500 mb-3">
                            {t[`custom_${type}_title`]}
                        </h3>
                        <div className="space-y-2">
                            {customCats.map((c) => (
                                <div
                                    key={c.id}
                                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-8 h-8 rounded-full ${c.color} flex items-center justify-center text-white shadow-sm`}
                                        >
                                            {c.icon && React.createElement(c.icon, { size: 14 })}
                                        </div>
                                        <span className="text-sm font-bold dark:text-white">
                                            {c.name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => onDeleteCategory(c.id)}
                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
