import React, { useState } from 'react';
import { Wallet, Mail, Lock, User, ArrowRight, Loader2, Apple, Check } from 'lucide-react';

export default function AuthScreen({ onLogin, onRegister, onGoogleLogin, onAppleLogin, onResetPassword, lang, setLang, t }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showForgot, setShowForgot] = useState(false);

    // --- ЛОГІКА ПЕРЕВІРКИ ПАРОЛЯ (ОНОВЛЕНО) ---
    const checkPassword = (pass) => {
        return {
            len: pass.length >= 8,
            upper: /[A-Z]/.test(pass),
            lower: /[a-z]/.test(pass),
            num: /[0-9]/.test(pass),
            // Додано перевірку спецсимволу
            spec: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
        };
    };
    const passChecks = checkPassword(password);
    const isPassValid = Object.values(passChecks).every(Boolean);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Блокуємо реєстрацію, якщо пароль слабкий
        if (!isLogin && !showForgot && !isPassValid) {
            setError(lang === 'ua' ? "Пароль надто слабкий" : "Password is too weak");
            return;
        }

        setLoading(true);
        try {
            if (showForgot) {
                await onResetPassword(email);
                alert("Password reset email sent!");
                setShowForgot(false);
            } else if (isLogin) {
                await onLogin(email, password);
            } else {
                await onRegister(email, password, name);
            }
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/invalid-credential') {
                setError(lang === 'ua' ? "Невірний email або пароль" : "Invalid email or password");
            } else if (err.code === 'auth/email-already-in-use') {
                setError(lang === 'ua' ? "Цей email вже зареєстрований" : "Email already in use");
            } else {
                setError(err.message);
            }
        }
        setLoading(false);
    };

    // Компонент для пункту вимог пароля
    const PasswordRequirement = ({ met, text }) => (
        <div className={`flex items-center gap-2 text-[10px] ${met ? 'text-green-500' : 'text-slate-400'}`}>
            {met ? <Check size={10} /> : <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />}
            <span>{text}</span>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
            {/* Language Switcher */}
            <div className="absolute top-6 right-6">
                <button 
                    onClick={() => setLang(lang === 'ua' ? 'en' : 'ua')} 
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-full shadow-sm text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-transform hover:scale-105"
                >
                    {lang === 'ua' ? '🇺🇦 UA' : '🇺🇸 EN'}
                </button>
            </div>

            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 transition-all">
                
                {/* Header / Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 transform -rotate-6">
                        <Wallet className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">U-Budget</h1>
                    <p className="text-blue-500 font-medium text-sm">{t.welcome_slogan}</p>
                </div>

                {/* Tabs Switcher */}
                {!showForgot && (
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-8 relative">
                        <button 
                            type="button"
                            onClick={() => { setIsLogin(true); setError(''); }}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${isLogin ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            {t.login}
                        </button>
                        <button 
                            type="button"
                            onClick={() => { setIsLogin(false); setError(''); }}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${!isLogin ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            {t.register}
                        </button>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && !showForgot && (
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <User size={20} />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Name" 
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all dark:text-white font-medium text-sm"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <Mail size={20} />
                        </div>
                        <input 
                            type="email" 
                            placeholder={t.email_placeholder} 
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all dark:text-white font-medium text-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {!showForgot && (
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <Lock size={20} />
                            </div>
                            <input 
                                type="password" 
                                placeholder={t.password_placeholder} 
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all dark:text-white font-medium text-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    
                    {/* ПІДКАЗКИ ДЛЯ ПАРОЛЯ */}
                    {!isLogin && !showForgot && (
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                             <PasswordRequirement met={passChecks.len} text={t.pass_len} />
                             <PasswordRequirement met={passChecks.upper} text={t.pass_upper} />
                             <PasswordRequirement met={passChecks.lower} text={t.pass_lower} />
                             <PasswordRequirement met={passChecks.num} text={t.pass_num} />
                             {/* 🔥 НОВЕ: Пункт про спецсимвол */}
                             <PasswordRequirement met={passChecks.spec} text={t.pass_spec} />
                        </div>
                    )}

                    {error && (
                        <div className="text-red-500 text-xs text-center font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-xl animate-in fade-in slide-in-from-top-1">
                            {error}
                        </div>
                    )}

                    {!showForgot && isLogin && (
                        <div className="flex justify-end">
                            <button type="button" onClick={() => setShowForgot(true)} className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors">
                                {t.forgot_password}
                            </button>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20}/> : (
                            <>
                                {showForgot ? t.send_reset : (isLogin ? t.login_btn : t.create_account)}
                                {!loading && <ArrowRight size={18} />}
                            </>
                        )}
                    </button>
                </form>

                {showForgot && (
                    <button onClick={() => setShowForgot(false)} className="w-full mt-4 py-3 text-sm font-bold text-slate-500 hover:text-slate-700">
                        {t.back_to_login}
                    </button>
                )}

                {/* Social Login */}
                {!showForgot && (
                    <div className="mt-8">
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={onGoogleLogin} className="flex items-center justify-center gap-2 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group bg-white dark:bg-transparent">
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                <span className="font-bold text-sm text-slate-700 dark:text-white">Google</span>
                            </button>
                            <button onClick={onAppleLogin} className="flex items-center justify-center gap-2 py-3.5 bg-black text-white rounded-2xl hover:opacity-80 transition-opacity group">
                                <Apple className="w-5 h-5 group-hover:scale-110 transition-transform" fill="white" />
                                <span className="font-bold text-sm">Apple</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}