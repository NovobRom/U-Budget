import { Wallet, ArrowRight, Loader2, Check } from 'lucide-react';
import React, { useState } from 'react';

import AuthForm from './auth/AuthForm';
import SocialLogin from './auth/SocialLogin';

export default function AuthScreen({
    onLogin,
    onRegister,
    onGoogleLogin,
    onResetPassword,
    lang,
    setLang,
    t,
}) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSocialLoading, setIsSocialLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showForgot, setShowForgot] = useState(false);

    // --- PASSWORD CHECK LOGIC ---
    const checkPassword = (pass) => {
        return {
            len: pass.length >= 8,
            upper: /[A-Z]/.test(pass),
            lower: /[a-z]/.test(pass),
            num: /[0-9]/.test(pass),
            spec: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
        };
    };
    const passChecks = checkPassword(password);
    const isPassValid = Object.values(passChecks).every(Boolean);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!isLogin && !showForgot && !isPassValid) {
            setError(lang === 'ua' ? 'Пароль надто слабкий' : 'Password is too weak');
            return;
        }

        setLoading(true);
        try {
            if (showForgot) {
                await onResetPassword(email);
                setSuccessMessage(
                    lang === 'ua'
                        ? 'Інструкції надіслано на пошту!'
                        : 'Reset instructions sent to email!'
                );
                setTimeout(() => {
                    setShowForgot(false);
                    setSuccessMessage('');
                }, 3000);
            } else if (isLogin) {
                await onLogin(email, password);
            } else {
                await onRegister(email, password, name);
                setSuccessMessage(
                    lang === 'ua'
                        ? 'Аккаунт створено! Перевірте пошту для підтвердження.'
                        : 'Account created! Check your email for verification.'
                );
            }
        } catch (err) {
            console.error(err);
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (providerMethod) => {
        if (isSocialLoading) return;
        setError('');
        setSuccessMessage('');
        setIsSocialLoading(true);
        try {
            await providerMethod();
        } catch (err) {
            console.error('Social Auth Failed:', err);
            handleAuthError(err);
            setIsSocialLoading(false);
        }
    };

    const handleAuthError = (err) => {
        const code = err.code || '';

        // Security: Avoid leaking user existence by using generic messages
        if (
            code === 'auth/invalid-credential' ||
            code === 'auth/user-not-found' ||
            code === 'auth/wrong-password' ||
            code === 'auth/invalid-email'
        ) {
            setError(lang === 'ua' ? 'Невірний email або пароль' : 'Invalid email or password');
        } else if (code === 'auth/email-already-in-use') {
            setError(lang === 'ua' ? 'Цей email вже зареєстрований' : 'Email already in use');
        } else if (code === 'auth/popup-closed-by-user') {
            setError(lang === 'ua' ? 'Вхід скасовано' : 'Sign in cancelled');
        } else if (code === 'auth/too-many-requests') {
            setError(
                lang === 'ua'
                    ? 'Забагато спроб. Спробуйте пізніше'
                    : 'Too many attempts. Try again later'
            );
        } else if (code === 'auth/network-request-failed') {
            setError(
                lang === 'ua'
                    ? "Помилка мережі. Перевірте з'єднання"
                    : 'Network error. Check your connection'
            );
        } else if (code === 'auth/weak-password') {
            setError(lang === 'ua' ? 'Пароль надто слабкий' : 'Password is too weak');
        } else if (code === 'auth/operation-not-allowed') {
            setError(lang === 'ua' ? 'Цей метод входу вимкнено' : 'Sign in method disabled');
        } else {
            console.error('Unknown Auth Error:', err);
            setError(
                lang === 'ua'
                    ? 'Сталася помилка. Спробуйте ще раз'
                    : 'An error occurred. Please try again'
            );
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
            {/* Language Switcher */}
            <div className="absolute top-6 right-6">
                <button
                    onClick={() => {
                        const nextLang = lang === 'ua' ? 'en' : lang === 'en' ? 'pl' : 'ua';
                        setLang(nextLang);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-full shadow-sm text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-transform hover:scale-105"
                >
                    {lang === 'ua' ? '🇺🇦 UA' : lang === 'en' ? '🇺🇸 EN' : '🇵🇱 PL'}
                </button>
            </div>

            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 transition-all">
                {/* Header / Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 transform -rotate-6">
                        <Wallet className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
                        U-Budget
                    </h1>
                    <p className="text-blue-500 font-medium text-sm">{t.welcome_slogan}</p>
                </div>

                {/* Tabs Switcher */}
                {!showForgot && (
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-8 relative">
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(true);
                                setError('');
                                setSuccessMessage('');
                            }}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${isLogin ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            {t.login}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(false);
                                setError('');
                                setSuccessMessage('');
                            }}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${!isLogin ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            {t.register}
                        </button>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <AuthForm
                        isLogin={isLogin}
                        showForgot={showForgot}
                        email={email}
                        setEmail={setEmail}
                        password={password}
                        setPassword={setPassword}
                        name={name}
                        setName={setName}
                        passChecks={passChecks}
                        t={t}
                    />

                    {error && (
                        <div className="text-red-500 text-xs text-center font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-xl animate-in fade-in slide-in-from-top-1 border border-red-100 dark:border-red-900/30">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="text-green-600 text-xs text-center font-bold bg-green-50 dark:bg-green-900/20 p-3 rounded-xl animate-in fade-in slide-in-from-top-1 border border-green-100 dark:border-green-900/30 flex items-center justify-center gap-2">
                            <Check size={14} />
                            {successMessage}
                        </div>
                    )}

                    {!showForgot && isLogin && (
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowForgot(true)}
                                className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
                            >
                                {t.forgot_password}
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || isSocialLoading}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 disabled:opacity-50 disabled:scale-100"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                {showForgot
                                    ? t.send_reset
                                    : isLogin
                                        ? t.login_btn
                                        : t.create_account}
                                {!loading && <ArrowRight size={18} />}
                            </>
                        )}
                    </button>
                </form>

                {showForgot && (
                    <button
                        onClick={() => setShowForgot(false)}
                        className="w-full mt-4 py-3 text-sm font-bold text-slate-500 hover:text-slate-700"
                    >
                        {t.back_to_login}
                    </button>
                )}

                <SocialLogin
                    onGoogleLogin={() => handleSocialLogin(onGoogleLogin)}
                    isSocialLoading={isSocialLoading}
                    loading={loading}
                    showForgot={showForgot}
                />
            </div>
        </div>
    );
}
