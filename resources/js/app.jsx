import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './bootstrap';
import './i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import LanguageProvider from './LanguageProvider';

ReactDOM.createRoot(document.getElementById('app')).render(
    <React.StrictMode>
        <I18nextProvider i18n={i18n}>
            <LanguageProvider>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </LanguageProvider>
        </I18nextProvider>
    </React.StrictMode>
);
