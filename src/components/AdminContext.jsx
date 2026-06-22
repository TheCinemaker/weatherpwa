import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AdminPinModal from './AdminPinModal';

// Globális admin-belépés: a (közös) logó hosszú nyomása megnyitja a PIN-kaput,
// és helyes PIN után az ÉPP MEGNYITOTT oldal admin felülete nyílik meg.
// A providert az App egyszer rendereli; az oldalak a useAdminUnlock hookkal
// iratkoznak fel a feloldásra.
const AdminContext = createContext({
  requestAdmin: () => {},
  unlockNonce: 0,
});

export function AdminProvider({ children }) {
  const [showPinGate, setShowPinGate] = useState(false);
  const [unlockNonce, setUnlockNonce] = useState(0); // minden sikeres PIN után nő

  const requestAdmin = useCallback(() => setShowPinGate(true), []);

  return (
    <AdminContext.Provider value={{ requestAdmin, unlockNonce }}>
      {children}
      <AdminPinModal
        open={showPinGate}
        onCancel={() => setShowPinGate(false)}
        onSuccess={() => { setShowPinGate(false); setUnlockNonce(n => n + 1); }}
      />
    </AdminContext.Provider>
  );
}

// A logó-hold hívja: megnyitja a PIN-kaput.
export function useAdminRequest() {
  return useContext(AdminContext).requestAdmin;
}

// Az oldalak hívják: a callback lefut, valahányszor sikeres a PIN
// (csak amíg az adott oldal mountolva van).
// FONTOS: az utoljára LÁTOTT nonce-t hasonlítjuk, nem egy "first run" flaget,
// mert React StrictMode fejlesztői módban kétszer futtatja az effektet mountkor
// (a ref-ek megőrződnek), ami a flag-es megoldásnál belépés nélkül elsütné a callbacket.
export function useAdminUnlock(onUnlock) {
  const { unlockNonce } = useContext(AdminContext);
  const cbRef = useRef(onUnlock);
  cbRef.current = onUnlock;
  const seenNonce = useRef(unlockNonce); // mountkori érték → ez nem old fel semmit

  useEffect(() => {
    if (unlockNonce !== seenNonce.current) {
      seenNonce.current = unlockNonce;
      cbRef.current?.();
    }
  }, [unlockNonce]);
}
