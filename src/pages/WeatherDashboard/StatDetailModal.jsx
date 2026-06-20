import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import { IoClose } from 'react-icons/io5';
import { makeChartData, makeChartOptions } from './ChartCard';

// Min / átlag / max a nem-null értékekből
function summarize(data) {
  const vals = (data || []).filter(v => v !== null && v !== undefined && !isNaN(v));
  if (!vals.length) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  return { min: Math.min(...vals), max: Math.max(...vals), avg: sum / vals.length };
}

export default function StatDetailModal({ metric, timestamps, data, currentValue, onClose }) {
  // Esc-re zárás + háttér-görgetés tiltása amíg nyitva van
  useEffect(() => {
    if (!metric) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [metric, onClose]);

  const isBar = metric?.type === 'bar';
  const Chart = isBar ? Bar : Line;
  const Icon = metric?.icon;
  const gradient = metric ? `linear-gradient(135deg, ${metric.grad[0]}, ${metric.grad[1]})` : '';
  const chartData = useMemo(() => (metric ? makeChartData(metric, timestamps, data) : null), [metric, timestamps, data]);
  const options = useMemo(() => (metric ? makeChartOptions(metric) : null), [metric]);
  const stats = useMemo(() => summarize(data), [data]);

  const fmt = (v) => (typeof v === 'number' ? v.toFixed(metric?.unit === '%' ? 0 : 1) : '–');

  return (
    <AnimatePresence>
      {metric && [
        <motion.div
          key="stat-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-md"
        />,
        <div
          key="stat-modal-card"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
        >
          <motion.div
            layoutId={`metric-${metric.key}`}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.7 }}
            className="relative w-full max-w-2xl bg-night-800 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden pointer-events-auto"
          >
            {/* Gradiens-akcentus felül */}
            <div className="h-2 w-full" style={{ background: gradient }} />

            <div className="p-6 sm:p-8">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.22 }}
              >
                {/* Fejléc */}
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0" style={{ background: gradient }}>
                      {Icon && <Icon className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-night-200/55 mb-0.5">Aktuális</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-white tracking-tight">{fmt(currentValue)}</span>
                        <span className="text-sm font-bold text-night-200/45">{metric.unit}</span>
                      </div>
                      <div className="text-sm font-bold text-white/90 mt-0.5">{metric.label}</div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 shrink-0"
                  >
                    <IoClose className="text-lg" />
                  </button>
                </div>

                {/* Min / átlag / max */}
                {stats && (
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                    {[
                      { label: 'Minimum', val: stats.min },
                      { label: 'Átlag', val: stats.avg },
                      { label: 'Maximum', val: stats.max },
                    ].map((s) => (
                      <div key={s.label} className="bg-white/[0.04] rounded-2xl px-3 py-2.5 text-center border border-white/10">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-night-200/55 mb-1">{s.label}</div>
                        <div className="text-base font-extrabold text-white">
                          {fmt(s.val)}<span className="text-[10px] font-bold text-night-200/45 ml-0.5">{metric.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Nagy grafikon */}
                <div className="text-[10px] font-bold uppercase tracking-widest text-cyan2-200/70 mb-3 flex items-center gap-2">
                  <span>24 órás előzmény</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <div className="relative h-[260px] w-full">
                  {chartData ? (
                    <Chart data={chartData} options={options} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-night-200/45">
                      Nincs mérési adat az elmúlt 24 órában.
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      ]}
    </AnimatePresence>
  );
}
