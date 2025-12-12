import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../context/LanguageContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import { ModalProvider } from '../context/ModalContext';

/**
 * AppProviders
 * Centralizes all global application providers to clean up App.jsx and main.jsx.
 * Order matters: Router -> Language -> Currency -> Modal.
 */
export const AppProviders = ({ children }) => {
    return (
        <BrowserRouter>
            <LanguageProvider>
                <CurrencyProvider>
                    <ModalProvider>
                        {children}
                    </ModalProvider>
                </CurrencyProvider>
            </LanguageProvider>
        </BrowserRouter>
    );
};