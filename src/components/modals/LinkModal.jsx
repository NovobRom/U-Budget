import React, { useState } from 'react';
import { X, Copy, Share2, Check, Send } from 'lucide-react';

export default function LinkModal({ isOpen, onClose, userUid, onJoinRequest, t }) {
    const [partnerId, setPartnerId] = useState('');
    const [copied, setCopied] = useState(false);
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(userUid);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSend = async () => {
        if (!partnerId) return;
        setIsSending(true);
        // Викликаємо функцію створення запиту, яку передали з App.jsx
        await onJoinRequest(partnerId);
        setIsSending(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        <Share2 size={20} className="text-blue-500"/>
                        {t.invite_title}
                    </h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>

                {/* TAB 1: MY ID */}
                <div className="mb-8">
                    <p className="text-sm text-slate-500 mb-3 leading-relaxed">
                        {t.invite_desc}
                    </p>
                    <div 
                        onClick={handleCopy}
                        className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 relative group cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <div className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200 break-all text-center">
                            {userUid}
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 right-2 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            {copied ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
                        </div>
                    </div>
                    <p className="text-xs text-center text-slate-400 mt-2">
                        {copied ? t.success_save : t.click_copy}
                    </p>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 my-6"></div>

                {/* TAB 2: JOIN PARTNER (REQUEST FLOW) */}
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-3">{t.join_title}</h4>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={partnerId}
                            onChange={(e) => setPartnerId(e.target.value)}
                            placeholder={t.partner_id_placeholder}
                            className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm dark:text-white"
                        />
                        <button 
                            disabled={!partnerId || isSending}
                            onClick={handleSend}
                            className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {isSending ? '...' : <Send size={16} />}
                            {t.send_request}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}