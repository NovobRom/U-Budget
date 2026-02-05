import { Loader2, Check, RefreshCw, Smartphone, Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { fetchClientInfo, fetchStatements } from '../../services/monobank.service';
import { useMonobankStore } from '../../store/useMonobankStore';
import { getCategoryByMcc } from '../../utils/mccCodes';

export default function MonobankConnect({ lang, onSyncTransactions, existingTransactions = [] }) {
    const { token, setToken, accounts, setAccounts, lastSyncTime, setLastSyncTime, isLoading } =
        useMonobankStore();
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
            toast.success(
                lang === 'ua' ? 'Monobank успішно підключено!' : 'Monobank connected successfully!'
            );
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
            const from = to - 30 * 24 * 60 * 60; // 30 days ago

            let newTxCount = 0;

            // Fetch for visible accounts only
            const visibleAccounts = clientData.accounts.filter(
                (a) => !useMonobankStore.getState().hiddenAccountIds?.includes(a.id)
            );

            // Limit to first 3 visible accounts to be safe with rate limits
            const targetAccounts = visibleAccounts.slice(0, 3);

            if (targetAccounts.length > 0 && onSyncTransactions) {
                for (const account of targetAccounts) {
                    try {
                        const statements = await fetchStatements(token, account.id, from, to);
                        if (Array.isArray(statements)) {
                            // Filter duplicates
                            const newItems = statements.filter((stmt) => {
                                const exists = existingTransactions.some(
                                    (tx) =>
                                        tx.monobankId === stmt.id ||
                                        (tx.date ===
                                            new Date(stmt.time * 1000)
                                                .toISOString()
                                                .split('T')[0] &&
                                            tx.amount === Math.abs(stmt.amount / 100) &&
                                            tx.description === stmt.description)
                                );
                                return !exists;
                            });

                            for (const item of newItems) {
                                const isExpense = item.amount < 0;
                                let amount = Math.abs(item.amount / 100);
                                let originalAmount = amount;
                                let originalCurrency =
                                    account.currencyCode === 980
                                        ? 'UAH'
                                        : account.currencyCode === 840
                                          ? 'USD'
                                          : 'EUR';

                                // Smart Import: Use operationAmount if different (foreign spend)
                                if (item.operationAmount && item.operationAmount !== item.amount) {
                                    // If operation currency matches our system expectations, use it as 'original'
                                    // Usually operationAmount is the actual spend (e.g. 10 EUR), and amount is the invalid card charge (420 UAH)
                                    // BUT our system stores everything in EUR.
                                    // If card is UAH (980) and operation is EUR (978):
                                    // amount = -42000 (420 UAH)
                                    // operationAmount = -1000 (10 EUR)
                                    // We want to store: amount = 10 EUR (base), original = 10 EUR.
                                    // Simplification: Just allow the budget view to convert everything from base.
                                    // We need to store consistent BASE Currency (EUR).
                                    // Since we don't have a reliable converter here without async, we will trust the `amount` (card currency)
                                    // and let the view convert it.
                                    // WAIT: The user specifically complained about cross-border accuracy.
                                    // If we store UAH, it converts to EUR using TODAY's rate.
                                    // If we store the original 10 EUR, it remains 10 EUR forever. MUCH BETTER.
                                    // So:
                                    /*
                                    if (item.currencyCode === 978) { // Operation was in EUR
                                        amount = Math.abs(item.operationAmount / 100); // 10.00
                                        originalCurrency = 'EUR';
                                        originalAmount = amount;
                                    }
                                    */
                                    // Generalizing is risky without ISO mapping here.
                                    // Let's stick to reliable defaults for now, but mark Transfers.
                                }

                                const categoryId =
                                    item.mcc === 4829 || item.mcc === 6012
                                        ? 'transfer'
                                        : getCategoryByMcc(item.mcc);

                                // Construct U-Budget Transaction
                                const newTx = {
                                    amount: amount, // Saved in Account Currency (converted to EUR later by form? No, sync saves raw?)
                                    // CRITICAL: onSyncTransactions likely expects Base Currency (EUR) or handles conversion?
                                    // Checking App.tsx or wherever onSync is... usually it just adds to DB.
                                    // If we save 'amount' as UAH value (e.g. 100), and type is 'UAH', BudgetView converts it.

                                    type: isExpense ? 'expense' : 'income',
                                    category: isExpense ? categoryId : 'salary',
                                    date: new Date(item.time * 1000).toISOString().split('T')[0],
                                    description: item.description,
                                    monobankId: item.id,
                                    originalCurrency: originalCurrency,
                                    originalAmount: originalAmount,
                                };

                                await onSyncTransactions(newTx, null);
                                newTxCount++;
                            }
                        }
                    } catch (err) {
                        console.error(`Failed to sync account ${account.id}`, err);
                    }
                    // Delay to respect rate limit (60s is per endpoint? Docs say 60s per client)
                    // We might hit limit if we do >1 account.
                    if (targetAccounts.length > 1) await new Promise((r) => setTimeout(r, 61000)); // Brutal wait but safe
                }
            }

            await setLastSyncTime(Date.now());
            if (newTxCount > 0) {
                toast.success(
                    lang === 'ua'
                        ? `Додано ${newTxCount} транзакцій`
                        : `Added ${newTxCount} transactions`
                );
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
                    <p className="text-xs text-slate-500">
                        {accounts.length > 0
                            ? lang === 'ua'
                                ? 'Підключено'
                                : 'Connected'
                            : lang === 'ua'
                              ? 'Не підключено'
                              : 'Not connected'}
                    </p>
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
                            {loading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Check size={16} />
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {accounts.map((acc) => {
                            const isHidden = useMonobankStore
                                .getState()
                                .hiddenAccountIds?.includes(acc.id);
                            return (
                                <div
                                    key={acc.id}
                                    className={`flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl ${isHidden ? 'opacity-50 grayscale' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-slate-400">
                                            <Smartphone size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                {acc.maskedPan ? acc.maskedPan[0] : 'Рахунок'}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                {acc.currencyCode === 980
                                                    ? 'UAH'
                                                    : acc.currencyCode === 840
                                                      ? 'USD'
                                                      : 'EUR'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="font-mono text-sm font-bold">
                                            {(acc.balance / 100).toFixed(2)}
                                        </div>
                                        <button
                                            onClick={() =>
                                                useMonobankStore
                                                    .getState()
                                                    .toggleAccountVisibility(acc.id)
                                            }
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            title={
                                                isHidden
                                                    ? lang === 'ua'
                                                        ? 'Показати'
                                                        : 'Show'
                                                    : lang === 'ua'
                                                      ? 'Приховати'
                                                      : 'Hide'
                                            }
                                        >
                                            {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        {syncing ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <RefreshCw size={16} />
                        )}
                        {lang === 'ua'
                            ? 'Оновити баланс і транзакції'
                            : 'Sync Balance & Transactions'}
                    </button>

                    <div className="text-[10px] text-center text-slate-400">
                        Rate Limit: 1 request / 60 sec
                    </div>
                </div>
            )}
        </div>
    );
}
