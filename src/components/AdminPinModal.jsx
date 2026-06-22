import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X } from 'lucide-react';

// Az admin felület elé tett egyszerű PIN-kapu. A long-press kinyitja ezt;
// helyes PIN esetén hívódik az onSuccess. Megakadályozza a véletlen
// szerkesztést/publikálást. (Valódi védelem a Supabase RLS — ez csak UI-gát.)
const ADMIN_PIN = String(import.meta.env.VITE_ADMIN_PIN || '2024');

export default function AdminPinModal({ open, onSuccess, onCancel }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setPin('');
      setError(false);
      // kis késleltetés, hogy a fókusz a megnyitás animációja után álljon rá
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [open]);

  const submit = (e) => {
    e?.preventDefault();
    if (pin === ADMIN_PIN) {
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[350] flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }} transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/65 backdrop-blur-md"
            onClick={onCancel}
          />
          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
            transition={{ type: 'spring', stiffness: 440, damping: 34, mass: 0.7 }}
            className="relative w-full max-w-xs bg-night-800 rounded-[2rem] p-6 flex flex-col gap-4 shadow-2xl border border-white/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center text-white">
                  <Lock className="w-4 h-4" />
                </span>
                <span>Admin belépés</span>
              </h3>
              <button
                type="button"
                onClick={onCancel}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Bezárás"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-night-200/60 font-semibold leading-relaxed">
              Add meg a PIN-kódot a szerkesztéshez.
            </p>

            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={e => { setPin(e.target.value); setError(false); }}
              placeholder="••••"
              className={`w-full px-4 py-3 rounded-2xl border bg-white/[0.04] text-white text-center text-lg font-extrabold tracking-[0.5em] placeholder:tracking-normal placeholder:text-night-200/35 focus:outline-none focus:ring-2 ${
                error ? 'border-rose-500/60 focus:ring-rose-400/50' : 'border-white/10 focus:ring-cyan2-400/50'
              }`}
            />

            {error && <p className="text-rose-300 text-xs font-extrabold text-center">Hibás PIN-kód.</p>}

            <button type="submit" className="btn-grad w-full py-3 text-sm font-bold">
              Belépés
            </button>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  );
}
