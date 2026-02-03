import React, { useState } from 'react';
import { Loader2, Check, RefreshCw, Smartphone } from 'lucide-react';
import { useMonobankStore } from '../../store/useMonobankStore';
import { fetchClientInfo, fetchStatements } from '../../services/monobank.service';
import { getCategoryByMcc } from '../../utils/mccCodes';
import toast from 'react-hot-toast';

export default function MonobankConnect({ lang, onSyncTransactions, existingTransactions = [] }) {
    const { token, setToken, accounts, setAccounts, lastSyncTime, setLastSyncTime, isLoading } = useMonobankStore();
    const [inputToken, setInputToken] = useState(token);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const handleConnect = async () => {
        if (!inputToken) return;
        setLoading(true);
        try {
            const data = await fetchClientInfo(inputToken);
            await setToken(inputToken);
            await setAccounts(data.accounts);
            toast.success(lang === 'ua' ? 'Monobank успішно підключено!' : 'Monobank connected successfully!');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        const now = Date.now();
        // Allow sync if 60s passed
        if (now - lastSyncTime < 60000) {
            const waitSec = Math.ceil((60000 - (now - lastSyncTime)) / 1000);
            toast.error(lang === 'ua' ? `Зачекайте ${waitSec} с` : `Wait ${waitSec}s`);
            return;
        }

        setSyncing(true);
        try {
            // 1. Refresh Accounts (Balance)
            const clientData = await fetchClientInfo(token);
            await setAccounts(clientData.accounts);

            // 2. Fetch Transactions (Statements) - Last 31 days (max allowed is 31 days + 1 hour)
            const to = Math.floor(now / 1000);
            const from = to - (30 * 24 * 60 * 60); // 30 days ago

            let newTxCount = 0;

            // Limit: fetch only for first 2 active accounts to avoid hitting rate limits instantly
            // Realistically user has 1-2 main cards (UAH [980], USD [840], EUR [978])
            // Monobank rate limit is Global for token? Or per endpoint? It says "1 request per 60s" per endpoint usually.
            // Actually, "Statement" endopint has specific limits.
            // Let's try fetching ONLY for the first account (Black card usually) for now to be safe.
            const mainAccount = clientData.accounts.find(a => a.currencyCode === 980); // UAH

            if (mainAccount && onSyncTransactions) {
                const statements = await fetchStatements(token, mainAccount.id, from, to);
                if (Array.isArray(statements)) {
                    // Filter duplicates
                    // We check if we already have a transaction with this monobankId
                    // OR if we don't store monobankId, we check time & amount matches

                    const newItems = statements.filter(stmt => {
                        const exists = existingTransactions.some(tx =>
                            tx.monobankId === stmt.id ||
                            (tx.date === new Date(stmt.time * 1000).toISOString().split('T')[0] && tx.amount === Math.abs(stmt.amount / 100) && tx.description === stmt.description)
                        );
                        return !exists;
                    });

                    for (const item of newItems) {
                        const isExpense = item.amount < 0;
                        const amount = Math.abs(item.amount / 100);
                        const categoryId = getCategoryByMcc(item.mcc);

                        // Construct U-Budget Transaction
                        const newTx = {
                            amount: amount,
                            type: isExpense ? 'expense' : 'income',
                            category: isExpense ? categoryId : 'salary', // simple fallback for income
                            date: new Date(item.time * 1000).toISOString().split('T')[0],
                            description: item.description,
                            monobankId: item.id,
                            originalCurrency: 'UAH', // Simplified
                            originalAmount: item.amount / 100
                        };

                        await onSyncTransactions(newTx, null); // null = not editing
                        newTxCount++;
                    }
                }
            }

            await setLastSyncTime(Date.now());
            if (newTxCount > 0) {
                toast.success(lang === 'ua' ? `Додано ${newTxCount} транзакцій` : `Added ${newTxCount} transactions`);
            } else {
                toast.success(lang === 'ua' ? 'Баланс оновлено' : 'Balance synced');
            }

        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">m</span>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Monobank</h3>
                    <p className="text-xs text-slate-500">{accounts.length > 0 ? (lang === 'ua' ? 'Підключено' : 'Connected') : (lang === 'ua' ? 'Не підключено' : 'Not connected')}</p>
                </div>
            </div>

            {!accounts.length ? (
                <div className="space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {lang === 'ua'
                            ? 'Введіть X-Token з api.monobank.ua для синхронізації.'
                            : 'Enter X-Token from api.monobank.ua to sync.'}
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm"
                            placeholder="X-Token..."
                            value={inputToken}
                            onChange={(e) => setInputToken(e.target.value)}
                        />
                        <button
                            onClick={handleConnect}
                            disabled={loading || !inputToken}
                            className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {accounts.map(acc => (
                            <div key={acc.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="text-slate-400">
                                        <Smartphone size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{acc.maskedPan ? acc.maskedPan[0] : 'Рахунок'}</p>
                                        <p className="text-[10px] text-slate-500">{acc.currencyCode === 980 ? 'UAH' : (acc.currencyCode === 840 ? 'USD' : 'EUR')}</p>
                                    </div>
                                </div>
                                <div className="font-mono text-sm font-bold">
                                    {(acc.balance / 100).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        {lang === 'ua' ? 'Оновити баланс і транзакції' : 'Sync Balance & Transactions'}
                    </button>

                    <div className="text-[10px] text-center text-slate-400">
                        Rate Limit: 1 request / 60 sec
                    </div>
                </div>
            )}
        </div>
    );
}
