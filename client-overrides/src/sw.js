// Author: Priyanshu Pandey | Enrollment: 0801e1241068
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL, matchPrecache } from 'workbox-precaching';
import { registerRoute, NavigationRoute, setCatchHandler } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

self.skipWaiting();
self.addEventListener('activate', () => self.clients.claim());

// 1) Precache the whole UI shell (JS, CSS, index.html, offline.html, icons)
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// 2) SPA navigations are served from the cached shell (never for /api)
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: [/^\/api\//] }));

// 3) Read-only dashboard data: network first, fall back to last good response
registerRoute(
  ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/api/dashboard'),
  new NetworkFirst({
    cacheName: 'api-dashboard',
    networkTimeoutSeconds: 4,
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 })],
  }),
);
// Auth, billing, simulator and AI queries are POSTs/sensitive and are intentionally NOT cached.

// 4) Anything that still fails while offline: documents get offline.html
setCatchHandler(async ({ request }) => {
  if (request.destination === 'document') return (await matchPrecache('/offline.html')) || Response.error();
  return Response.error();
});
