import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';

/**
 * PushAlertModal — A premium, Apple-style modal overlay to display
 * the alert details when a user clicks on a push notification.
 */
export default function PushAlertModal({ alert, onClose }) {
  return (
    <AnimatePresence>
      {alert && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />
          
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.96, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 450, damping: 32, mass: 0.8 }}
            className="relative w-full max-w-sm bg-night-850 border border-rose-500/30 rounded-apple-outer p-6 shadow-2xl flex flex-col gap-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Red alert ambient light effect at the top */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-rose-500" />
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-apple-inner bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">Rendkívüli Értesítés</span>
                  <h3 className="text-base font-extrabold text-white leading-tight mt-0.5">
                    {alert.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors shrink-0"
                aria-label="Bezárás"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-apple-inner p-4 my-2 relative z-10">
              <p className="text-sm font-semibold text-white/90 leading-relaxed whitespace-pre-wrap">
                {alert.body}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full inline-flex items-center justify-center gap-2 rounded-apple-inner bg-brand-gradient text-white font-bold text-sm py-3.5 shadow-glow transition-all hover:brightness-110 active:scale-95 relative z-10"
            >
              Megértettem
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
