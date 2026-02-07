import { Pencil, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import React, { memo } from 'react';

const TransactionItem = memo(
    ({
        tData,
        onEdit,
        onDelete,
        onToggleHidden,
        getCategoryStyles,
        formatMoney,
        currency,
        lang,
        t,
    }) => {
        const style = getCategoryStyles(tData.category);
        const amount = Number(tData.amount) || 0;

        return (
            <div
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
                            {tData.isRecurring && (
                                <RefreshCw
                                    size={10}
                                    className="text-indigo-500"
                                    aria-hidden="true"
                                />
                            )}
                            {tData.description}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            {tData.date} {tData.userName && <span>• {tData.userName}</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div
                        className={`font-bold ${tData.type === 'income' ? 'text-green-600' : 'text-slate-900 dark:text-white'} ${tData.isHidden ? 'opacity-50 line-through' : ''}`}
                    >
                        {tData.type === 'income' ? '+' : '-'}
                        {formatMoney(amount, currency)}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleHidden(tData);
                            }}
                            className="text-slate-300 hover:text-indigo-500 p-1"
                            title={
                                tData.isHidden
                                    ? lang === 'ua'
                                        ? 'Врахувати'
                                        : 'Include'
                                    : lang === 'ua'
                                      ? 'Ігнорувати'
                                      : 'Ignore'
                            }
                        >
                            {tData.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(tData);
                            }}
                            className="text-slate-300 hover:text-blue-500 p-1"
                            aria-label={t.edit_transaction || 'Edit'}
                        >
                            <Pencil size={14} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(tData.id);
                            }}
                            className="text-slate-300 hover:text-red-500 p-1"
                            aria-label={t.delete || 'Delete'}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }
);

TransactionItem.displayName = 'TransactionItem';

export default TransactionItem;
