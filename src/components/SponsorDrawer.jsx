import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import SponsorCard from './SponsorCard';

// Oldalra kilógó "fül", amire kattintva jobbról be-/kiúszik egy panel a
// támogatói tartalommal — így ez nem foglal helyet a főoldal görgetett
// tartalmában, csak igény szerint nyitható meg.
export default function SponsorDrawer({ sponsors = [] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed right-0 bottom-1/3 translate-y-1/2 z-[90] flex flex-col items-center gap-2 px-2 py-4 rounded-l-apple-inner bg-black/50 backdrop-blur-xl border border-white/10 border-r-0 text-white/70 hover:text-white hover:bg-black/65 active:scale-95 transition-all shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
        aria-label="Támogatóink megnyitása"
      >
        <Heart className="w-4 h-4 text-rose-300 shrink-0" />
        <span className="text-[9px] font-extrabold uppercase tracking-widest [writing-mode:vertical-rl]">Támogatók</span>
      </button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-[110]">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
                transition={{ duration: 0.18 }}
                onClick={() => setOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.aside
                initial={{ x: '100%' }} animate={{ x: 0 }}
                exit={{ x: '100%', transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
                transition={{ type: 'spring', stiffness: 480, damping: 42, mass: 0.7 }}
                className="absolute top-0 right-0 h-full w-[85%] max-w-sm p-4"
              >
                <div className="h-full flex flex-col glass-card rounded-apple-outer p-5 overflow-y-auto no-scrollbar">
                  <div className="flex items-center justify-between mb-5 shrink-0">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-300" />
                      Támogatóink
                    </h3>
                    <button
                      onClick={() => setOpen(false)}
                      className="w-9 h-9 flex items-center justify-center rounded-apple-inner bg-white/10 text-white active:scale-95"
                      aria-label="Bezárás"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <SponsorCard />

                  {sponsors.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
                      <p className="text-[9px] font-extrabold text-cyan2-300 uppercase tracking-widest mb-1">
                        Akik segítik az időjárás állomás fenntartását
                      </p>
                      {sponsors.map(sp => (
                        <a
                          key={sp.id}
                          href={sp.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-apple-inner bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-cyan2-400/20 transition-all"
                          title={sp.description || sp.name}
                        >
                          <img src={sp.logo_url} alt="" className="w-7 h-7 rounded-md object-cover shrink-0" />
                          <span className="text-xs font-bold text-white truncate">{sp.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
