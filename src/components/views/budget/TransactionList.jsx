import React from 'react';
import { Wallet, Pencil, Trash2, RefreshCw, Download, X, Eye, EyeOff } from 'lucide-react';

/**
 * TransactionList
 * Added accessibility labels (aria-label) for interactive elements.
 */
export default function TransactionList({
    transactions,
    onEdit,
    onDelete,
    onExport,
    getCategoryStyles,
    formatMoney,
    currency,
    t,
    hasMore,
    loadMore,
    historyFilter,
    setHistoryFilter,
    isCustomRange,
    lang,
    // exchangeRate removed - transactions already converted by useTransactions
    onToggleHidden, // New prop
    onClearHistory // New prop
}) {
    if (transactions.length === 0) {
        return (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2 h-full justify-center">
                <Wallet size={48} className="opacity-20 mb-2" aria-hidden="true" />
                {t.no_trans}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center font-bold shrink-0">
                <div className="flex items-center gap-2">
                    <span>{t.history}</span>
                    {historyFilter !== 'all' && (
                        <span className="px-2 py-0.5 text-[10px] uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg flex items-center gap-1">
                            {t[historyFilter]}
                            <button
                                onClick={(e) => { e.stopPropagation(); setHistoryFilter('all'); }}
                                aria-label="Clear filter"
                            >
                                <X size={10} />
                            </button>
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {transactions.length > 0 && onClearHistory && (
                        <button
                            onClick={onClearHistory}
                            className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            aria-label={t.clear_history}
                            title={t.clear_history}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                    <button
                        onClick={() => onExport(transactions)}
                        className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl hover:bg-slate-200 transition-colors"
                        aria-label={t.export || "Export transactions"}
                        title={t.export}
                    >
                        <Download size={16} />
                    </button>
                </div>
            </div>

            <div className="overflow-auto p-0 flex-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                {transactions.map(tData => {
                    const style = getCategoryStyles(tData.category);
                    const amount = Number(tData.amount) || 0; // Already converted by useTransactions

                    return (
                        <div
                            key={tData.id}
                            className={`flex justify-between items-center p-4 border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors group ${tData.isHidden ? 'opacity-50 grayscale bg-slate-50 dark:bg-slate-800/50' : ''}`}
                            onClick={() => onEdit(tData)}
                            role="button"
                            tabIndex={0}
                            onKeyPress={(e) => e.key === 'Enter' && onEdit(tData)}
                        >
                            <div className="flex gap-3 items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${style.color.includes('bg-') ? style.color.replace('bg-', 'bg-opacity-20 bg-') : 'bg-slate-100'} ${style.textColor.replace('text-white', 'text-slate-600')}`}
                                    aria-hidden="true"
                                >
                                    {style.icon && React.createElement(style.icon, { size: 18 })}
                                </div>
                                <div>
                                    <div className="font-bold text-sm dark:text-slate-200">{style.name}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                        {tData.isRecurring && <RefreshCw size={10} className="text-indigo-500" aria-hidden="true" />}
                                        {tData.description}
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                        {tData.date} {tData.userName && <span>• {tData.userName}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`font-bold ${tData.type === 'income' ? 'text-green-600' : 'text-slate-900 dark:text-white'} ${tData.isHidden ? 'opacity-50 line-through' : ''}`}>
                                    {tData.type === 'income' ? '+' : '-'}{formatMoney(amount, currency)}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onToggleHidden(tData); }}
                                        className="text-slate-300 hover:text-indigo-500 p-1"
                                        title={tData.isHidden ? (lang === 'ua' ? 'Врахувати' : 'Include') : (lang === 'ua' ? 'Ігнорувати' : 'Ignore')}
                                    >
                                        {tData.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit(tData); }}
                                        className="text-slate-300 hover:text-blue-500 p-1"
                                        aria-label={t.edit_transaction || "Edit"}
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(tData.id); }}
                                        className="text-slate-300 hover:text-red-500 p-1"
                                        aria-label={t.delete || "Delete"}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {hasMore && historyFilter === 'all' && !isCustomRange && (
                    <div className="p-4 text-center">
                        <button onClick={loadMore} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
                            {lang === 'ua' ? 'Завантажити ще...' : 'Load more...'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}