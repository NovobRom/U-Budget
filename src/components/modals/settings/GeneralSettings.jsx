import React, { useState } from 'react';
import { Globe, DollarSign, Moon, Sun, Link, Copy, Check } from 'lucide-react';
import { CURRENCIES } from '../../../constants';

const FlagUA = () => <svg width="20" height="15" viewBox="0 0 24 18" className="rounded-sm shadow-sm inline-block mr-2"><rect width="24" height="9" fill="#0057B8"/><rect y="9" width="24" height="9" fill="#FFD700"/></svg>;
const FlagGB = () => <svg width="20" height="15" viewBox="0 0 60 30" className="rounded-sm shadow-sm inline-block mr-2"><clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath><clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath><g clipPath="url(#s)"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/><path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/></g></svg>;

export default function GeneralSettings({ lang, setLang, currency, setCurrency, darkMode, setDarkMode, currentUserId, activeBudgetId, switchBudget, t }) {
    const [switchId, setSwitchId] = useState('');
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(activeBudgetId || currentUserId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-3 mb-6">
            <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase"><Globe size={14}/> {t.language}</div>
                <div className="grid grid-cols-2 gap-2">
                    {['en', 'ua'].map(l => ( 
                        <button key={l} onClick={() => setLang(l)} className={`py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${l === 'ua' && lang === 'ua' ? 'bg-white dark:bg-slate-700 border-blue-200 dark:border-slate-600 shadow-sm text-slate-900 dark:text-white' : ''} ${l === 'en' && lang === 'en' ? 'bg-white dark:bg-slate-700 border-blue-200 dark:border-slate-600 shadow-sm text-slate-900 dark:text-white' : ''} ${lang !== l ? 'bg-transparent border-transparent text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700' : ''}`}>
                            {l === 'ua' ? <FlagUA /> : <FlagGB />}{l === 'ua' ? 'UA' : 'EN'}
                        </button> 
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase"><DollarSign size={14}/> {t.currency}</div>
                <div className="grid grid-cols-4 gap-2">
                    {['EUR', 'USD', 'UAH', 'PLN'].map(c => (
                        <button key={c} onClick={() => setCurrency(c)} className={`py-2 rounded-xl text-xs font-bold border transition-all ${currency === c ? 'bg-white dark:bg-slate-700 border-blue-200 dark:border-slate-600 shadow-sm text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                            {CURRENCIES[c].symbol} {c}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase"><Moon size={14}/> {t.appearance}</div>
                <div className="flex bg-slate-200 dark:bg-slate-900 p-1 rounded-xl">
                    <button onClick={() => setDarkMode(false)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${!darkMode ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}><Sun size={14} /> {t.light}</button>
                    <button onClick={() => setDarkMode(true)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${darkMode ? 'bg-slate-700 shadow-sm text-white' : 'text-slate-500'}`}><Moon size={14} /> {t.dark}</button>
                </div>
            </div>

            {/* 🔥 BUDGET CONNECTION (NEW) */}
            <div className="flex flex-col gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase">
                    <Link size={14}/> {t.budget_connection}
                </div>
                
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">{t.current_id_label}</label>
                    <button onClick={handleCopy} className="w-full flex justify-between items-center bg-white dark:bg-slate-800 p-2.5 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-colors">
                        <span className="truncate">{activeBudgetId || currentUserId}</span>
                        {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                    </button>
                </div>

                <div className="space-y-1 mt-2 pt-2 border-t border-indigo-100 dark:border-indigo-800/50">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">{t.switch_budget_label}</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={switchId}
                            onChange={(e) => setSwitchId(e.target.value)}
                            placeholder={t.switch_placeholder}
                            className="flex-1 bg-white dark:bg-slate-800 p-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500"
                        />
                        <button 
                            onClick={() => switchBudget(switchId)}
                            disabled={!switchId}
                            className="bg-indigo-500 text-white px-4 rounded-xl text-xs font-bold hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t.switch_btn}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}