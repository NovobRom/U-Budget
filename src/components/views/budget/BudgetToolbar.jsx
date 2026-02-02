import React from 'react';
import { Calendar, ChevronDown, Search, Share2, Users, RefreshCw, X, ArrowRight } from 'lucide-react';

export default function BudgetToolbar({
    timeFilter, setTimeFilter,
    searchTerm, setSearchTerm,
    isCustomRange,
    customStartDate, setCustomStartDate,
    customEndDate, setCustomEndDate,
    t,
    onRecurring, onInvite, onJoin
}) {
    return (
        <div className="flex flex-col gap-3 px-1 mb-4 min-h-[50px]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                <div className="grid grid-cols-2 sm:flex gap-3 w-full sm:w-auto flex-1">
                    <div className="relative flex-1 min-w-[140px]">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="w-full appearance-none pl-9 pr-8 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer shadow-sm">
                            <option value="this_month">{t.this_month}</option>
                            <option value="last_month">{t.last_month}</option>
                            <option value="this_year">{t.this_year}</option>
                            <option value="all">{t.all_time}</option>
                            <option value="custom">📅 {t.custom_range_picker}</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                    </div>
                    <div className="relative flex-1 min-w-[140px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input type="text" placeholder={t.search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 outline-none shadow-sm" />
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:ml-auto">
                    <button onClick={onRecurring} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 px-3 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:bg-blue-100 transition-colors"><RefreshCw size={16} /> <span className="hidden sm:inline">{t.recurring_btn}</span></button>
                    <button onClick={onInvite} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 px-3 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-100 transition-colors"><Share2 size={16} /></button>
                    <button onClick={onJoin} className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors"><Users size={16} /></button>
                </div>
            </div>
            {isCustomRange && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar size={16} className="text-blue-500 group-hover:text-blue-600 transition-colors" /></div>
                        <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm cursor-pointer" />
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><ArrowRight size={16} className="text-indigo-500 group-hover:text-indigo-600 transition-colors" /></div>
                        <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm cursor-pointer" />
                        {(customStartDate || customEndDate) && (<button onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all z-10"><X size={12} /></button>)}
                    </div>
                </div>
            )}
        </div>
    );
}
