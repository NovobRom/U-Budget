import React from 'react';
import { X, Calendar, RefreshCw, FileText } from 'lucide-react';
import { useTransactionForm } from '../hooks/useTransactionForm';
import TypeSwitcher from './forms/transaction/TypeSwitcher';
import AmountInput from './forms/transaction/AmountInput';
import CategoryGrid from './forms/transaction/CategoryGrid';

export default function TransactionForm({
    isOpen,
    onClose,
    onSave,
    editingTransaction,
    categories,
    t,
    currencySymbol,
    currencyCode,
    getCategoryName,
    onAddCategory
}) {
    const {
        amount, setAmount,
        selectedCurrency, setSelectedCurrency,
        exchangeRate, isCalculating, exchangeRateError,
        category, setCategory,
        description, setDescription,
        type, setType,
        date, setDate,
        isRecurring, setIsRecurring,
        handleSubmit
    } = useTransactionForm(isOpen, editingTransaction, currencyCode, onSave, onClose);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                        {editingTransaction ? t.edit_transaction : t.add_transaction}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <TypeSwitcher type={type} setType={setType} t={t} />

                    <AmountInput
                        amount={amount} setAmount={setAmount}
                        selectedCurrency={selectedCurrency} setSelectedCurrency={setSelectedCurrency}
                        currencyCode={currencyCode} currencySymbol={currencySymbol}
                        exchangeRate={exchangeRate} isCalculating={isCalculating} exchangeRateError={exchangeRateError}
                        t={t}
                    />

                    <CategoryGrid
                        categories={categories} type={type}
                        category={category} setCategory={setCategory}
                        getCategoryName={getCategoryName} onAddCategory={onAddCategory}
                        t={t}
                    />

                    {/* DATE & DESC */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                                {t.date}
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm font-medium appearance-none"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                                {t.description}
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="..."
                                    className="w-full pl-10 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* RECURRING CHECKBOX */}
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => setIsRecurring(!isRecurring)}>
                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${isRecurring ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 dark:border-slate-600 dark:bg-slate-700'}`}>
                            {isRecurring && <RefreshCw size={12} />}
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 select-none">
                            {t.isRecurring_label}
                        </span>
                    </div>

                    <button
                        type="submit"
                        disabled={!amount || !category}
                        className="w-full bg-slate-900 dark:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {t.save_btn}
                    </button>
                </form>
            </div>
        </div>
    );
}
