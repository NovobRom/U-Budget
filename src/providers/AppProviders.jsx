import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../context/LanguageContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import { ModalProvider } from '../context/ModalContext';
import { ThemeProvider } from '../context/ThemeContext';

/**
 * AppProviders
 * Centralizes all global application providers.
 * Order: Router -> Language -> Currency -> Theme -> Modal.
 */
export const AppProviders = ({ children }) => {
    return (
        <BrowserRouter>
            <LanguageProvider>
                <CurrencyProvider>
                    <ThemeProvider>
                        <ModalProvider>
                            {children}
                        </ModalProvider>
                    </ThemeProvider>
                </CurrencyProvider>
            </LanguageProvider>
        </BrowserRouter>
    );
};