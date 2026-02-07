import { X } from 'lucide-react';
import React from 'react';

import { CURRENCIES } from '../../constants';
import { useTransactionForm } from '../../hooks/useTransactionForm';
import CategoryGrid from '../forms/transaction/CategoryGrid';
import TypeSwitcher from '../forms/transaction/TypeSwitcher';

export default function TransactionModal({
    isOpen,
    onClose,
    onSave,
    categories,
    currencyCode,
    t,
    editingTransaction,
    getCategoryName,
    onAddCategory,
}) {
    const {
        amount,
        setAmount,
        selectedCurrency,
        setSelectedCurrency,
        exchangeRate,
        isCalculating,
        exchangeRateError,
        category,
        setCategory,
        description,
        setDescription,
        type,
        setType,
        date,
        setDate,
        handleSubmit,
    } = useTransactionForm(isOpen, editingTransaction, currencyCode, onSave, onClose);

    if (!isOpen) return null;

    const convertedAmount =
        amount && !isNaN(amount) ? (parseFloat(amount) * exchangeRate).toFixed(2) : '0.00';

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-modal-title"
        >
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3
                        id="transaction-modal-title"
                        className="font-bold text-lg text-slate-900 dark:text-white"
                    >
                        {editingTransaction ? t.edit_transaction : t.add_transaction}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type Switcher */}
                    <TypeSwitcher type={type} setType={setType} t={t} />

                    {/* Amount Input */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
                            {t.amount}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none dark:text-white text-lg font-bold"
                                placeholder="0.00"
                                required
                                step="any"
                            />
                            <select
                                value={selectedCurrency}
                                onChange={(e) => setSelectedCurrency(e.target.value)}
                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none cursor-pointer font-bold dark:text-white"
                            >
                                {Object.keys(CURRENCIES).map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {selectedCurrency !== currencyCode && amount && (
                            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                {isCalculating ? (
                                    <span className="animate-pulse">Calculating...</span>
                                ) : exchangeRateError ? (
                                    <span className="text-red-500">{exchangeRateError}</span>
                                ) : (
                                    <span>
                                        ≈ {convertedAmount} {currencyCode} (Rate:{' '}
                                        {exchangeRate.toFixed(4)})
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Category Grid */}
                    <CategoryGrid
                        categories={categories}
                        type={type}
                        category={category}
                        setCategory={setCategory}
                        getCategoryName={getCategoryName}
                        onAddCategory={onAddCategory}
                        t={t}
                    />

                    {/* Description */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
                            {t.description}
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none dark:text-white"
                            placeholder={t.description_placeholder || 'Coffee, groceries, etc.'}
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
                            {t.date}
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none dark:text-white cursor-pointer font-bold"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors"
                    >
                        {t.save_btn || 'Save'}
                    </button>
                </form>
            </div>
        </div>
    );
}
