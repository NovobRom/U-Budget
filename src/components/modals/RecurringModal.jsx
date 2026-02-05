import { X, RefreshCw, Calendar, ArrowRight } from 'lucide-react';
import React, { useMemo } from 'react';

export default function RecurringModal({
    isOpen,
    onClose,
    transactions,
    onAdd,
    formatMoney,
    currency,
    t,
}) {
    if (!isOpen) return null;

    // Знаходимо унікальні регулярні платежі (за описом), беремо найсвіжіші
    const uniqueRecurring = useMemo(() => {
        const map = {};
        transactions.forEach((tx) => {
            if (tx.isRecurring) {
                // Використовуємо опис + категорію як унікальний ключ
                const key = `${tx.description}-${tx.category}`;
                // Якщо такого ще немає або цей новіший - записуємо
                if (!map[key] || new Date(tx.date) > new Date(map[key].date)) {
                    map[key] = tx;
                }
            }
        });
        // Сортуємо: новіші зверху
        return Object.values(map).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions]);

    const handleAdd = (tx) => {
        // Створюємо копію транзакції на сьогодні
        const newTx = {
            ...tx,
            date: new Date().toISOString().split('T')[0], // Сьогоднішня дата
            createdAt: null, // Firebase створить новий час
        };
        // Видаляємо ID старої транзакції, щоб створилася нова
        delete newTx.id;

        onAdd(newTx);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        <RefreshCw size={20} className="text-blue-500" />
                        {t.recurring_title}
                    </h3>
                    <button onClick={onClose}>
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="space-y-3">
                    {uniqueRecurring.length > 0 ? (
                        uniqueRecurring.map((tx) => (
                            <div
                                key={tx.id}
                                className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center group"
                            >
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white">
                                        {tx.description}
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                        <Calendar size={10} /> {t.last_payment} {tx.date}
                                    </div>
                                    <div className="font-bold text-sm mt-1 text-slate-700 dark:text-slate-300">
                                        {formatMoney(tx.amount, currency)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAdd(tx)}
                                    className="bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                                >
                                    {t.add_now} <ArrowRight size={12} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-slate-400 py-8 text-sm">
                            {t.recurring_empty}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
