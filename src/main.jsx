import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // Fejlesztői módban (localhost) töröljük a beragadt Service Worker-t a gyorsítótárazás megelőzésére
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let reg of registrations) {
        reg.unregister();
      }
    });
  } else {
    // Ha már volt aktív Service Worker, és egy új verzió (pl. v3.0.0) átveszi az irányítást,
    // egyszer automatikusan újratöltjük az oldalt, hogy a telepített PWA (iPhone/Android)
    // azonnal az új kódot futtassa. A Push feliratkozások a PushManager-ben sértetlenek maradnak!
    let hadController = !!navigator.serviceWorker.controller;
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) {
        hadController = true;
        return;
      }
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registered successfully:', reg.scope);
          reg.update().catch(() => {});

          // iOS / Android telepített PWA háttérből visszatérésekor azonnal ellenőrizzük,
          // van-e új Service Worker verzió a szerveren.
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              reg.update().catch(() => {});
            }
          });
        })
        .catch((err) => console.error('Service Worker registration failed:', err));
    });
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
