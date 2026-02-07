import { Wallet, Download, X, Trash2 } from 'lucide-react';
import React from 'react';

import TransactionItem from './TransactionItem';

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
    onClearHistory, // New prop
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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setHistoryFilter('all');
                                }}
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
                        aria-label={t.export || 'Export transactions'}
                        title={t.export}
                    >
                        <Download size={16} />
                    </button>
                </div>
            </div>

            <div className="overflow-auto p-0 flex-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                {transactions.map((tData) => (
                    <TransactionItem
                        key={tData.id}
                        tData={tData}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onToggleHidden={onToggleHidden}
                        getCategoryStyles={getCategoryStyles}
                        formatMoney={formatMoney}
                        currency={currency}
                        lang={lang}
                        t={t}
                    />
                ))}

                {hasMore && historyFilter === 'all' && !isCustomRange && (
                    <div className="p-4 text-center">
                        <button
                            onClick={loadMore}
                            className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            {t.load_more}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
