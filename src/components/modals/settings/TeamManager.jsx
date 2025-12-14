import React from 'react';
import { Users, Trash2, LogOut, Crown } from 'lucide-react';

export default function TeamManager({ allowedUsers = [], removeUser, onLeave, currentUserId, t }) {
    return (
        <div className="mb-6">
            <h3 className="font-bold text-xs uppercase text-slate-500 mb-3 flex items-center gap-2">
                <Users size={14}/> {t.team_title || "Team"}
            </h3>
            
            <div className="space-y-2">
                {allowedUsers.map((userItem) => {
                    const { uid, displayName, email, photoURL, isCurrentUser, isOwner } = userItem;

                    // Name display logic
                    const isGenericName = displayName?.startsWith("User ") || displayName === "Unknown User";
                    const displayLabel = isGenericName && !isCurrentUser ? "Partner" : displayName;

                    return (
                        <div key={uid} className={`flex items-center justify-between p-3 rounded-xl border ${isCurrentUser ? 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700'}`}>
                            <div className="flex items-center gap-3 overflow-hidden">
                                {/* AVATAR */}
                                <div className="relative">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0 text-white overflow-hidden ${isOwner ? 'bg-amber-500 shadow-amber-500/30 shadow-md' : (isCurrentUser ? 'bg-blue-500' : 'bg-purple-500')}`}>
                                        {photoURL ? (
                                            <img src={photoURL} alt={displayLabel} className="w-full h-full object-cover" />
                                        ) : (
                                            displayLabel?.[0] || "?"
                                        )}
                                    </div>
                                    {isOwner && (
                                        <div className="absolute -top-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5">
                                            <Crown size={10} className="text-amber-500 fill-amber-500"/>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex flex-col overflow-hidden">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                                            {isCurrentUser ? `${t.you_label} (${displayLabel})` : displayLabel}
                                        </span>
                                        {isOwner && <span className="text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wide">{t.owner_label}</span>}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                                        {email}
                                    </span>
                                </div>
                            </div>

                            {/* ACTIONS (BUTTONS) */}
                            <div className="flex gap-2">
                                {/* If it's me and I'm NOT the owner -> Can leave */}
                                {isCurrentUser && !isOwner && (
                                    <button 
                                        onClick={onLeave}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title={t.leave_budget_btn}
                                    >
                                        <LogOut size={16} />
                                    </button>
                                )}

                                {/* If it's NOT me, but I AM the owner (check is external, here we just show button if removeUser is allowed) -> Can remove */}
                                {!isCurrentUser && !isOwner && removeUser && (
                                    <button 
                                        onClick={() => removeUser(userItem.uid)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title={t.remove_user_btn}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}