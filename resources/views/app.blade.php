<!DOCTYPE html>
<html lang="sw" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>M-TAI - Smart Business Platform</title>

    <!-- Poppins Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">

    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#00D4AA">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="M-TAI">
    <meta name="application-name" content="M-TAI">
    <meta name="description" content="Buy, sell, and manage your business from your phone. Shop from local businesses, track orders, and pay with M-Pesa.">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="msapplication-TileColor" content="#00D4AA">
    <meta name="msapplication-tap-highlight" content="no">

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="M-TAI - Smart Business Platform">
    <meta property="og:description" content="Buy, sell, and manage your business from your phone.">
    <meta property="og:image" content="/icons/icon-192x192.png">
    <meta property="og:site_name" content="M-TAI">

    <!-- Apple Touch Icons -->
    <link rel="apple-touch-icon" href="/icons/icon-152x152.png">
    <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png">
    <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-128x128.png">
    <link rel="apple-touch-icon" sizes="76x76" href="/icons/icon-72x72.png">

    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png">
    <link rel="icon" type="image/png" sizes="96x96" href="/icons/icon-96x96.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-72x72.png">

    <!-- Manifest -->
    <link rel="manifest" href="/manifest.json">

    <!-- Splash Screens -->
    <meta name="splash-screen" content="yes">

    @vite(['resources/css/app.css', 'resources/js/app.jsx'])

    <style>
        .pwa-install-banner {
            display: none;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 9999;
            background: white;
            border-top: 1px solid #e5e7eb;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
            padding: 16px;
        }
        .pwa-install-banner.show { display: block; }
    </style>
</head>
<body class="h-full bg-gray-50">
    <div id="app" class="h-full"></div>
    <div id="pwa-install-container"></div>

    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
                    .then((reg) => {
                        reg.update(); // force re-check for new SW immediately
                        console.log('SW registered:', reg.scope);
                        reg.addEventListener('updatefound', () => {
                            const newWorker = reg.installing;
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'activated') {
                                    if (window.showPWANotification) {
                                        window.showPWANotification('App updated! Refresh for the latest version.');
                                    }
                                }
                            });
                        });
                    })
                    .catch((err) => console.log('SW registration failed:', err));
            });
        }

        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            window.__pwaPrompt = e;

            const isCustomer = window.location.pathname.startsWith('/customer');
            if (isCustomer) {
                const container = document.getElementById('pwa-install-container');
                if (container) {
                    container.innerHTML = `
                        <div class="pwa-install-banner show" id="pwa-install-banner">
                            <div style="max-width:640px;margin:0 auto;display:flex;align-items:center;gap:12px;">
                                <div style="width:40px;height:40px;background:linear-gradient(135deg,#d0f4dd,#b8f0cc);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                    <span style="color:#00D4AA;font-weight:700;font-size:18px;">M</span>
                                </div>
                                <div style="flex:1;min-width:0;">
                                    <p style="font-weight:600;font-size:14px;color:#111827;">Install M-TAI</p>
                                    <p style="font-size:12px;color:#6b7280;">Add to home screen for faster shopping</p>
                                </div>
                                <button onclick="installPWA()" style="background:#00D4AA;color:white;border:none;padding:8px 16px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;white-space:nowrap;">Install</button>
                                <button onclick="dismissPWA()" style="background:none;border:none;color:#9ca3af;cursor:pointer;padding:4px;font-size:18px;line-height:1;">&times;</button>
                            </div>
                        </div>
                    `;
                }
            }
        });

        function installPWA() {
            if (!window.__pwaPrompt) return;
            window.__pwaPrompt.prompt();
            window.__pwaPrompt.userChoice.then((choice) => {
                if (choice.outcome === 'accepted') {
                    console.log('PWA installed');
                }
                window.__pwaPrompt = null;
                dismissPWA();
            });
        }

        function dismissPWA() {
            const banner = document.getElementById('pwa-install-banner');
            if (banner) banner.remove();
            sessionStorage.setItem('pwa-dismissed', '1');
        }

        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            dismissPWA();
        });
    </script>
</body>
</html>
