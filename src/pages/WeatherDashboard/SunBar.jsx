import React from 'react';
import { Sunrise, Sun, Sunset, Moon } from 'lucide-react';

function formatTime(val) {
  if (!val) return '–';
  try {
    const d = typeof val === 'number' ? new Date(val * 1000) : new Date(val);
    return d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Budapest' });
  } catch {
    return String(val);
  }
}

export default function SunBar({ sunInfo, loading }) {
  const items = [
    { label: 'Napkelte', icon: Sunrise, grad: ['#5eead4', '#0891b2'], value: sunInfo?.sunrise },
    { label: 'Dél', icon: Sun, grad: ['#67e8f9', '#0ea5e9'], value: sunInfo?.noon },
    { label: 'Napnyugta', icon: Sunset, grad: ['#38bdf8', '#0d9488'], value: sunInfo?.sunset },
    { label: 'Szürkület', icon: Moon, grad: ['#22d3ee', '#06b6d4'], value: sunInfo?.dusk }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        const gradient = `linear-gradient(135deg, ${item.grad[0]}, ${item.grad[1]})`;
        return (
          <div key={item.label} className="glass-card rounded-apple-card p-3.5 flex items-center gap-3 transition-all active:scale-[0.98]">
            <div className="w-10 h-10 rounded-apple-inner flex items-center justify-center text-white shadow-sm shrink-0" style={{ background: gradient }}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-night-200/55 uppercase tracking-widest leading-none mb-1.5">{item.label}</div>
              <div className="text-base font-extrabold text-white leading-none">
                {loading && !item.value ? (
                  <div className="w-4 h-4 rounded-full border-2 border-cyan2-400 border-t-transparent animate-spin" />
                ) : (
                  formatTime(item.value)
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
