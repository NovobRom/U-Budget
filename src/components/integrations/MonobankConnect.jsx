import React, { useState } from 'react';
import { Loader2, Check, RefreshCw, Smartphone } from 'lucide-react';
import { useMonobankStore } from '../../store/useMonobankStore';
import { fetchClientInfo, fetchStatements } from '../../services/monobank.service';
import toast from 'react-hot-toast';

export default function MonobankConnect({ lang }) {
    const { token, setToken, accounts, setAccounts, lastSyncTime, setLastSyncTime } = useMonobankStore();
    const [inputToken, setInputToken] = useState(token);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const handleConnect = async () => {
        if (!inputToken) return;
        setLoading(true);
        try {
            const data = await fetchClientInfo(inputToken);
            setToken(inputToken);
            setAccounts(data.accounts);
            toast.success(lang === 'ua' ? 'Monobank успішно підключено!' : 'Monobank connected successfully!');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        // Simple rate limit check (naive)
        const now = Date.now();
        if (now - lastSyncTime < 60000) {
            const waitSec = Math.ceil((60000 - (now - lastSyncTime)) / 1000);
            toast.error(lang === 'ua' ? `Зачекайте ${waitSec} с` : `Wait ${waitSec}s`);
            return;
        }

        setSyncing(true);
        try {
            // Sync logic will be extended here to fetch statements for each account
            // For now, let's just refresh client info
            const data = await fetchClientInfo(token);
            setAccounts(data.accounts);
            setLastSyncTime(Date.now());
            toast.success(lang === 'ua' ? 'Дані оновлено' : 'Data synced');
        } catch (error) {
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
                        {lang === 'ua' ? 'Оновити баланс' : 'Sync Balance'}
                    </button>

                    <div className="text-[10px] text-center text-slate-400">
                        Rate Limit: 1 request / 60 sec
                    </div>
                </div>
            )}
        </div>
    );
}
