import React from 'react';
import { CURRENCIES } from '../../../../constants';
import { Loader2 } from 'lucide-react';

export default function AmountInput({
    amount, setAmount,
    selectedCurrency, setSelectedCurrency,
    currencyCode, currencySymbol,
    exchangeRate, isCalculating, exchangeRateError,
    t
}) {
    const currentInputSymbol = CURRENCIES[selectedCurrency]?.symbol || '$';
    const convertedPreview = amount ? (Math.abs(parseFloat(amount)) * exchangeRate).toFixed(2) : '0.00';

    return (
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
                        <><Loader2 size={12} className="animate-spin" /> ...</>
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
    );
}
