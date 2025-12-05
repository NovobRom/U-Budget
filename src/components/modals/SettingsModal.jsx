import React, { useState } from 'react';
import { X, Globe, DollarSign, Moon, Sun, Bell, LogOut, ChevronRight, AlertCircle, Plus, Trash2, Check, Users } from 'lucide-react';
import { CURRENCIES } from '../../constants';

// Прапорці
const FlagUA = () => <svg width="20" height="15" viewBox="0 0 24 18" className="rounded-sm shadow-sm inline-block mr-2"><rect width="24" height="9" fill="#0057B8"/><rect y="9" width="24" height="9" fill="#FFD700"/></svg>;
const FlagGB = () => <svg width="20" height="15" viewBox="0 0 60 30" className="rounded-sm shadow-sm inline-block mr-2"><clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath><clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath><g clipPath="url(#s)"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/><path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/></g></svg>;

export default function SettingsModal({ 
    isOpen, onClose, 
    lang, setLang, 
    currency, setCurrency, 
    darkMode, setDarkMode,
    incomingRequests, approveRequest, declineRequest,
    categories, limits, onSaveLimit, onDeleteCategory,
    onLogout, t, getCategoryName,
    allowedUsers = [], removeUser 
}) {
    if (!isOpen) return null;

    const [isEditingLimit, setIsEditingLimit] = useState(false);

    const LimitEditor = () => (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-4 shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold dark:text-white text-sm uppercase tracking-wider">{t.add_limit_label}</h3>
                    <button onClick={() => setIsEditingLimit(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={20} className="text-slate-400"/></button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {categories.filter(c => c.type === 'expense').map(cat => (
                        <div key={cat.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                            <span className="text-sm font-bold dark:text-white flex items-center gap-2 truncate">
                                {cat.icon && React.createElement(cat.icon, {size: 16, className: cat.textColor})} 
                                <span className="truncate max-w-[120px]">{getCategoryName(cat)}</span>
                            </span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    placeholder={t.limit_placeholder}
                                    className="w-20 p-2 text-right bg-white dark:bg-slate-700 rounded-lg text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-blue-500 transition-colors dark:text-white"
                                    defaultValue={limits[cat.id] || ''}
                                    onBlur={(e) => onSaveLimit(cat.id, e.target.value)}
                                />
                                <span className="text-xs text-slate-400 font-bold">{currency}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={() => setIsEditingLimit(false)} className="w-full mt-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity text-sm">{t.save_btn}</button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            {isEditingLimit && <LimitEditor />}
            
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-xl max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-700 custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold dark:text-white">{t.settings}</h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X size={20} className="dark:text-white"/></button>
                </div>

                <div className="space-y-6">
                    {incomingRequests && incomingRequests.length > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                            <h4 className="font-bold text-xs text-blue-600 dark:text-blue-400 uppercase mb-3 flex items-center gap-2"><Bell size={14}/> {t.requests}</h4>
                            <div className="space-y-2">
                                {incomingRequests.map((req) => (
                                    <div key={req.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl flex justify-between items-center shadow-sm">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{req.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{req.email}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => approveRequest(req)} className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"><Check size={16} /></button>
                                            <button onClick={() => declineRequest(req)} className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"><X size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
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

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-xs uppercase text-slate-500">{t.limits_title}</h3>
                            <button onClick={() => setIsEditingLimit(true)} className="text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded-lg transition-colors"><Plus size={14}/> Add Limit</button>
                        </div>
                        
                        <div className="space-y-2">
                            {categories.filter(c => c.type === 'expense' && limits[c.id] > 0).map(c => ( 
                                <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${c.color} ${c.textColor}`}>{c.icon && React.createElement(c.icon, {size: 14})}</div>
                                    <div className="flex-1 text-sm font-bold dark:text-white truncate">{getCategoryName(c)}</div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-700 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                                        {limits[c.id]} <span className="text-xs text-slate-400">{currency}</span>
                                    </div>
                                    <button onClick={() => onSaveLimit(c.id, 0)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button> 
                                </div> 
                            ))}
                            {categories.filter(c => c.type === 'expense' && limits[c.id] > 0).length === 0 && (
                                <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">No limits set</div>
                            )}
                        </div>
                    </div>

                    {['expense', 'income'].map(type => {
                         const customCats = categories.filter(c => c.type === type && c.isCustom);
                         if (customCats.length === 0) return null;
                         return (
                            <div key={type}>
                                <h3 className="font-bold text-xs uppercase text-slate-500 mb-3">{t[`custom_${type}_title`]}</h3>
                                <div className="space-y-2">
                                    {customCats.map(c => (
                                        <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full ${c.color} flex items-center justify-center text-white shadow-sm`}>{c.icon && React.createElement(c.icon, {size: 14})}</div>
                                                <span className="text-sm font-bold dark:text-white">{c.name}</span>
                                            </div>
                                            <button onClick={() => onDeleteCategory(c.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         );
                    })}

                    {/* --- TEAM MANAGEMENT SECTION (FIXED & ROBUST) --- */}
                    <div>
                        <h3 className="font-bold text-xs uppercase text-slate-500 mb-3 flex items-center gap-2">
                            <Users size={14}/> {t.team_title || "Team"}
                        </h3>
                        
                        {allowedUsers && allowedUsers.length > 0 ? (
                            <div className="space-y-2">
                                {allowedUsers.map((userItem, index) => {
                                    // 🛡️ БЕЗПЕЧНА ЕКСТРАКЦІЯ ДАНИХ (Fix Crashes)
                                    let displayName = "Unknown User";
                                    let email = "";
                                    let uid = null;
                                    let isCurrentUser = false;

                                    if (userItem && typeof userItem === 'object') {
                                        // Якщо прийшов об'єкт (як і має бути)
                                        uid = userItem.uid;
                                        displayName = userItem.displayName || "User";
                                        email = userItem.email || "";
                                        isCurrentUser = userItem.isCurrentUser;
                                    } else if (typeof userItem === 'string') {
                                        // Fallback: якщо прийшов просто рядок UID
                                        uid = userItem;
                                        displayName = `User ${uid.substring(0,4)}...`;
                                    }

                                    // Якщо UID досі немає (або null) - пропускаємо рендер цього елемента
                                    if (!uid || typeof uid !== 'string') return null;

                                    return (
                                        <div key={uid} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                                                    {displayName[0]}
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                                                        {displayName} {isCurrentUser && "(You)"}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                                                        {email || uid}
                                                    </span>
                                                </div>
                                            </div>
                                            {!isCurrentUser && (
                                                <button 
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to remove this user?')) {
                                                            removeUser(userItem); // Передаємо оригінальний об'єкт (useBudget знає що робити)
                                                        }
                                                    }}
                                                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                    title={t.remove_user_btn}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                                {t.team_empty || "Just you"}
                            </div>
                        )}
                    </div>

                    <button onClick={onLogout} className="w-full py-4 mt-2 flex items-center justify-center gap-2 text-red-500 font-bold bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-100 dark:border-red-900/50">
                        <LogOut size={18}/> {t.logout}
                    </button>
                </div>
            </div>
        </div>
    );
}