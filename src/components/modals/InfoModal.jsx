import React from 'react';
import { X } from 'lucide-react';

export default function InfoModal({ type, onClose, t }) {
    if (!type) return null;

    const title = t[`${type}_title`] || (type === 'install' ? t.install_app : '');
    const text = t[`${type}_text`];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
                </div>
                {type === 'install' ? (
                    <div className="text-sm text-slate-600 dark:text-slate-300 space-y-4">
                        <div><h4 className="font-bold mb-1 text-slate-900 dark:text-white">{t.install_ios}</h4><p>{t.install_ios_step1}</p><p>{t.install_ios_step2}</p></div>
                        <div><h4 className="font-bold mb-1 text-slate-900 dark:text-white">{t.install_android}</h4><p>{t.install_and_step1}</p><p>{t.install_and_step2}</p></div>
                    </div>
                ) : (
                    <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">{text}</div>
                )}
                <div className="mt-6"><button onClick={onClose} className="w-full bg-slate-900 dark:bg-blue-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity">Close</button></div>
            </div>
        </div>
    );
}