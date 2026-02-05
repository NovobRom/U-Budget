import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Save, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

import { db, auth, appId } from '../../../firebase';

export default function ProfileSettings({ user, t }) {
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!user || !displayName.trim()) return;

        setLoading(true);
        try {
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: displayName,
                });
            }

            const userProfileRef = doc(
                db,
                'artifacts',
                appId,
                'users',
                user.uid,
                'metadata',
                'profile'
            );
            await updateDoc(userProfileRef, {
                displayName: displayName,
            });

            toast.success(t.profile_updated || 'Profile updated!');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 mb-6 shadow-sm">
            <h4 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase mb-3 flex items-center gap-2">
                <User size={14} /> {t.profile_settings_title || 'Profile Settings'}
            </h4>

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User size={16} className="text-slate-400" />
                    </div>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={t.name_placeholder || 'Your Name'}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading || !displayName.trim() || displayName === user?.displayName}
                    className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/20"
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 ml-1">
                {t.profile_hint || 'This name will be visible to other budget members.'}
            </p>
        </div>
    );
}
