
import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Mail } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from './firebase';

// HOOKS
import { useAuth } from './hooks/useAuth';
import { useBudget } from './hooks/useBudget';
import { useFamilySync } from './hooks/useFamilySync';
import { useTeamMembers } from './hooks/useTeamMembers';
import { useLanguage } from './context/LanguageContext';
import { useCurrency } from './context/CurrencyContext';
import { useAppActions } from './hooks/useAppActions';

// COMPONENTS
import AuthScreen from './components/AuthScreen.jsx';
import AppShell from './components/AppShell.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import ModalManager from './components/modals/ModalManager.jsx';
// const ModalManager = React.lazy(() => import('./components/modals/ModalManager'));

// STORE
import { AppProviders } from './providers/AppProviders';

const AppContent = () => {
    const { lang, setLang, t } = useLanguage();
    const { currency, formatMoney } = useCurrency();

    const {
        user, loading: authLoading, activeBudgetId, isPendingApproval,
        login, register, logout, resetPassword, googleLogin, appleLogin
    } = useAuth();

    // Data Hooks
    const budgetData = useBudget(activeBudgetId, isPendingApproval, user, lang, currency);
    const familySync = useFamilySync(user?.uid, user?.email, user?.displayName);
    const { members: hydratedMembers } = useTeamMembers(budgetData.allowedUsers, budgetData.budgetOwnerId, user?.uid);

    // Actions Hook
    const actions = useAppActions(activeBudgetId, user, t, currency);

    // --- EFFECTS ---
    useEffect(() => {
        if (t && t.website_title) {
            document.title = t.website_title;
        }
    }, [t]);

    useEffect(() => {
        const syncPhoto = async () => {
            if (user && user.photoURL) {
                try {
                    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'profile');
                    await setDoc(profileRef, { photoURL: user.photoURL }, { merge: true });
                } catch (error) {
                    console.error("Error syncing photoURL:", error);
                }
            }
        };
        syncPhoto();
    }, [user]);

    // --- RENDERING ---

    if (authLoading) return <AppShell />;

    if (!user) return (
        <AuthScreen
            onLogin={login} onRegister={register}
            onGoogleLogin={googleLogin} onAppleLogin={appleLogin} onResetPassword={resetPassword}
            lang={lang} setLang={setLang} t={t}
        />
    );

    if (!user.emailVerified) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl max-w-sm w-full text-center border border-slate-100 dark:border-slate-800">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail size={32} />
                    </div>
                    <h2 className="text-xl font-bold mb-2 dark:text-white">{t.verify_email_title}</h2>
                    <p className="text-sm text-slate-500 mb-6">
                        {t.verify_email_text_start} <span className="font-bold text-slate-700 dark:text-slate-300">{user.email}</span>. {t.verify_email_text_end}
                    </p>
                    <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mb-3 hover:bg-blue-700 transition-colors">
                        {t.i_verified_btn}
                    </button>
                    <button onClick={logout} className="w-full text-slate-400 text-sm font-bold hover:text-slate-600">
                        {t.logout}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-2 sm:p-4 pb-24 text-slate-800 dark:text-slate-200 font-sans flex flex-col transition-colors duration-300">
            <Toaster position="top-right" />

            <AppRoutes
                user={user}
                t={t}
                lang={lang}
                currency={currency}
                formatMoney={formatMoney}
                budgetData={{ ...budgetData, isPendingApproval }}
                actions={{ ...actions, logout }} // Pass logout here
                familySync={familySync}
                activeBudgetId={activeBudgetId}
                budgetOwnerId={budgetData.budgetOwnerId}
                hydratedMembers={hydratedMembers}
            />

            <ModalManager />
        </div>
    );
};

export default function App() {
    return (
        <AppProviders>
            <AppContent />
        </AppProviders>
    );
}
