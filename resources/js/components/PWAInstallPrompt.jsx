import React, { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
    const [show, setShow] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
            setIsStandalone(true);
            return;
        }

        if (sessionStorage.getItem('pwa-dismissed')) return;

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setTimeout(() => setShow(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShow(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShow(false);
        sessionStorage.setItem('pwa-dismissed', '1');
    };

    if (isStandalone || !show) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
            <div className="max-w-md mx-auto pointer-events-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 flex items-center gap-3 animate-slide-up">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d0f4dd] to-[#b8f0cc] flex items-center justify-center shrink-0">
                        <span className="text-[#00D4AA] font-bold text-xl">M</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">Install M-TAI</p>
                        <p className="text-xs text-gray-500">Add to home screen for faster access</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleInstall}
                            className="px-4 py-2 bg-[#00D4AA] text-white text-sm font-semibold rounded-lg hover:bg-[#00b894] transition"
                        >
                            Install
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="p-2 text-gray-400 hover:text-gray-600 transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
