import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

/**
 * Main Entry Point
 * * Note: BrowserRouter and Context Providers (Language, Currency, Modal)
 * have been moved to 'src/providers/AppProviders.jsx' which is now wrapped inside App.jsx.
 * We only keep StrictMode here to avoid provider/router duplication.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
);
