import React, { createContext, useState, useEffect, useContext } from 'react';

import { TRANSLATIONS } from '../translations';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    // Ініціалізація з localStorage, як було в App.jsx
    const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ua');

    // Синхронізація з localStorage
    useEffect(() => {
        localStorage.setItem('lang', lang);
    }, [lang]);

    // Обчислення поточних перекладів
    const t = TRANSLATIONS[lang] || TRANSLATIONS['ua'];

    const value = {
        lang,
        setLang,
        t,
    };

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
