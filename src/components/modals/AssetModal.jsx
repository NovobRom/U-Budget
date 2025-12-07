import React, { useState, useEffect } from 'react';
import { X, RefreshCcw, Loader2, DollarSign, Bitcoin, Zap, ArrowRightLeft } from 'lucide-react';
import { CURRENCIES } from '../../constants';
import { fetchExchangeRate } from '../../utils/currency';

const CRYPTO_OPTIONS = [
    { id: 'tether', name: 'Tether (USDT)', icon: DollarSign },
    { id: 'bitcoin', name: 'Bitcoin (BTC)', icon: Bitcoin },
    { id: 'ethereum', name: 'Ethereum (ETH)', icon: Zap }, 
];

export default function AssetModal({ isOpen, onClose, onSave, editingAsset, t, currency: mainCurrency }) {
    const [name, setName] = useState('');
    const [type, setType] = useState('cash');
    const [amount, setAmount] = useState(''); // Amount (1 bitcoin or 10000 UAH)
    const [valuePerUnit, setValuePerUnit] = useState(''); // Rate to main currency
    
    // New fields for multi-currency support
    const [selectedCrypto, setSelectedCrypto] = useState('tether');
    const [selectedCurrency, setSelectedCurrency] = useState(mainCurrency || 'EUR');
    const [isFetchingRate, setIsFetchingRate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editingAsset) {
                setName(editingAsset.name);
                setType(editingAsset.type);
                setAmount(editingAsset.amount);
                // Check both fields to support legacy data
                setValuePerUnit(editingAsset.valuePerUnit || editingAsset.value || 1);
                
                if (editingAsset.type === 'crypto') {
                    setSelectedCrypto(editingAsset.cryptoId || 'tether');
                } else {
                    // Restore original currency if editing, otherwise default to main
                    setSelectedCurrency(editingAsset.originalCurrency || mainCurrency);
                }
            } else {
                // Default new state
                setName('');
                setType('cash');
                setAmount('');
                setValuePerUnit('');
                setSelectedCrypto('tether');
                setSelectedCurrency(mainCurrency || 'EUR');
            }
        }
    }, [editingAsset, isOpen, mainCurrency]);

    // Effect: Auto-fetch fiat rate
    useEffect(() => {
        let isMounted = true;
        const fetchFiatRate = async () => {
            if (type === 'crypto') return; // Crypto is fetched manually via button
            if (!isOpen) return;

            // If asset currency matches app currency -> rate is 1
            if (selectedCurrency === mainCurrency) {
                if (isMounted) setValuePerUnit('1');
                return;
            }

            // Otherwise fetch rate
            setIsFetchingRate(true);
            try {
                const rate = await fetchExchangeRate(selectedCurrency, mainCurrency);
                if (isMounted && rate) {
                    setValuePerUnit(rate.toString());
                }
            } catch (e) {
                console.error("Fiat rate error", e);
            } finally {
                if (isMounted) setIsFetchingRate(false);
            }
        };

        const timer = setTimeout(fetchFiatRate, 500); // Debounce
        return () => { isMounted = false; clearTimeout(timer); };
    }, [selectedCurrency, mainCurrency, type, isOpen]);

    // Manual fetch for crypto
    const handleCryptoFetch = async () => {
        setIsFetchingRate(true);
        try {
            // true flag indicates crypto
            const rate = await fetchExchangeRate(selectedCrypto, mainCurrency, true);
            if (rate) {
                setValuePerUnit(rate.toString());
            }
        } catch (e) {
            console.error("Crypto fetch error", e);
        } finally {
            setIsFetchingRate(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Final number validation
        const finalAmount = parseFloat(amount) || 0;
        const finalRate = parseFloat(valuePerUnit) || 1;

        onSave({
            name: type === 'crypto' ? CRYPTO_OPTIONS.find(c => c.id === selectedCrypto)?.name : name,
            type, 
            amount: finalAmount,
            valuePerUnit: finalRate,
            cryptoId: type === 'crypto' ? selectedCrypto : null,
            originalCurrency: type === 'crypto' ? null : selectedCurrency
        });
    };

    // Calculate total preview in main currency
    const totalPreview = (parseFloat(amount || 0) * (parseFloat(valuePerUnit || 1))).toFixed(2);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                        {editingAsset ? t.edit_asset : t.add_asset}
                    </h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* TYPE SELECTOR */}
                    <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {['cash', 'crypto', 'stock'].map(assetType => (
                            <button 
                                key={assetType} 
                                type="button" 
                                onClick={() => setType(assetType)} 
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${type === assetType ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                            >
                                {t[`asset_type_${assetType}`]}
                            </button>
                        ))}
                    </div>
                    
                    {/* --- CRYPTO LOGIC --- */}
                    {type === 'crypto' ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs text-slate-500 font-bold">{t.select_coin}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {CRYPTO_OPTIONS.map(c => (
                                        <button 
                                            key={c.id} 
                                            type="button" 
                                            onClick={() => { setSelectedCrypto(c.id); setValuePerUnit(''); }} 
                                            className={`p-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 border transition-all ${selectedCrypto === c.id ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-500'}`}
                                        >
                                            {React.createElement(c.icon, {size: 16})}
                                            {c.name.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {/* Flex-col and mt-auto ensure inputs align at bottom even if labels wrap */}
                                <div className="flex flex-col">
                                    <label className="text-xs text-slate-500 font-bold mb-1 block">{t.holdings}</label>
                                    <input 
                                        type="number" 
                                        value={amount} 
                                        onChange={e=>setAmount(e.target.value)} 
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold mt-auto" 
                                        required 
                                        step="any"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs text-slate-500 font-bold mb-1 block">{t.current_rate} ({mainCurrency})</label>
                                    <div className="relative mt-auto">
                                        <input 
                                            type="number" 
                                            value={valuePerUnit} 
                                            onChange={e=>setValuePerUnit(e.target.value)} 
                                            className="w-full p-3 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold" 
                                            required 
                                            step="any"
                                            placeholder="0.00"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={handleCryptoFetch} 
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:bg-blue-50 p-1 rounded-full transition-colors" 
                                            disabled={isFetchingRate}
                                        >
                                            {isFetchingRate ? <Loader2 size={16} className="animate-spin"/> : <RefreshCcw size={16}/>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* --- CASH / STOCK LOGIC --- */
                        <>
                            <div>
                                <label className="text-xs text-slate-500 font-bold mb-1 block">{t.asset_name}</label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={e=>setName(e.target.value)} 
                                    placeholder={type === 'stock' ? "e.g. Apple Inc." : "e.g. Cash under mattress"} 
                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-medium" 
                                    required 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Flex-col and mt-auto alignment fix here as well */}
                                <div className="flex flex-col">
                                    <label className="text-xs text-slate-500 font-bold mb-1 block">{t.holdings}</label>
                                    <input 
                                        type="number" 
                                        value={amount} 
                                        onChange={e=>setAmount(e.target.value)} 
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none text-lg font-bold mt-auto" 
                                        required 
                                        step="any"
                                        placeholder="0"
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-xs text-slate-500 font-bold mb-1 block">{t.asset_currency}</label>
                                    <select 
                                        value={selectedCurrency} 
                                        onChange={e => setSelectedCurrency(e.target.value)}
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold text-slate-700 dark:text-slate-200 cursor-pointer mt-auto"
                                    >
                                        {Object.keys(CURRENCIES).map(code => (
                                            <option key={code} value={code}>{code} ({CURRENCIES[code].symbol})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Auto-Rate Display */}
                            {selectedCurrency !== mainCurrency && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800 flex flex-col gap-2 animate-in fade-in">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                            <ArrowRightLeft size={12}/> {t.exchange_rate}
                                        </span>
                                        {isFetchingRate && <span className="text-blue-400 animate-pulse">{t.auto_rate_fetching}</span>}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <span className="text-xs text-slate-400">1 {selectedCurrency} =</span>
                                        <input 
                                            type="number" 
                                            value={valuePerUnit} 
                                            onChange={e => setValuePerUnit(e.target.value)}
                                            className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-sm font-bold outline-none text-right"
                                            placeholder="Rate"
                                        />
                                        <span className="text-xs font-bold text-slate-500">{mainCurrency}</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Total Preview */}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400 font-bold uppercase">{t.total_value}</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">
                            {CURRENCIES[mainCurrency]?.symbol}{totalPreview}
                        </span>
                    </div>

                    <button 
                        type="submit" 
                        disabled={!amount || isFetchingRate}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {t.save_btn}
                    </button>
                </form>
            </div>
        </div>
    );
}