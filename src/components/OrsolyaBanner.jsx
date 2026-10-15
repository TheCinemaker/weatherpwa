import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

// Lejárati idő: 2026. október 18. (vasárnap) 22:00:00 CEST (UTC+2)
const EXPIRATION_TIMESTAMP = new Date('2026-10-18T22:00:00+02:00').getTime();

export default function OrsolyaBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('orsolya') === '1') return true;
      if (params.get('orsolya') === '0') return false;
    }
    return Date.now() < EXPIRATION_TIMESTAMP;
  });

  useEffect(() => {
    // 10 másodpercenként ellenőrizzük a lejárati időt, így vasárnap este 10-kor
    // oldalújratöltés nélkül, azonnal és finoman eltűnik.
    const checkExpiry = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('orsolya') === '1') {
          setIsVisible(true);
          return;
        }
        if (params.get('orsolya') === '0') {
          setIsVisible(false);
          return;
        }
      }
      if (Date.now() >= EXPIRATION_TIMESTAMP) {
        setIsVisible(false);
      }
    };

    const interval = setInterval(checkExpiry, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96, transition: { duration: 0.35, ease: 'easeOut' } }}
          className="relative group mb-3.5 w-full"
        >
          {/* Meleg őszi ambient háttérragyogás */}
          <div className="absolute -inset-1 rounded-apple-outer bg-gradient-to-r from-amber-600/35 via-orange-500/40 to-rose-600/30 blur-xl opacity-70 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />

          {/* Keskeny, őszi színekből komponált üveghatású gomb */}
          <a
            href="https://orsolya.visitkoszeg.hu"
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center justify-between gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-apple-card sm:rounded-apple-outer bg-gradient-to-r from-[#8a2e0a]/90 via-[#c2410c]/90 to-[#b45309]/90 hover:from-[#9c340d] hover:via-[#d34710] hover:to-[#c45b0a] backdrop-blur-xl border border-amber-300/35 border-t-2 border-t-amber-100/85 shadow-[0_8px_25px_-4px_rgba(194,65,12,0.45)] text-white overflow-hidden transition-all duration-300 active:scale-[0.99] select-none"
            title="Orsolya-napi Vásár 2026 — orsolya.visitkoszeg.hu"
          >
            {/* Finom csillanás-effekt (shimmer) a gombon */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

            {/* Bal oldal: őszi ikon + cím + leírás */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 relative z-10">
              {/* Kis vásári jelvény */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-apple-inner bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white shadow-sm shrink-0 border border-amber-200/40">
                <svg
                  className="w-4 h-4 sm:w-[18px] sm:h-[18px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {/* Zászló a sátor tetején */}
                  <path d="M12 2v3" />
                  <path d="M12 2l3 1-3 1" />
                  {/* Sátortető */}
                  <path d="M3 11l9-6 9 6" />
                  {/* Csipkés vásári sátorszél */}
                  <path d="M3 11q1.5 2 3 0q1.5 2 3 0q1.5 2 3 0q1.5 2 3 0q1.5 2 3 0q1.5 2 3 0" />
                  {/* Oldalfalak */}
                  <path d="M4.5 12.5V21" />
                  <path d="M19.5 12.5V21" />
                  {/* Bejárat */}
                  <path d="M9.5 21v-5.5a2.5 2.5 0 0 1 5 0V21" />
                  <path d="M3 21h18" />
                </svg>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 min-w-0 leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] sm:text-sm font-black tracking-tight text-white drop-shadow-sm truncate">
                    Orsolya-napi Vásár 2026
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-400/25 border border-amber-200/40 text-[9px] font-black uppercase tracking-wider text-amber-100 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Élő
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-amber-100/85 truncate drop-shadow-sm">
                  Civil Ízek Utcája · Standok &amp; Étlapok
                </span>
              </div>
            </div>

            {/* Jobb oldal: Megnyitás / nyíl gomb */}
            <div className="flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-apple-inner bg-black/25 group-hover:bg-black/35 border border-white/15 text-amber-100 group-hover:text-white transition-all text-xs font-bold relative z-10">
              <span className="hidden xs:inline sm:inline text-[11px] font-extrabold tracking-wide">
                Megnyitás
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-200 group-hover:text-white transition-colors" />
            </div>
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
