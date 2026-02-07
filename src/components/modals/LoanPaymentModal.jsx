import { X } from 'lucide-react';
import React, { useState } from 'react';

export default function LoanPaymentModal({ isOpen, onClose, onPayment, loan, currencySymbol, t }) {
    const [amount, setAmount] = useState('');

    if (!isOpen || !loan) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onPayment(amount, loan);
        setAmount('');
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                        Pay: {loan.name}
                    </h3>
                    <button onClick={onClose}>
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>
                <div className="mb-4 text-center">
                    <div className="text-xs text-slate-500">{t.current_balance}</div>
                    <div className="text-2xl font-bold dark:text-white">
                        {currencySymbol}
                        {loan.currentBalance}
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500">{t.payment_amount}</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none text-xl font-bold"
                            required
                            min="0.01"
                            step="0.01"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-3 rounded-xl font-bold"
                    >
                        {t.confirm_payment}
                    </button>
                </form>
            </div>
        </div>
    );
}
