import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Toaster, toast } from 'react-hot-toast';
// Added Coffee icon back for the mobile version
import { Coffee, Wallet, Loader2, Download, HelpCircle, AlertCircle, RefreshCw, LogOut, Mail } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore'; 
import { db, appId } from './firebase';
import { CURRENCIES } from './constants';
import { TRANSLATIONS } from './translations';
import { fetchExchangeRate } from './utils/currency';
import { useAuth } from './hooks/useAuth';
import { useBudget } from './hooks/useBudget';
import { useFamilySync } from './hooks/useFamilySync';
import { useTeamMembers } from './hooks/useTeamMembers'; // <--- Ensure this is imported

// Main components
import AuthScreen from './components/AuthScreen';
import BudgetView from './components/views/BudgetView';

// Lazy loaded views
const AssetsView = lazy(() => import('./components/views/AssetsView'));
const CreditsView = lazy(() => import('./components/views/CreditsView'));
const TransactionForm = lazy(() => import('./components/TransactionForm'));

// MODALS
const LoanModal = lazy(() => import('./components/modals/LoanModal'));
const LoanPaymentModal = lazy(() => import('./components/modals/LoanPaymentModal'));
const AssetModal = lazy(() => import('./components/modals/AssetModal'));
const CategoryModal = lazy(() => import('./components/modals/CategoryModal'));
const LinkModal = lazy(() => import('./components/modals/LinkModal'));
const SettingsModal = lazy(() => import('./components/modals/SettingsModal'));
const InfoModal = lazy(() => import('./components/modals/InfoModal'));
const RecurringModal = lazy(() => import('./components/modals/RecurringModal'));

const formatMoney = (amount, currencyCode) => {
    const symbol = CURRENCIES[currencyCode]?.symbol || '$';
    return `${symbol}${Math.abs(amount).toFixed(2)}`;
};

// LCP OPTIMIZATION: App Shell Skeleton
// This shows immediately while auth/data is loading instead of a blank spinner
const AppShell = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-2 sm:p-4">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm mb-4 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-xl text-slate-200 dark:text-slate-800">
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
                <div className="w-24 h-6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
            <div className="flex gap-3">
                <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
                <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
            </div>
        </div>
        {/* Tabs Skeleton */}
        <div className="flex justify-center gap-4 mb-4">
            <div className="w-24 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
            <div className="w-24 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
            <div className="w-24 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
        </div>
        {/* Content Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
             <div className="col-span-2 lg:col-span-1 h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
             <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
             <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
        </div>
    </div>
);

export default function App() {
    const [activeTab, setActiveTab] = useState('budget');
    const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ua');
    const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'EUR');
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [showLoanModal, setShowLoanModal] = useState(false);
    const [editingLoan, setEditingLoan] = useState(null);
    const [showLoanPaymentModal, setShowLoanPaymentModal] = useState(false);
    const [activeLoanForPayment, setActiveLoanForPayment] = useState(null);
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [isFetchingRate, setIsFetchingRate] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showRecurringModal, setShowRecurringModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(null);

    const { 
        user, loading: authLoading, activeBudgetId, isPendingApproval,
        login, register, logout, resetPassword, googleLogin, appleLogin 
    } = useAuth();

    const { 
        transactions, loans, assets, 
        allCategories, categoryLimits, 
        allowedUsers, // <--- We use raw UIDs from here
        totalCreditDebt,
        currentBalance, 
        loadMore, hasMore,
        
        addTransaction, updateTransaction, deleteTransaction,
        addLoan, updateLoan, deleteLoan,
        addAsset, updateAsset, deleteAsset,
        saveLimit, addCategory, deleteCategory,
        removeUser,
        budgetOwnerId, 
        leaveBudget,
        switchBudget,
        recalculateBalance 
    } = useBudget(activeBudgetId, isPendingApproval, user, lang, currency);

    const { 
        incomingRequests, sendJoinRequest, cancelSentRequest, approveRequest, declineRequest 
    } = useFamilySync(user?.uid, user?.email, user?.displayName);

    // --- HYDRATE TEAM MEMBERS ---
    // Use the new separate hook to fetch user details based on UIDs
    const { members: hydratedMembers } = useTeamMembers(allowedUsers, budgetOwnerId, user?.uid);

    const t = TRANSLATIONS[lang] || TRANSLATIONS['ua'];

    useEffect(() => { localStorage.setItem('theme', darkMode ? 'dark' : 'light'); document.documentElement.classList.toggle('dark', darkMode); }, [darkMode]);
    useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);
    useEffect(() => { localStorage.setItem('currency', currency); }, [currency]);

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

    const handleSaveTransaction = async (data) => {
        try {
            if (editingTransaction) await updateTransaction(editingTransaction.id, data);
            else await addTransaction(data);
            setShowTransactionModal(false); setEditingTransaction(null);
            toast.success(t.success_save);
        } catch (e) { toast.error(t.error_save); }
    };

    const handleSaveLoan = async (data) => {
        try {
            if (editingLoan) await updateLoan(editingLoan.id, data);
            else await addLoan(data);
            setShowLoanModal(false); setEditingLoan(null);
            toast.success(t.success_save);
        } catch (e) { toast.error("Error saving credit"); }
    };

    const handleLoanPayment = async (amount, loan) => {
        try {
            const numAmount = parseFloat(amount);
            if (numAmount <= 0) return;
            const newBalance = loan.currentBalance - numAmount;
            await updateLoan(loan.id, { currentBalance: newBalance });
            setShowLoanPaymentModal(false); setActiveLoanForPayment(null);
            toast.success(t.payment_recorded);
        } catch (e) { toast.error("Payment failed"); }
    };

    const handleFetchCryptoRate = async (coinId, setValCb) => {
        setIsFetchingRate(true);
        try {
            const rate = await fetchExchangeRate(coinId, currency, true);
            if (rate && rate !== 1) {
                setValCb(rate);
                toast.success(`Rate: ${rate} ${currency}`);
            } else { 
                toast.error("Could not fetch rate.");
            }
        } catch(e) { toast.error("Fetch failed"); }
        setIsFetchingRate(false);
    };

    const handleSaveAsset = async (data) => {
        try {
            if (editingAsset) await updateAsset(editingAsset.id, { ...data, currency });
            else await addAsset({ ...data, currency });
            setShowAssetModal(false); setEditingAsset(null);
            toast.success(t.success_save);
        } catch (e) { toast.error(t.error_save); }
    };

    const handleExport = (data, filename = 'export') => {
        const tableContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body><table>${data}</table></body></html>`;
        const blob = new Blob([tableContent], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a"); link.href = url; link.download = `${filename}.xls`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const getCategoryStyles = (categoryId) => {
        const cat = allCategories.find(c => c.id === categoryId);
        const lowerId = categoryId.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
        return { 
            name: cat?.isCustom ? cat.name : (t[cat?.id] || t[lowerId] || cat?.name || categoryId),
            icon: cat?.icon,
            color: cat?.color || 'bg-slate-100',
            textColor: cat?.textColor || 'text-slate-600'
        };
    };

    const getCategoryName = (cat) => cat.isCustom ? cat.name : (t[cat.id] || t[cat.id.toLowerCase()] || cat.name);

    // USE APP SHELL INSTEAD OF SPINNER FOR FASTER LCP
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

            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm mb-4 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 font-bold text-xl"><Wallet className="text-blue-500"/> U-Budget</div>
                <div className="flex gap-3 items-center">
                    
                    {/* ADAPTIVE BUY ME A COFFEE BUTTONS */}
                    
                    {/* Mobile version: Compact circular button with icon (visible only on small screens) */}
                    <a 
                        href="https://www.buymeacoffee.com/novobrom" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="sm:hidden flex items-center justify-center w-9 h-9 bg-[#FFDD00] hover:bg-[#E6C800] text-slate-900 rounded-full transition-colors shadow-sm"
                    >
                        <Coffee size={18} />
                    </a>

                    {/* Desktop version: Full image button (visible only on screens sm and larger) */}
                    <a 
                        href="https://www.buymeacoffee.com/novobrom" 
                        target="_blank" 
                        rel="noreferrer"
                        className="hidden sm:block hover:opacity-90 transition-opacity"
                    >
                        <img 
                            src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=novobrom&button_colour=FFDD00&font_colour=000000&font_family=Poppins&outline_colour=000000&coffee_colour=ffffff" 
                            alt="Buy me a coffee" 
                            className="h-9" 
                        />
                    </a>
                    
                    <button onClick={() => setShowSettingsModal(true)} className="relative w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-xs border border-slate-200 dark:border-slate-700">
                        {/* Added explicit width/height to prevent layout shift */}
                        {user.photoURL ? <img src={user.photoURL} alt="User" width="36" height="36" className="w-full h-full rounded-full" /> : (user.displayName?.[0] || 'U')}
                        {incomingRequests.length > 0 && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>}
                    </button>
                </div>
            </div>

            {isPendingApproval && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-4 rounded-2xl mb-4 flex justify-between items-center animate-in fade-in">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="text-yellow-600 dark:text-yellow-400" />
                        <span className="font-bold text-sm text-yellow-800 dark:text-yellow-200">{t.pending_approval}</span>
                    </div>
                    <button 
                        onClick={async () => {
                            try {
                                await cancelSentRequest();
                                toast.success("Request cancelled");
                            } catch (e) { toast.error("Error cancelling request"); }
                        }}
                        className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    >
                        {t.cancel_request}
                    </button>
                </div>
            )}

            {!isPendingApproval && (
                <div className="flex justify-center gap-4 mb-4">
                    {['budget', 'assets', 'credits'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-xl font-bold ${activeTab === tab ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                            {t[`${tab}${tab === 'assets' ? '' : '_tab'}`] || t[tab]}
                        </button>
                    ))}
                </div>
            )}

            <Suspense fallback={<AppShell />}>
                {activeTab === 'budget' && !isPendingApproval && (
                    <BudgetView 
                        transactions={transactions} categories={allCategories} limits={categoryLimits} 
                        currency={currency} formatMoney={formatMoney} t={t} lang={lang}
                        onOpenSettings={() => setShowSettingsModal(true)}
                        onOpenInvite={() => setShowLinkModal(true)}
                        onOpenJoin={() => setShowLinkModal(true)}
                        onOpenRecurring={() => setShowRecurringModal(true)}
                        onAddTransaction={() => { setEditingTransaction(null); setShowTransactionModal(true); }}
                        onEditTransaction={(tx) => { setEditingTransaction(tx); setShowTransactionModal(true); }}
                        onDeleteTransaction={deleteTransaction}
                        onExport={(data) => {
                            const html = `<thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Type</th><th>Amount</th><th>User</th></tr></thead><tbody>${data.map(tr => `<tr><td>${tr.date}</td><td>${getCategoryStyles(tr.category).name}</td><td>${tr.description}</td><td>${tr.type}</td><td>${Number(tr.amount).toFixed(2)}</td><td>${tr.userName || ''}</td></tr>`).join('')}</tbody>`;
                            handleExport(html, 'transactions');
                        }}
                        getCategoryStyles={getCategoryStyles}
                        getCategoryName={getCategoryName}
                        currentBalance={currentBalance}
                        loadMore={loadMore}
                        hasMore={hasMore}
                        recalculateBalance={recalculateBalance} // <--- FIX: Passing it down
                    />
                )}

                {activeTab === 'assets' && !isPendingApproval && (
                    <AssetsView 
                        assets={assets} 
                        currency={currency} formatMoney={formatMoney} t={t}
                        onAddAsset={() => { setEditingAsset(null); setShowAssetModal(true); }}
                        onEditAsset={(a) => { setEditingAsset(a); setShowAssetModal(true); }}
                        onDeleteAsset={deleteAsset}
                        onExport={() => {
                            const html = `<thead><tr><th>Name</th><th>Type</th><th>Amount</th><th>Value Per Unit</th><th>Currency</th><th>Total</th></tr></thead><tbody>${assets.map(a => `<tr><td>${a.name}</td><td>${a.type}</td><td>${a.amount}</td><td>${a.valuePerUnit}</td><td>${a.currency}</td><td>${a.amount * a.valuePerUnit}</td></tr>`).join('')}</tbody>`;
                            handleExport(html, 'assets');
                        }}
                    />
                )}

                {activeTab === 'credits' && !isPendingApproval && (
                    <CreditsView 
                        loans={loans} totalCreditDebt={totalCreditDebt} currency={currency} formatMoney={formatMoney} t={t}
                        onAddLoan={() => { setEditingLoan(null); setShowLoanModal(true); }}
                        onEditLoan={(l) => { setEditingLoan(l); setShowLoanModal(true); }}
                        onDeleteLoan={deleteLoan}
                        onPayLoan={(l) => { setActiveLoanForPayment(l); setShowLoanPaymentModal(true); }}
                        onExport={() => {
                            const html = `<thead><tr><th>Name</th><th>Total Debt</th><th>Current Balance</th><th>Interest</th><th>Currency</th></tr></thead><tbody>${loans.map(l => `<tr><td>${l.name}</td><td>${l.totalAmount}</td><td>${l.currentBalance}</td><td>${l.interestRate}</td><td>${l.currency}</td></tr>`).join('')}</tbody>`;
                            handleExport(html, 'loans');
                        }}
                    />
                )}
            </Suspense>

            <footer className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 text-center pb-8">
                <div className="flex justify-center flex-wrap gap-4 sm:gap-6 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                     <button onClick={() => setShowInfoModal('privacy')} className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">{t.privacy_title}</button>
                     <button onClick={() => setShowInfoModal('terms')} className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">{t.terms_title}</button>
                     <button onClick={() => setShowInfoModal('support')} className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center gap-1"><HelpCircle size={12}/> {t.support_title}</button>
                     <button onClick={() => setShowInfoModal('install')} className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center gap-1"><Download size={12}/> {t.install_app}</button>
                </div>
                <p className="text-[10px] text-slate-300">{t.copyright}</p>
            </footer>

            <Suspense fallback={null}>
                {showTransactionModal && (
                    <TransactionForm
                        isOpen={showTransactionModal}
                        onClose={() => setShowTransactionModal(false)}
                        onSave={handleSaveTransaction}
                        onDelete={deleteTransaction}
                        categories={allCategories}
                        editingTransaction={editingTransaction}
                        currencyCode={currency}
                        t={t} 
                        getCategoryName={getCategoryName}
                        onAddCategory={() => setShowCategoryModal(true)}
                    />
                )}

                {showLoanModal && (
                    <LoanModal 
                        isOpen={showLoanModal} onClose={() => setShowLoanModal(false)}
                        onSave={handleSaveLoan} editingLoan={editingLoan} t={t}
                    />
                )}

                {showLoanPaymentModal && (
                    <LoanPaymentModal
                        isOpen={showLoanPaymentModal} onClose={() => setShowLoanPaymentModal(false)}
                        onPayment={handleLoanPayment} 
                        loan={activeLoanForPayment} 
                        currencySymbol={activeLoanForPayment ? CURRENCIES[activeLoanForPayment.currency]?.symbol : '$'} 
                        t={t}
                    />
                )}

                {showAssetModal && (
                    <AssetModal
                        isOpen={showAssetModal} onClose={() => setShowAssetModal(false)}
                        onSave={handleSaveAsset} onFetchRate={handleFetchCryptoRate} isFetchingRate={isFetchingRate}
                        editingAsset={editingAsset} t={t} currency={currency}
                    />
                )}

                {showCategoryModal && (
                    <CategoryModal
                        isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)}
                        onSave={async (data) => {
                            await addCategory({ ...data, id: `custom_${Date.now()}`, isCustom: true });
                            setShowCategoryModal(false); toast.success(t.success_save);
                        }}
                        t={t}
                    />
                )}

                {showLinkModal && (
                    <LinkModal
                        isOpen={showLinkModal} onClose={() => setShowLinkModal(false)}
                        userUid={user.uid}
                        onJoinRequest={async (targetId) => {
                            try {
                                await sendJoinRequest(targetId);
                                setShowLinkModal(false);
                                toast.success("Request sent!");
                            } catch (error) {
                                const errorMsg = t[error.message] || "Error sending request";
                                toast.error(errorMsg);
                            }
                        }}
                        t={t}
                    />
                )}

                {showRecurringModal && (
                    <RecurringModal
                        isOpen={showRecurringModal}
                        onClose={() => setShowRecurringModal(false)}
                        transactions={transactions}
                        onAdd={async (tx) => {
                            await addTransaction(tx);
                            toast.success(t.success_save);
                        }}
                        formatMoney={formatMoney}
                        currency={currency}
                        t={t}
                    />
                )}

                {showSettingsModal && (
                    <SettingsModal
                        isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)}
                        lang={lang} setLang={setLang}
                        currency={currency} setCurrency={setCurrency}
                        darkMode={darkMode} setDarkMode={setDarkMode}
                        incomingRequests={incomingRequests}
                        approveRequest={approveRequest} declineRequest={declineRequest}
                        categories={allCategories}
                        limits={categoryLimits}
                        onSaveLimit={saveLimit}
                        onDeleteCategory={deleteCategory}
                        onLogout={logout}
                        t={t} getCategoryName={getCategoryName}
                        
                        allowedUsers={hydratedMembers} // <--- PASSING HYDRATED MEMBERS HERE
                        removeUser={removeUser}
                        leaveBudget={leaveBudget}
                        currentUserId={user?.uid}
                        isOwner={user?.uid === budgetOwnerId}
                        
                        activeBudgetId={activeBudgetId}
                        switchBudget={switchBudget}
                        user={user} // <--- PASSING USER HERE
                    />
                )}

                {showInfoModal && (
                    <InfoModal 
                        type={showInfoModal} onClose={() => setShowInfoModal(null)} t={t} 
                    />
                )}
            </Suspense>
        </div>
    );
}