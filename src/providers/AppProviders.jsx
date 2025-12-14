import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../context/LanguageContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import { ThemeProvider } from '../context/ThemeContext';
// ModalProvider is removed as we switched to Zustand (useModalStore)

/**
 * AppProviders
 * Centralizes all global application providers.
 * Order: Router -> Language -> Currency -> Theme.
 */
export const AppProviders = ({ children }) => {
    return (
        <BrowserRouter>
            <LanguageProvider>
                <CurrencyProvider>
                    <ThemeProvider>
                        {children}
                    </ThemeProvider>
                </CurrencyProvider>
            </LanguageProvider>
        </BrowserRouter>
    );
};