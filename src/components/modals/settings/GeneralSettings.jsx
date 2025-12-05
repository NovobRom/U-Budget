import React from 'react';
import { Globe, DollarSign, Moon, Sun } from 'lucide-react';
import { CURRENCIES } from '../../../constants';

const FlagUA = () => <svg width="20" height="15" viewBox="0 0 24 18" className="rounded-sm shadow-sm inline-block mr-2"><rect width="24" height="9" fill="#0057B8"/><rect y="9" width="24" height="9" fill="#FFD700"/></svg>;
const FlagGB = () => <svg width="20" height="15" viewBox="0 0 60 30" className="rounded-sm shadow-sm inline-block mr-2"><clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath><clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath><g clipPath="url(#s)"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/><path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/></g></svg>;

export default function GeneralSettings({ lang, setLang, currency, setCurrency, darkMode, setDarkMode, t }) {
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
        </div>
    );
}