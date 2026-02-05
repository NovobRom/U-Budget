import { Coffee, Wallet, AlertCircle, Download, HelpCircle, Mail } from 'lucide-react';
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

/**
 * Layout
 * Improved accessibility for icon links and avatar buttons.
 */
const Layout = ({
    user,
    t,
    isPendingApproval,
    incomingRequestsCount,
    onOpenSettings,
    onCancelRequest,
    onOpenInfo,
}) => {
    const location = useLocation();
    const currentPath = location.pathname;

    const getTabClass = (path) => {
        const isActive = currentPath === path || (path === '/' && currentPath === '/budget');
        return `px-6 py-2 rounded-xl font-bold transition-colors ${
            isActive
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`;
    };

    return (
        <>
            {/* --- HEADER --- */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm mb-4 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-white">
                    <Wallet className="text-blue-500" aria-hidden="true" /> U-Budget
                </div>
                <div className="flex gap-3 items-center">
                    {/* Buy Me a Coffee - Mobile */}
                    <a
                        href="https://www.buymeacoffee.com/novobrom"
                        target="_blank"
                        rel="noreferrer"
                        className="sm:hidden flex items-center justify-center w-9 h-9 bg-[#FFDD00] hover:bg-[#E6C800] text-slate-900 rounded-full transition-colors shadow-sm"
                        aria-label="Buy me a coffee"
                    >
                        <Coffee size={18} aria-hidden="true" />
                    </a>

                    {/* Buy Me a Coffee - Desktop */}
                    <a
                        href="https://www.buymeacoffee.com/novobrom"
                        target="_blank"
                        rel="noreferrer"
                        className="hidden sm:block hover:opacity-90 transition-opacity"
                        aria-label="Buy me a coffee"
                    >
                        <img
                            src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=novobrom&button_colour=FFDD00&font_colour=000000&font_family=Poppins&outline_colour=000000&coffee_colour=ffffff"
                            alt="Buy me a coffee button"
                            className="h-9"
                            loading="lazy"
                        />
                    </a>

                    {/* User Avatar & Settings */}
                    <button
                        onClick={onOpenSettings}
                        className="relative w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-xs border border-slate-200 dark:border-slate-700 overflow-hidden"
                        aria-label={t.settings || 'Open settings'}
                    >
                        {user?.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt="User profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            (user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()
                        )}
                        {incomingRequestsCount > 0 && (
                            <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
                        )}
                    </button>
                </div>
            </div>

            {/* --- PENDING APPROVAL BANNER --- */}
            {isPendingApproval && (
                <div
                    className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-4 rounded-2xl mb-4 flex justify-between items-center animate-in fade-in"
                    role="alert"
                >
                    <div className="flex items-center gap-3">
                        <AlertCircle
                            className="text-yellow-600 dark:text-yellow-400"
                            aria-hidden="true"
                        />
                        <span className="font-bold text-sm text-yellow-800 dark:text-yellow-200">
                            {t.pending_approval}
                        </span>
                    </div>
                    <button
                        onClick={onCancelRequest}
                        className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    >
                        {t.cancel_request}
                    </button>
                </div>
            )}

            {/* --- NAVIGATION TABS --- */}
            {!isPendingApproval && (
                <nav className="flex justify-center gap-4 mb-4" aria-label="Main navigation">
                    <Link to="/" className={getTabClass('/')}>
                        {t.budget_tab || t.budget}
                    </Link>
                    <Link to="/assets" className={getTabClass('/assets')}>
                        {t.assets}
                    </Link>
                    <Link to="/credits" className={getTabClass('/credits')}>
                        {t.credits_tab || t.credits}
                    </Link>
                </nav>
            )}

            {/* --- MAIN CONTENT --- */}
            {!isPendingApproval && (
                <main>
                    <Outlet />
                </main>
            )}

            {/* --- FOOTER --- */}
            <footer className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 text-center pb-8">
                <div className="flex justify-center flex-wrap gap-4 sm:gap-6 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                    <button
                        onClick={() => onOpenInfo('privacy')}
                        className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        {t.privacy_title}
                    </button>
                    <button
                        onClick={() => onOpenInfo('terms')}
                        className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        {t.terms_title}
                    </button>
                    <button
                        onClick={() => onOpenInfo('support')}
                        className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
                    >
                        <HelpCircle size={12} aria-hidden="true" /> {t.support_title}
                    </button>
                    <button
                        onClick={() => onOpenInfo('install')}
                        className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
                    >
                        <Download size={12} aria-hidden="true" /> {t.install_app}
                    </button>
                </div>
                <p className="text-[10px] text-slate-300">{t.copyright}</p>
            </footer>
        </>
    );
};

export default Layout;
