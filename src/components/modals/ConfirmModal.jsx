import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, t }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 transform transition-all scale-100">
                
                <div className="flex items-center gap-3 text-red-500 mb-4">
                    <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                </div>

                <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">
                    {message}
                </p>

                <div className="flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        {t.btn_cancel}
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }}
                        className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all"
                    >
                        {t.btn_confirm}
                    </button>
                </div>
            </div>
        </div>
    );
}