import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
        if (editingLoan) {
            setName(editingLoan.name);
            setTotal(editingLoan.totalAmount);
            setCurrent(editingLoan.currentBalance);
            setRate(editingLoan.interestRate);
            setCurrency(editingLoan.currency);
            setMinPayment(editingLoan.minPayment || '');
            setDueDate(editingLoan.dueDate || '');
        } else {
            setName(''); setTotal(''); setCurrent(''); setRate(''); setCurrency('UAH'); setMinPayment(''); setDueDate('');
        }
    }, [editingLoan, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ 
            name, 
            totalAmount: total, 
            currentBalance: current !== '' ? current : total, 
            interestRate: rate, 
            currency, 
            minPayment, 
            dueDate 
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                        {editingLoan ? t.edit_credit : t.add_credit}
                    </h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">{t.credit_name}</label>
                        <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">{t.total_debt}</label>
                            <input type="number" value={total} onChange={e=>setTotal(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none" required />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">{t.currency}</label>
                            <select value={currency} onChange={e=>setCurrency(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none cursor-pointer font-bold">
                                {Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">{t.current_balance}</label>
                        <input type="number" value={current} onChange={e=>setCurrent(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none" />
                    </div>
                    
                    {/* UPDATED: Uses t.min_payment and t.due_date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">{t.min_payment}</label>
                            <input type="number" value={minPayment} onChange={e=>setMinPayment(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none" placeholder="0.00" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">{t.due_date}</label>
                            <input type="number" min="1" max="31" placeholder={t.due_date_placeholder} value={dueDate} onChange={e=>setDueDate(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">{t.interest_rate}</label>
                        <input type="number" value={rate} onChange={e=>setRate(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">{t.save_btn}</button>
                </form>
            </div>
        </div>
    );
}