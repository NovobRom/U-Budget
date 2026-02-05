import { X } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { CURRENCIES } from '../../constants';

export default function LoanModal({ isOpen, onClose, onSave, editingLoan, t }) {
    const [name, setName] = useState('');
    const [total, setTotal] = useState('');
    const [current, setCurrent] = useState('');
    const [rate, setRate] = useState('');
    const [currency, setCurrency] = useState('UAH');
    const [minPayment, setMinPayment] = useState('');
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (editingLoan) {
                setName(editingLoan.name || '');
                setTotal(editingLoan.totalAmount?.toString() || '');
                setCurrent(editingLoan.currentBalance?.toString() || '');
                setRate(editingLoan.interestRate?.toString() || '');
                setCurrency(editingLoan.currency || 'UAH');
                setMinPayment(editingLoan.minPayment?.toString() || '');
                setDueDate(editingLoan.dueDate?.toString() || '');
            } else {
                setName('');
                setTotal('');
                setCurrent('');
                setRate('');
                setCurrency('UAH');
                setMinPayment('');
                setDueDate('');
            }
        }
    }, [editingLoan, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        // QA Check: Convert all numeric inputs to Numbers before saving to Firestore
        const totalVal = parseFloat(total) || 0;
        const currentVal = current !== '' ? parseFloat(current) : totalVal;

        onSave({
            name: name.trim(),
            totalAmount: totalVal,
            currentBalance: currentVal,
            interestRate: parseFloat(rate) || 0,
            currency,
            minPayment: parseFloat(minPayment) || 0,
            dueDate: parseInt(dueDate) || 0,
        });

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                        {editingLoan ? t.edit_credit : t.add_credit}
                    </h3>
                    <button onClick={onClose}>
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                            {t.credit_name}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none dark:text-white"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">
                                {t.total_debt}
                            </label>
                            <input
                                type="number"
                                value={total}
                                onChange={(e) => setTotal(e.target.value)}
                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none dark:text-white"
                                required
                                step="any"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">
                                {t.currency}
                            </label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none cursor-pointer font-bold dark:text-white"
                            >
                                {Object.keys(CURRENCIES).map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                            {t.current_balance}
                        </label>
                        <input
                            type="number"
                            value={current}
                            onChange={(e) => setCurrent(e.target.value)}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none dark:text-white"
                            placeholder={total || '0.00'}
                            step="any"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">
                                {t.min_payment}
                            </label>
                            <input
                                type="number"
                                value={minPayment}
                                onChange={(e) => setMinPayment(e.target.value)}
                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none dark:text-white"
                                placeholder="0.00"
                                step="any"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">
                                {t.due_date}
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                placeholder={t.due_date_placeholder}
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                            {t.interest_rate} (%)
                        </label>
                        <input
                            type="number"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none dark:text-white"
                            step="any"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors"
                    >
                        {t.save_btn}
                    </button>
                </form>
            </div>
        </div>
    );
}
