import { User, Mail, Lock, Check } from 'lucide-react';
import React from 'react';

const PasswordRequirement = ({ met, text }) => (
    <div
        className={`flex items-center gap-2 text-[10px] ${met ? 'text-green-500' : 'text-slate-400'}`}
    >
        {met ? (
            <Check size={10} />
        ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
        )}
        <span>{text}</span>
    </div>
);

export default function AuthForm({
    isLogin,
    showForgot,
    email,
    setEmail,
    password,
    setPassword,
    name,
    setName,
    passChecks,
    t,
}) {
    return (
        <div className="space-y-4">
            {!isLogin && !showForgot && (
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <User size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder={t.name_placeholder || 'Name'}
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

            {/* Password Hints */}
            {!isLogin && !showForgot && (
                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                    <PasswordRequirement met={passChecks.len} text={t.pass_len} />
                    <PasswordRequirement met={passChecks.upper} text={t.pass_upper} />
                    <PasswordRequirement met={passChecks.lower} text={t.pass_lower} />
                    <PasswordRequirement met={passChecks.num} text={t.pass_num} />
                    <PasswordRequirement met={passChecks.spec} text={t.pass_spec} />
                </div>
            )}
        </div>
    );
}
