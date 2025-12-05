import React from 'react';
import { Bell, Check, X } from 'lucide-react';

export default function RequestsManager({ incomingRequests, approveRequest, declineRequest, t }) {
    if (!incomingRequests || incomingRequests.length === 0) return null;

    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 mb-6">
            <h4 className="font-bold text-xs text-blue-600 dark:text-blue-400 uppercase mb-3 flex items-center gap-2">
                <Bell size={14}/> {t.requests}
            </h4>
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
    );
}