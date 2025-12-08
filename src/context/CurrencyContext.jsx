import React, { createContext, useState, useEffect, useContext } from 'react';
import { CURRENCIES } from '../constants';

const CurrencyContext = createContext();

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};

export const CurrencyProvider = ({ children }) => {
    // Ініціалізація з localStorage
    const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'EUR');

    // Синхронізація з localStorage
    useEffect(() => {
        localStorage.setItem('currency', currency);
    }, [currency]);

    // Переносимо функцію formatMoney з App.jsx сюди
    // Вона не залежить від стейту currency напряму (бо приймає currencyCode аргументом),
    // але логічно належить до цього домену.
    const formatMoney = (amount, currencyCode) => {
        const symbol = CURRENCIES[currencyCode]?.symbol || '$';
        return `${symbol}${Math.abs(amount).toFixed(2)}`;
    };

    const value = {
        currency,
        setCurrency,
        formatMoney
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};