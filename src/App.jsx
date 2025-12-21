import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { Mail } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore'; 
import { db, appId } from './firebase';
import { CURRENCIES } from './constants';
import { fetchExchangeRate } from './utils/currency';

// HOOKS
import { useAuth } from './hooks/useAuth';
import { useBudget } from './hooks/useBudget';
import { useFamilySync } from './hooks/useFamilySync';
import { useTeamMembers } from './hooks/useTeamMembers';
import { useLanguage } from './context/LanguageContext';
import { useCurrency } from './context/CurrencyContext';
// Removed: useModal from ModalContext (Context API Deprecated)

// STORE & PROVIDERS
import { AppProviders } from './providers/AppProviders';
import { useBudgetStore } from './store/useBudgetStore';
import { useModalStore } from './store/useModalStore'; // Added: Modal Store

// COMPONENTS
import Layout from './components/Layout';
import AuthScreen from './components/AuthScreen';
import AppShell from './components/AppShell';
import ModalManager from './components/modals/ModalManager';

// Lazy loaded views
const BudgetView = lazy(() => import('./components/views/BudgetView'));
const AssetsView = lazy(() => import('./components/views/AssetsView'));
const CreditsView = lazy(() => import('./components/views/CreditsView'));

/**
 * AppContent
 * The core application logic.
 */
const AppContent = () => {
    const { lang, setLang, t } = useLanguage();
    const { currency, formatMoney } = useCurrency();
    
    // --- MODAL STORE SELECTORS (Replaces Context) ---
    const openModal = useModalStore((state) => state.openModal);
    const closeModal = useModalStore((state) => state.closeModal);
    
    // Removed local darkMode state; now handled by ThemeProvider

    // --- ZUSTAND STORE ACTIONS ---
    const { 
        // Transactions
        addTransaction: storeAddTransaction, 
        updateTransaction: storeUpdateTransaction,
        deleteTransaction: storeDeleteTransaction,
        // Assets
        addAsset: storeAddAsset,
        updateAsset: storeUpdateAsset,
        deleteAsset: storeDeleteAsset,
        // Loans
        addLoan: storeAddLoan,
        updateLoan: storeUpdateLoan,
        deleteLoan: storeDeleteLoan,
        payLoan: storePayLoan,
        // Categories & Settings
        addCategory: storeAddCategory,
        deleteCategory: storeDeleteCategory,
        saveCategoryLimit: storeSaveLimit,
        removeUserFromBudget: storeRemoveUser,
        leaveBudget: storeLeaveBudget
    } = useBudgetStore();

    const { 
        user, loading: authLoading, activeBudgetId, isPendingApproval,
        login, register, logout, resetPassword, googleLogin, appleLogin 
    } = useAuth();

    // Legacy useBudget is used ONLY for subscriptions (reading data)
    const { 
        transactions, loans, assets, 
        allCategories, categoryLimits, 
        allowedUsers, totalCreditDebt, currentBalance, 
        loadMore, hasMore,
        
        switchBudget, recalculateBalance, budgetOwnerId 
    } = useBudget(activeBudgetId, isPendingApproval, user, lang, currency);

    const { 
        incomingRequests, sendJoinRequest, cancelSentRequest, approveRequest, declineRequest 
    } = useFamilySync(user?.uid, user?.email, user?.displayName);

    const { members: hydratedMembers } = useTeamMembers(allowedUsers, budgetOwnerId, user?.uid);

    // --- EFFECTS ---
    
    // Dynamic website title update based on current language
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

    // --- ACTION HANDLERS (Delegating to Store) ---
    
    // Transactions
    const handleSaveTransaction = async (data, editingTx) => {
        try {
            if (editingTx) {
                await storeUpdateTransaction(activeBudgetId, editingTx.id, data, currency, t);
            } else {
                await storeAddTransaction(activeBudgetId, user, data, currency, t);
            }
            closeModal();
        } catch (e) { /* Error handled in store */ }
    };

    const handleDeleteTransaction = async (id) => {
        if (!confirm(t.confirm_delete || 'Delete?')) return;
        await storeDeleteTransaction(activeBudgetId, id, t);
    };

    // Loans
    const handleSaveLoan = async (data, editingLoan) => {
        try {
            if (editingLoan) {
                await storeUpdateLoan(activeBudgetId, editingLoan.id, data, t);
            } else {
                await storeAddLoan(activeBudgetId, data, t);
            }
            closeModal();
        } catch (e) { /* Error handled in store */ }
    };

    const handleDeleteLoan = async (id) => {
        if (!confirm(t.confirm_delete || 'Delete?')) return;
        await storeDeleteLoan(activeBudgetId, id, t);
    };

    const handleLoanPayment = async (amount, loan) => {
        try {
            await storePayLoan(activeBudgetId, loan, amount, t);
            closeModal();
        } catch (e) { /* Error handled in store */ }
    };

    // Assets
    const handleSaveAsset = async (data, editingAsset) => {
        try {
            if (editingAsset) {
                await storeUpdateAsset(activeBudgetId, editingAsset.id, data, currency, t);
            } else {
                await storeAddAsset(activeBudgetId, data, currency, t);
            }
            closeModal();
        } catch (e) { /* Error handled in store */ }
    };

    const handleDeleteAsset = async (id) => {
        if (!confirm(t.confirm_delete || 'Delete?')) return;
        await storeDeleteAsset(activeBudgetId, id, t);
    };

    // Settings / Categories
    const handleAddCategory = async (data) => {
        await storeAddCategory(activeBudgetId, data, t);
        closeModal();
    };

    const handleDeleteCategory = async (catId) => {
         await storeDeleteCategory(activeBudgetId, catId, t);
    };

    const handleSaveLimit = async (catId, amount) => {
        await storeSaveLimit(activeBudgetId, catId, amount, t);
    };

    const handleRemoveUser = async (uid) => {
        await storeRemoveUser(activeBudgetId, uid, t);
    };

    const handleLeaveBudget = async () => {
        if (!confirm("Are you sure?")) return;
        await storeLeaveBudget(activeBudgetId, user?.uid, t);
    };

    // Misc
    const handleFetchCryptoRate = async (coinId, setValCb) => {
        try {
            const rate = await fetchExchangeRate(coinId, currency, true);
            if (rate && rate !== 1) {
                setValCb(rate);
                toast.success(`Rate: ${rate} ${currency}`);
            } else { 
                toast.error("Could not fetch rate.");
            }
        } catch(e) { toast.error("Fetch failed"); }
    };

    const handleExport = (data, filename = 'export') => {
        const tableContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body><table>${data}</table></body></html>`;
        const blob = new Blob([tableContent], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a"); link.href = url; link.download = `${filename}.xls`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    // Helpers
    const getCategoryStyles = (categoryId) => {
        const cat = allCategories.find(c => c.id === categoryId);
        return { 
            name: cat?.isCustom ? cat.name : (t[cat?.id] || t[categoryId?.toLowerCase()?.replace(/ & /g, '_')?.replace(/ /g, '_')] || cat?.name || categoryId),
            icon: cat?.icon,
            color: cat?.color || 'bg-slate-100',
            textColor: cat?.textColor || 'text-slate-600'
        };
    };
    const getCategoryName = (cat) => cat.isCustom ? cat.name : (t[cat.id] || t[cat.id.toLowerCase()] || cat.name);

    const handleCancelRequest = async () => {
        try {
            await cancelSentRequest();
            toast.success("Request cancelled");
        } catch (e) { toast.error("Error cancelling request"); }
    };

    // --- MODAL OPENERS ---

    const openTransactionModal = (tx = null) => {
        openModal('transaction', {
            editingTransaction: tx,
            onSave: (data) => handleSaveTransaction(data, tx),
            onDelete: handleDeleteTransaction,
            categories: allCategories,
            currencyCode: currency,
            t,
            getCategoryName,
            onAddCategory: () => openModal('category', {
                onSave: handleAddCategory,
                t
            })
        });
    };

    const openLoanModal = (loan = null) => {
        openModal('loan', {
            editingLoan: loan,
            onSave: (data) => handleSaveLoan(data, loan),
            t
        });
    };

    const openAssetModal = (asset = null) => {
        openModal('asset', {
            editingAsset: asset,
            onSave: (data) => handleSaveAsset(data, asset),
            onFetchRate: handleFetchCryptoRate,
            isFetchingRate: false,
            t,
            currency
        });
    };

    const openSettings = () => {
        openModal('settings', {
            // Removed global state props (lang, currency, darkMode)
            incomingRequests, approveRequest, declineRequest,
            categories: allCategories, limits: categoryLimits,
            onSaveLimit: handleSaveLimit, 
            onDeleteCategory: handleDeleteCategory,
            onLogout: logout,
            t, getCategoryName,
            allowedUsers: hydratedMembers,
            removeUser: handleRemoveUser, 
            leaveBudget: handleLeaveBudget, 
            switchBudget,
            currentUserId: user?.uid,
            isOwner: user?.uid === budgetOwnerId,
            activeBudgetId, user
        });
    };

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
                        <Mail size={32}/>
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

            <Routes>
                <Route element={
                    <Layout 
                        user={user} 
                        t={t} 
                        isPendingApproval={isPendingApproval}
                        incomingRequestsCount={incomingRequests.length}
                        onOpenSettings={openSettings}
                        onCancelRequest={handleCancelRequest}
                        onOpenInfo={(type) => openModal('info', { type, t })}
                    />
                }>
                    <Route index element={
                        <Suspense fallback={<AppShell />}>
                            <BudgetView 
                                transactions={transactions} categories={allCategories} limits={categoryLimits} 
                                currency={currency} formatMoney={formatMoney} t={t} lang={lang}
                                onOpenSettings={openSettings}
                                onOpenInvite={() => openModal('link', { 
                                    userUid: user.uid, 
                                    onJoinRequest: async (targetId) => {
                                        try { await sendJoinRequest(targetId); closeModal(); toast.success("Request sent!"); } 
                                        catch (e) { toast.error(t[e.message] || "Error"); }
                                    }, 
                                    t 
                                })}
                                onOpenJoin={() => openModal('link', { 
                                    userUid: user.uid, 
                                    onJoinRequest: async (targetId) => {
                                        try { await sendJoinRequest(targetId); closeModal(); toast.success("Request sent!"); } 
                                        catch (e) { toast.error(t[e.message] || "Error"); }
                                    }, 
                                    t 
                                })}
                                onOpenRecurring={() => openModal('recurring', {
                                    transactions,
                                    onAdd: async (tx) => { await storeAddTransaction(activeBudgetId, user, tx, currency, t); },
                                    formatMoney, currency, t
                                })}
                                onAddTransaction={() => openTransactionModal(null)}
                                onEditTransaction={(tx) => openTransactionModal(tx)}
                                onDeleteTransaction={handleDeleteTransaction}
                                onExport={(data) => {
                                    const html = `<thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Type</th><th>Amount</th><th>User</th></tr></thead><tbody>${data.map(tr => `<tr><td>${tr.date}</td><td>${getCategoryStyles(tr.category).name}</td><td>${tr.description}</td><td>${tr.type}</td><td>${Number(tr.amount).toFixed(2)}</td><td>${tr.userName || ''}</td></tr>`).join('')}</tbody>`;
                                    handleExport(html, 'transactions');
                                }}
                                getCategoryStyles={getCategoryStyles}
                                getCategoryName={getCategoryName}
                                currentBalance={currentBalance}
                                loadMore={loadMore}
                                hasMore={hasMore}
                                recalculateBalance={recalculateBalance}
                            />
                        </Suspense>
                    } />
                    <Route path="assets" element={
                        <Suspense fallback={<AppShell />}>
                            <AssetsView 
                                assets={assets} 
                                currency={currency} formatMoney={formatMoney} t={t}
                                onAddAsset={() => openAssetModal(null)}
                                onEditAsset={(a) => openAssetModal(a)}
                                onDeleteAsset={handleDeleteAsset}
                                onExport={() => {
                                    const html = `<thead><tr><th>Name</th><th>Type</th><th>Amount</th><th>Value Per Unit</th><th>Currency</th><th>Total</th></tr></thead><tbody>${assets.map(a => `<tr><td>${a.name}</td><td>${a.type}</td><td>${a.amount}</td><td>${a.valuePerUnit}</td><td>${a.currency}</td><td>${a.amount * a.valuePerUnit}</td></tr>`).join('')}</tbody>`;
                                    handleExport(html, 'assets');
                                }}
                            />
                        </Suspense>
                    } />
                    <Route path="credits" element={
                        <Suspense fallback={<AppShell />}>
                            <CreditsView 
                                loans={loans} totalCreditDebt={totalCreditDebt} currency={currency} formatMoney={formatMoney} t={t}
                                onAddLoan={() => openLoanModal(null)}
                                onEditLoan={(l) => openLoanModal(l)}
                                onDeleteLoan={handleDeleteLoan}
                                onPayLoan={(l) => openModal('loanPayment', {
                                    loan: l,
                                    onPayment: handleLoanPayment,
                                    currencySymbol: CURRENCIES[l.currency]?.symbol || '$',
                                    t
                                })}
                                onExport={() => {
                                    const html = `<thead><tr><th>Name</th><th>Total Debt</th><th>Current Balance</th><th>Interest</th><th>Currency</th></tr></thead><tbody>${loans.map(l => `<tr><td>${l.name}</td><td>${l.totalAmount}</td><td>${l.currentBalance}</td><td>${l.interestRate}</td><td>${l.currency}</td></tr>`).join('')}</tbody>`;
                                    handleExport(html, 'loans');
                                }}
                            />
                        </Suspense>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>

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