const CACHE_NAME = 'mtai-v2';
const STATIC_CACHE = 'mtai-static-v2';
const DYNAMIC_CACHE = 'mtai-dynamic-v2';

const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/offline.html',
    '/favicon.ico',
];

const API_CACHE = 'mtai-api-v1';
const API_CACHE_DURATION = 5 * 60 * 1000;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch(() => {});
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== API_CACHE)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;

    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstWithCache(request));
        return;
    }

    if (url.pathname.startsWith('/build/') || url.pathname.startsWith('/icons/')) {
        event.respondWith(cacheFirst(request));
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(networkFirstWithOffline(request));
        return;
    }

    event.respondWith(staleWhileRevalidate(request));
});

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response('Offline', { status: 503 });
    }
}

async function networkFirstWithOffline(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;

        const offlinePage = await caches.match('/offline.html');
        if (offlinePage) return offlinePage;

        return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    }
}

async function networkFirstWithCache(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(API_CACHE);
            const entry = {
                response: response.clone(),
                timestamp: Date.now(),
            };
            cache.put(request, new Response(JSON.stringify(entry), {
                headers: { 'Content-Type': 'application/json', 'X-Cached-At': Date.now().toString() },
            }));
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) {
            try {
                const data = JSON.parse(await cached.text());
                if (Date.now() - data.timestamp < API_CACHE_DURATION * 24) {
                    return data.response;
                }
            } catch {
                return cached;
            }
        }
        return new Response(JSON.stringify({ message: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

async function staleWhileRevalidate(request) {
    const cached = await caches.match(request);
    const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
            const cache = caches.open(STATIC_CACHE).then((c) => c.put(request, response.clone()));
        }
        return response;
    }).catch(() => cached);

    return cached || fetchPromise;
}

self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body || 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: data.url || '/',
        actions: data.actions || [],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'M-TAI', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            return clients.openWindow(url);
        })
    );
});
