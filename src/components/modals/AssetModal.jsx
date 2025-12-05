import React, { useState, useEffect } from 'react';
import { X, RefreshCcw, Loader2, DollarSign, Bitcoin, Zap } from 'lucide-react';

const CRYPTO_OPTIONS = [
    { id: 'tether', name: 'Tether (USDT)', icon: DollarSign },
    { id: 'bitcoin', name: 'Bitcoin (BTC)', icon: Bitcoin },
    { id: 'ethereum', name: 'Ethereum (ETH)', icon: Zap }, 
];

export default function AssetModal({ isOpen, onClose, onSave, onFetchRate, isFetchingRate, editingAsset, t, currency }) {
    const [name, setName] = useState('');
    const [type, setType] = useState('cash');
    const [amount, setAmount] = useState('');
    const [value, setValue] = useState('');
    const [selectedCrypto, setSelectedCrypto] = useState('tether');

    useEffect(() => {
        if (editingAsset) {
            setName(editingAsset.name);
            setType(editingAsset.type);
            setAmount(editingAsset.amount);
            setValue(editingAsset.valuePerUnit);
            if (editingAsset.cryptoId) setSelectedCrypto(editingAsset.cryptoId);
        } else {
            setName(''); setType('cash'); setAmount(''); setValue(''); setSelectedCrypto('tether');
        }
    }, [editingAsset, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            name, 
            type, 
            amount: parseFloat(amount) || 0, // <-- FIX: Примусове число
            value: parseFloat(value) || 1,   // <-- FIX: Примусове число
            cryptoId: type === 'crypto' ? selectedCrypto : null
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{editingAsset ? t.edit_asset : t.add_asset}</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {['cash', 'crypto', 'stock'].map(assetType => (
                            <button key={assetType} type="button" onClick={() => setType(assetType)} className={`flex-1 py-2 rounded-lg text-xs font-bold ${type === assetType ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
                                {t[`asset_type_${assetType}`]}
                            </button>
                        ))}
                    </div>
                    
                    {type === 'crypto' ? (
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500">{t.select_coin}</label>
                            <div className="grid grid-cols-3 gap-2">
                                {CRYPTO_OPTIONS.map(c => (
                                    <button key={c.id} type="button" onClick={() => { setSelectedCrypto(c.id); setValue(''); }} 
                                        className={`p-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 border ${selectedCrypto === c.id ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-500'}`}>
                                        {React.createElement(c.icon, {size: 16})}
                                        {c.name.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="text-xs text-slate-500">{t.asset_name}</label>
                            <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder={type === 'stock' ? "e.g. Trading 212" : "e.g. Cash"} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none" required />
                        </div>
                    )}

                    {type === 'crypto' ? (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-500">{t.holdings}</label>
                                    <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none" required step="any"/>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500">{t.current_rate} ({currency})</label>
                                    <div className="relative">
                                        <input type="number" value={value} onChange={e=>setValue(e.target.value)} className="w-full p-3 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none" required step="any"/>
                                        <button type="button" onClick={() => onFetchRate(selectedCrypto, setValue)} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:bg-blue-50 p-1 rounded-full" disabled={isFetchingRate}>
                                            {isFetchingRate ? <Loader2 size={16} className="animate-spin"/> : <RefreshCcw size={16}/>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="text-xs text-slate-500">{t.total_value}</label>
                            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none text-xl font-bold" required step="any"/>
                        </div>
                    )}
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">{t.save_btn}</button>
                </form>
            </div>
        </div>
    );
}