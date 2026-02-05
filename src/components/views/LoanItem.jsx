import { Pencil, Trash2 } from 'lucide-react';
import React, { memo } from 'react';

const LoanItem = memo(({
    loan,
    formatMoney,
    t,
    onEditLoan,
    onDeleteLoan,
    onPayLoan,
}) => {
    const progress =
        loan.totalAmount > 0
            ? Math.min(
                100,
                Math.max(
                    0,
                    ((loan.totalAmount - loan.currentBalance) /
                        loan.totalAmount) *
                    100
                )
            )
            : 0;

    return (
        <div
            className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm text-left border border-slate-100 dark:border-slate-800 relative group"
        >
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEditLoan(loan)}
                    className="text-slate-300 hover:text-blue-500"
                    aria-label={t.edit_credit || 'Edit loan'}
                    title={t.edit_credit}
                >
                    <Pencil size={14} aria-hidden="true" />
                </button>
                <button
                    onClick={() => onDeleteLoan(loan.id)}
                    className="text-slate-300 hover:text-red-500"
                    aria-label={t.delete || 'Delete'}
                    title={t.delete}
                >
                    <Trash2 size={14} aria-hidden="true" />
                </button>
            </div>
            <div className="flex justify-between pr-8 mb-1">
                <div className="font-bold text-lg dark:text-white">
                    {loan.name}
                </div>
                <div className="text-lg font-bold">
                    {formatMoney(loan.currentBalance, loan.currency || 'UAH')}
                </div>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mb-2">
                <div
                    className="bg-teal-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-3">
                <span>
                    {progress.toFixed(0)}% {t.paid_off}
                </span>
                <span>
                    {t.total_debt}:{' '}
                    {formatMoney(loan.totalAmount, loan.currency || 'UAH')}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                {loan.minPayment > 0 && (
                    <div>
                        {t.min_payment}:{' '}
                        <span className="font-bold">
                            {formatMoney(
                                loan.minPayment,
                                loan.currency || 'UAH'
                            )}
                        </span>
                    </div>
                )}
                {loan.dueDate > 0 && (
                    <div>
                        {t.due_date}:{' '}
                        <span className="font-bold">{loan.dueDate}</span>
                    </div>
                )}
            </div>

            <button
                onClick={() => onPayLoan(loan)}
                className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 font-bold rounded-lg text-sm"
            >
                {t.pay_now}
            </button>
        </div>
    );
});

LoanItem.displayName = 'LoanItem';

export default LoanItem;
