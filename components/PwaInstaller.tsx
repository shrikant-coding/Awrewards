"use client";

import React, { useEffect, useState } from 'react';

export default function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [online, setOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    function handler(e: any) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    window.addEventListener('beforeinstallprompt', handler as any);

    window.addEventListener('online', () => setOnline(true));
    window.addEventListener('offline', () => setOnline(false));

    // register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        // console.log('sw registered', reg);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      }).catch(console.error);

      navigator.serviceWorker.addEventListener('controllerchange', () => setInstalled(true));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as any);
    };
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) return;
    const promptEvt = deferredPrompt;
    setDeferredPrompt(null);
    promptEvt.prompt();
    const { outcome } = await promptEvt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
  }

  function dismissPrompt() {
    setDismissed(true);
  }

  function refreshApp() {
    navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }

  return (
    <div aria-hidden className="fixed bottom-4 left-4 z-50">
      <div className="flex items-center gap-2">
        {!online && <div className="px-3 py-2 rounded-md bg-red-600 text-white text-sm">Offline</div>}
        {updateAvailable && (
          <div className="flex items-center gap-2">
            <button onClick={refreshApp} className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm">Update Available</button>
          </div>
        )}
        {deferredPrompt && !installed && !dismissed && (
          <div className="flex items-center gap-2">
            <button onClick={promptInstall} className="px-3 py-2 rounded-md bg-gradient-to-r from-[var(--primaryFrom)] to-[var(--primaryTo)] text-white">Install App</button>
            <button onClick={dismissPrompt} className="px-2 py-1 rounded-md bg-gray-500 text-white text-sm">✕</button>
          </div>
        )}
      </div>
    </div>
  );
}