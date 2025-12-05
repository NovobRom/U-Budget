import React from 'react';
import { CreditCard, Download, Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react';

export default function CreditsView({ 
    loans, totalCreditDebt, currency, formatMoney, t, 
    onAddLoan, onEditLoan, onDeleteLoan, onPayLoan, onExport 
}) {
    const activeLoans = loans.filter(l => l.currentBalance > 0);
    const paidLoans = loans.filter(l => l.currentBalance <= 0);

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-red-100 font-medium">{t.total_credit_debt}</span>
                    <CreditCard size={24} className="text-red-100 opacity-50" />
                </div>
                <div className="text-3xl font-bold tracking-tight">{formatMoney(totalCreditDebt, currency)}</div>
            </div>

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold dark:text-white">{t.active_loans}</h2>
                <div className="flex gap-2">
                    <button onClick={onExport} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Download size={16}/></button>
                    <button onClick={onAddLoan} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Plus size={16}/> {t.add_credit}</button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeLoans.length > 0 ? activeLoans.map(loan => {
                    const progress = loan.totalAmount > 0 ? Math.min(100, Math.max(0, ((loan.totalAmount - loan.currentBalance) / loan.totalAmount) * 100)) : 0;
                    
                    return (
                        <div key={loan.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm text-left border border-slate-100 dark:border-slate-800 relative group">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => onEditLoan(loan)} className="text-slate-300 hover:text-blue-500"><Pencil size={14}/></button><button onClick={() => onDeleteLoan(loan.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button></div>
                            <div className="flex justify-between pr-8 mb-1"><div className="font-bold text-lg dark:text-white">{loan.name}</div><div className="text-lg font-bold">{formatMoney(loan.currentBalance, loan.currency || 'UAH')}</div></div>
                            
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mb-2">
                                <div className="bg-teal-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 mb-3">
                                <span>{progress.toFixed(0)}% {t.paid_off}</span>
                                <span>{t.total_debt}: {formatMoney(loan.totalAmount, loan.currency || 'UAH')}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                                {loan.minPayment > 0 && <div>{t.min_payment}: <span className="font-bold">{formatMoney(loan.minPayment, loan.currency || 'UAH')}</span></div>}
                                {loan.dueDate > 0 && <div>{t.due_date}: <span className="font-bold">{loan.dueDate}</span></div>}
                            </div>

                            <button onClick={() => onPayLoan(loan)} className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 font-bold rounded-lg text-sm">{t.pay_now}</button>
                        </div>
                    );
                }) : <div className="col-span-full text-center py-8 text-slate-400">{t.no_credits}</div>}
            </div>

            {paidLoans.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 border-t border-slate-200 dark:border-slate-800 pt-6">{t.loan_history}</h3>
                    <div className="space-y-3">
                        {paidLoans.map(loan => (
                            <div key={loan.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 opacity-75">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle2 size={20}/></div>
                                    <div>
                                        <div className="font-bold text-sm text-slate-700 dark:text-slate-300">{loan.name}</div>
                                        <div className="text-xs text-slate-400">{t.total_debt}: {formatMoney(loan.totalAmount, loan.currency)}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-green-600 uppercase">{t.paid_off}</div>
                                    <button onClick={() => onDeleteLoan(loan.id)} className="text-slate-300 hover:text-red-500 mt-1"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}