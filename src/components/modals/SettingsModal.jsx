import React, { useState } from 'react';
import { X, LogOut } from 'lucide-react';

import RequestsManager from './settings/RequestsManager';
import GeneralSettings from './settings/GeneralSettings';
import LimitsManager from './settings/LimitsManager';
import TeamManager from './settings/TeamManager';
import ConfirmModal from './ConfirmModal'; 

export default function SettingsModal({ 
    isOpen, onClose, 
    lang, setLang, 
    currency, setCurrency, 
    darkMode, setDarkMode,
    incomingRequests, approveRequest, declineRequest,
    categories, limits, onSaveLimit, onDeleteCategory,
    onLogout, t, getCategoryName,
    allowedUsers = [], removeUser, leaveBudget, 
    currentUserId, isOwner,
    activeBudgetId, switchBudget // <-- NEW PROPS
}) {
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, data: null });

    if (!isOpen) return null;

    const handleRemoveClick = (userItem) => {
        if (!isOwner) return;
        setConfirmModal({ isOpen: true, type: 'remove', data: userItem });
    };

    const handleLeaveClick = () => {
        setConfirmModal({ isOpen: true, type: 'leave', data: null });
    };

    const handleConfirmAction = () => {
        if (confirmModal.type === 'remove' && confirmModal.data) {
            removeUser(confirmModal.data);
        } else if (confirmModal.type === 'leave') {
            leaveBudget();
            onClose(); 
        }
        setConfirmModal({ isOpen: false, type: null, data: null });
    };

    return (
        <>
            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmAction}
                title={t.confirm_title}
                message={confirmModal.type === 'remove' ? t.confirm_remove_user_msg : t.confirm_leave_budget_msg}
                t={t}
            />

            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-xl max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-700 custom-scrollbar">
                    
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold dark:text-white">{t.settings}</h2>
                        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X size={20} className="dark:text-white"/></button>
                    </div>

                    <div className="space-y-6">
                        <RequestsManager 
                            incomingRequests={incomingRequests}
                            approveRequest={approveRequest}
                            declineRequest={declineRequest}
                            t={t}
                        />

                        <GeneralSettings 
                            lang={lang} setLang={setLang}
                            currency={currency} setCurrency={setCurrency}
                            darkMode={darkMode} setDarkMode={setDarkMode}
                            
                            currentUserId={currentUserId}
                            activeBudgetId={activeBudgetId}
                            switchBudget={switchBudget}
                            
                            t={t}
                        />

                        <LimitsManager 
                            categories={categories}
                            limits={limits}
                            onSaveLimit={onSaveLimit}
                            onDeleteCategory={onDeleteCategory}
                            currency={currency}
                            t={t}
                            getCategoryName={getCategoryName}
                        />

                        <TeamManager 
                            allowedUsers={allowedUsers}
                            removeUser={isOwner ? handleRemoveClick : null} 
                            onLeave={handleLeaveClick}
                            currentUserId={currentUserId}
                            t={t}
                        />

                        <button onClick={onLogout} className="w-full py-4 mt-2 flex items-center justify-center gap-2 text-red-500 font-bold bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-100 dark:border-red-900/50">
                            <LogOut size={18}/> {t.logout}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}