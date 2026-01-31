import React, { useState, useEffect } from 'react';
import { X, Calendar, RefreshCw, Loader2, Star, FileText } from 'lucide-react';
import { CURRENCIES } from '../constants';
import { fetchExchangeRate } from '../utils/currency';

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
    const [amount, setAmount] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState(currencyCode || 'EUR');
    const [exchangeRate, setExchangeRate] = useState(1);
    const [isCalculating, setIsCalculating] = useState(false);
    const [exchangeRateError, setExchangeRateError] = useState(null);
    
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('expense');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isRecurring, setIsRecurring] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editingTransaction) {
                const transOriginalCurrency = editingTransaction.originalCurrency || currencyCode || 'EUR';
                // Always display positive amount for editing
                const transOriginalAmount = Math.abs(editingTransaction.originalAmount || editingTransaction.amount);
                
                setAmount(transOriginalAmount.toString());
                setSelectedCurrency(transOriginalCurrency);
                setCategory(editingTransaction.category);
                setDescription(editingTransaction.description);
                setType(editingTransaction.type);
                setDate(editingTransaction.date);
                setIsRecurring(editingTransaction.isRecurring || false);
            } else {
                setAmount('');
                setSelectedCurrency(currencyCode || 'EUR');
                setExchangeRate(1);
                setExchangeRateError(null);
                setCategory('');
                setDescription('');
                setType('expense');
                setDate(new Date().toISOString().split('T')[0]);
                setIsRecurring(false);
            }
        }
    }, [isOpen, editingTransaction, currencyCode]);

    // Effect for rate recalculation
    useEffect(() => {
        let isMounted = true;

        const getRate = async () => {
            if (selectedCurrency === currencyCode) {
                if(isMounted) {
                    setExchangeRate(1);
                    setExchangeRateError(null);
                }
                return;
            }

            if (!amount) return;

            if(isMounted) setIsCalculating(true);
            try {
                const rate = await fetchExchangeRate(selectedCurrency, currencyCode);
                if(isMounted) {
                    setExchangeRate(rate);
                    setExchangeRateError(null);
                }
            } catch(e) {
                console.error(e);
                if(isMounted) {
                    setExchangeRateError(e.message);
                }
            } finally {
                if(isMounted) setIsCalculating(false);
            }
        };

        const timer = setTimeout(() => {
            if (isOpen) getRate();
        }, 500);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [amount, selectedCurrency, currencyCode, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        // Ensure strictly positive amount from input
        const positiveAmount = Math.abs(parseFloat(amount));
        const finalAmountInMainCurrency = positiveAmount * exchangeRate;

        onSave({
            amount: finalAmountInMainCurrency,
            originalAmount: positiveAmount,
            originalCurrency: selectedCurrency,
            exchangeRate: exchangeRate,
            category: category || 'other',
            description,
            type, // 'income' or 'expense' logic handled in useBudget
            date,
            isRecurring
        });
        onClose();
    };

    const convertedPreview = amount ? (Math.abs(parseFloat(amount)) * exchangeRate).toFixed(2) : '0.00';
    const currentInputSymbol = CURRENCIES[selectedCurrency]?.symbol || '$';

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
                    {/* TYPE SWITCHER */}
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

                    {/* AMOUNT */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                            {t.amount_currency}
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg pointer-events-none">
                                    {currentInputSymbol}
                                </div>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white text-lg font-bold"
                                    required
                                    min="0.01"
                                    step="any"
                                />
                            </div>
                            <select 
                                value={selectedCurrency}
                                onChange={(e) => setSelectedCurrency(e.target.value)}
                                className="w-24 px-2 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-white cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {Object.keys(CURRENCIES).map(code => (
                                    <option key={code} value={code}>{code}</option>
                                ))}
                            </select>
                        </div>
                        
                        {selectedCurrency !== currencyCode && amount && (
                            <div className="mt-2 text-right text-xs font-medium flex justify-end items-center gap-2 text-slate-500 dark:text-slate-400">
                                {isCalculating ? (
                                    <><Loader2 size={12} className="animate-spin"/> ...</>
                                ) : (
                                    <>
                                        <span>Rate: {exchangeRate.toFixed(4)}</span>
                                        <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                            ≈ {currencySymbol}{convertedPreview}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}

                        {exchangeRateError && (
                            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                                    ⚠️ {t.exchange_rate_error || 'Could not fetch rate. Using last known or manual input required.'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* CATEGORY GRID */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">
                                {t.category}
                            </label>
                            <button type="button" onClick={onAddCategory} className="text-xs font-bold text-blue-500 hover:underline">
                                + {t.add_category}
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                            {categories
                                .filter(c => c.type === type || (c.id === 'other'))
                                .map(c => {
                                    const IconToRender = c.icon || Star;
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setCategory(c.id)}
                                            className={`flex flex-col items-center justify-start p-2 rounded-xl border transition-all gap-1 h-auto min-h-[80px] ${
                                                category === c.id
                                                ? `border-${c.color?.replace('bg-', '') || 'blue-500'} bg-${c.color?.replace('bg-', '') || 'blue-500'}/10`
                                                : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 min-w-[2rem] min-h-[2rem] rounded-full flex items-center justify-center text-white text-xs ${c.color || 'bg-slate-400'}`}>
                                                <IconToRender size={14} />
                                            </div>
                                            <span className={`text-[10px] leading-tight text-center whitespace-normal break-normal w-full ${category === c.id ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                                {getCategoryName(c)}
                                            </span>
                                        </button>
                                    );
                                })
                            }
                        </div>
                    </div>

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