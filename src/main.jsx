import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ModalProvider } from './context/ModalContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <CurrencyProvider>
          <ModalProvider>
            <App />
          </ModalProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
);