import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import * as Sentry from '@sentry/react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

import { AuthProvider } from '@/features/auth';
import { UnidadeProvider } from '@/features/unidade';
import { SyncProvider } from '@/lib/offline/sync-provider';
import { registerProductionServiceWorker } from '@/lib/register-production-sw';

import { router } from './router';
import './styles/globals.css';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: Boolean(import.meta.env.VITE_SENTRY_DSN) && import.meta.env.PROD,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return null;
    }
    return event;
  },
});

if (import.meta.env.PROD) {
  registerProductionServiceWorker();
} else if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      void registration.unregister();
    }
  });

  if ('caches' in window) {
    void caches.keys().then((keys) => {
      for (const key of keys) {
        void caches.delete(key);
      }
    });
  }
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <UnidadeProvider>
          <SyncProvider>
            <RouterProvider router={router} />
            <Toaster richColors closeButton position="top-center" />
          </SyncProvider>
        </UnidadeProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
