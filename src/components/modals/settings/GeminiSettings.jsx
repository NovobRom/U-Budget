import { Key, Check, AlertCircle, Loader2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import {
    getGeminiApiKey,
    saveGeminiApiKey,
    testGeminiApiKey,
} from '../../../services/geminiCategorizer.service';

/**
 * GeminiSettings
 * UI for managing Gemini API key (stored in localStorage for security)
 */
export default function GeminiSettings({ t = {} }) {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, testing, valid, invalid
    const [errorMessage, setErrorMessage] = useState('');

    // Labels
    const labels = {
        title: t.gemini_title || 'AI Categorization',
        hint: t.gemini_hint || 'Use Gemini AI to auto-categorize transactions',
        placeholder: t.gemini_placeholder || 'Enter Gemini API key',
        test: t.gemini_test || 'Test',
        save: t.btn_save || 'Save',
        clear: t.gemini_clear || 'Clear',
        valid: t.gemini_valid || 'Connected!',
        invalid: t.gemini_invalid || 'Invalid key',
        getKey: t.gemini_get_key || 'Get free key',
    };

    // Load saved key on mount
    useEffect(() => {
        const savedKey = getGeminiApiKey();
        if (savedKey) {
            setApiKey(savedKey);
            setStatus('valid'); // Assume valid if saved
        }
    }, []);

    // Test API key
    const handleTest = async () => {
        if (!apiKey.trim()) return;

        setStatus('testing');
        setErrorMessage('');

        const result = await testGeminiApiKey(apiKey.trim());

        if (result.valid) {
            setStatus('valid');
            saveGeminiApiKey(apiKey.trim());
        } else {
            setStatus('invalid');
            setErrorMessage(result.error);
        }
    };

    // Clear API key
    const handleClear = () => {
        setApiKey('');
        setStatus('idle');
        setErrorMessage('');
        saveGeminiApiKey(null);
    };

    // Mask key for display
    const displayKey = showKey ? apiKey : apiKey.replace(/./g, '•').slice(0, 20);

    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Key size={18} className="text-purple-500" />
                    <h3 className="font-bold text-slate-900 dark:text-white">{labels.title}</h3>
                </div>
                {status === 'valid' && (
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <Check size={14} />
                        {labels.valid}
                    </span>
                )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">{labels.hint}</p>

            {/* API Key Input */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => {
                            setApiKey(e.target.value);
                            setStatus('idle');
                        }}
                        placeholder={labels.placeholder}
                        className="w-full px-3 py-2 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white font-mono"
                    />
                    <button
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    >
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>

                {apiKey && (
                    <button
                        onClick={handleTest}
                        disabled={status === 'testing'}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                            status === 'testing'
                                ? 'bg-slate-200 text-slate-500'
                                : status === 'valid'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                    >
                        {status === 'testing' && <Loader2 size={14} className="animate-spin" />}
                        {status === 'valid' ? <Check size={14} /> : labels.test}
                    </button>
                )}
            </div>

            {/* Error Message */}
            {status === 'invalid' && errorMessage && (
                <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-xs">
                    <AlertCircle size={14} />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
                <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
                >
                    <ExternalLink size={12} />
                    {labels.getKey}
                </a>

                {apiKey && (
                    <button
                        onClick={handleClear}
                        className="text-xs text-red-500 hover:text-red-600"
                    >
                        {labels.clear}
                    </button>
                )}
            </div>
        </div>
    );
}
