import React, { useCallback, useRef, useState } from 'react';

// Egységes admin long-press hook látható progresszel.
// Visszaad: { progress (0-100), handlers, cancel }.
// A handlers-t terítsd rá a nyomandó elemre: <h1 {...handlers}>.
export function useAdminLongPress(onComplete, { duration = 3000, disabled = false } = {}) {
  const timerRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const [progress, setProgress] = useState(0);

  const cancel = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setProgress(0);
  }, []);

  const tick = useCallback(() => {
    const elapsed = Date.now() - startRef.current;
    const p = Math.min(100, (elapsed / duration) * 100);
    setProgress(p);
    if (p < 100) rafRef.current = requestAnimationFrame(tick);
  }, [duration]);

  const start = useCallback(() => {
    if (disabled) return;
    startRef.current = Date.now();
    setProgress(0);
    rafRef.current = requestAnimationFrame(tick);
    timerRef.current = setTimeout(() => {
      cancel();
      onComplete();
    }, duration);
  }, [disabled, duration, onComplete, tick, cancel]);

  const handlers = {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
  };

  return { progress, handlers, cancel };
}

// Egységes vizuális visszajelzés: felső progressz-sáv + kis felirat.
// Csak akkor jelenik meg, ha a nyomás már elérte a REVEAL_AT küszöböt (~2 mp a 3-ból),
// így egy rövid koppintás NEM villantja fel. Onnantól tölt fel a sáv a 100%-ig.
const REVEAL_AT = 66; // % – a 3 mp-es holdból ~2 mp

export function AdminHoldBar({ progress }) {
  if (progress < REVEAL_AT) return null;
  const width = ((progress - REVEAL_AT) / (100 - REVEAL_AT)) * 100;
  return (
    <>
      <div className="fixed top-0 inset-x-0 z-[500] h-1 pointer-events-none">
        <div className="h-full bg-brand-gradient shadow-glow" style={{ width: `${width}%` }} />
      </div>
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[500] pointer-events-none px-3 py-1.5 rounded-full bg-night-900/85 backdrop-blur-md border border-white/10 text-[10px] font-extrabold uppercase tracking-widest text-cyan2-200">
        Admin belépés… tartsd nyomva
      </div>
    </>
  );
}
