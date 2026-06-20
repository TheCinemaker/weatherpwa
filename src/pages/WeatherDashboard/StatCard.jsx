import React from 'react';
import { motion } from 'framer-motion';
import {
  Thermometer, Flame, Droplet, Droplets, CloudFog, Gauge, Wind, Compass,
  CloudRain, Umbrella, ArrowUp, ArrowDown, TrendingUp, TrendingDown, ChevronRight
} from 'lucide-react';

function ddToText(deg) {
  const dirs = ['É', 'ÉK', 'K', 'DK', 'D', 'DNy', 'Ny', 'ÉNy'];
  return dirs[Math.round(deg / 45) % 8] || '–';
}

// Minden metrika: két-színű gradiens + tartomány a szintjelző csíkhoz.
export const STAT_CARDS_CONFIG = [
  { key: 'T',          label: 'Hőmérséklet',    icon: Thermometer,  unit: '°C',    grad: ['#A7C0A8', '#6E8B7B'], range: [-15, 40],   fmt: v => v.toFixed(1) },
  { key: 'HEAT_INDEX', label: 'Hőérzet',         icon: Flame,        unit: '°C',    grad: ['#B3C2A6', '#73876A'], range: [-15, 45],   fmt: v => v.toFixed(1) },
  { key: 'HUMIDEX',    label: 'Humidex',          icon: Droplet,      unit: '',      grad: ['#9DB7A6', '#566E63'], range: [0, 45],     fmt: v => v.toFixed(1) },
  { key: 'U',          label: 'Páratartalom',    icon: Droplets,     unit: '%',     grad: ['#8AA892', '#4F6B5C'], range: [0, 100],    fmt: v => v.toFixed(0) },
  { key: 'DP',         label: 'Harmatpont',      icon: CloudFog,     unit: '°C',    grad: ['#A2B29F', '#5E7A66'], range: [-15, 30],   fmt: v => v.toFixed(1) },
  { key: 'SLP',        label: 'Légnyomás',       icon: Gauge,        unit: 'hPa',   grad: ['#9DB7A6', '#4F6B5C'], range: [980, 1040], fmt: v => v.toFixed(1) },
  { key: 'FF',         label: 'Szélsebesség',    icon: Wind,         unit: 'km/h',  grad: ['#A7C0A8', '#5E7A66'], range: [0, 60],     fmt: v => v.toFixed(1) },
  { key: 'FXY',        label: 'Széllökés',       icon: Wind,         unit: 'km/h',  grad: ['#B3C2A6', '#566E63'], range: [0, 90],     fmt: v => v.toFixed(1) },
  { key: 'DD',         label: 'Szélirány',       icon: Compass,      unit: '°',     grad: ['#A2B29F', '#6E8B7B'], fmt: v => v.toFixed(0), isWind: true },
  { key: 'RR_1H',      label: '1h csapadék',     icon: CloudRain,    unit: 'mm',    grad: ['#8AA892', '#566E63'], range: [0, 20],     fmt: v => v.toFixed(1) },
  { key: 'RR_TODAY',   label: 'Mai csapadék',    icon: Umbrella,     unit: 'mm',    grad: ['#22d3ee', '#818cf8'], range: [0, 40],     fmt: v => v.toFixed(1) },
  { key: 'AIR_DENSITY',label: 'Levegősűrűség',   icon: Gauge,        unit: 'kg/m³', grad: ['#A7C0A8', '#4F6B5C'], range: [1.0, 1.35], fmt: v => v.toFixed(4) },
  { key: 'T_MAX',      label: 'Napi max.',        icon: ArrowUp,      unit: '°C',    grad: ['#A7C0A8', '#6E8B7B'], range: [-15, 40],   fmt: v => v.toFixed(1) },
  { key: 'T_MIN',      label: 'Napi min.',        icon: ArrowDown,    unit: '°C',    grad: ['#8AA892', '#566E63'], range: [-15, 40],   fmt: v => v.toFixed(1) },
  { key: 'T_TREND',    label: 'Hőm. trend',       icon: TrendingUp,   unit: '',      grad: ['#A7C0A8', '#6E8B7B'], fmt: v => typeof v === 'number' ? (v > 0 ? '+' : '') + v.toFixed(2) + ' °C/h' : v, isTrend: true },
  { key: 'SLP_TREND',  label: 'Légnyomás trend',  icon: TrendingDown, unit: '',      grad: ['#9DB7A6', '#4F6B5C'], fmt: v => typeof v === 'number' ? (v > 0 ? '+' : '') + v.toFixed(2) + ' hPa/h' : v, isTrend: true },
];

export default function StatCard({ config, val, onClick }) {
  const { label, icon: Icon, unit, grad, range, isWind, isTrend } = config;
  const clickable = typeof onClick === 'function';
  const gradient = `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`;

  const hasValue = val !== undefined && val !== null;
  const isNum = hasValue && typeof val === 'number' && !isNaN(val);

  let displayVal = '–';
  if (hasValue) {
    try { displayVal = config.fmt(val); } catch { displayVal = String(val); }
  }

  // Szintjelző csík kitöltése
  let fillPct = null;
  if (isNum && range && !isWind && !isTrend) {
    fillPct = Math.max(4, Math.min(100, ((val - range[0]) / (range[1] - range[0])) * 100));
  }

  // Alsó tartalom: szél / trend / „részletek"
  let footer = null;
  if (!hasValue) {
    footer = <span className="text-[10px] text-night-200/40 font-semibold italic">Nincs adat</span>;
  } else if (isWind && isNum) {
    footer = (
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-full text-white text-[9px] font-bold uppercase tracking-wider" style={{ background: gradient }}>
          {ddToText(val)} · {val}°
        </span>
        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center border border-white/10 relative shrink-0">
          <div className="w-0.5 h-3 rounded-full origin-center" style={{ background: gradient, transform: `rotate(${val}deg)` }} />
        </div>
      </div>
    );
  } else if (isTrend && hasValue) {
    const num = isNum ? val : (String(val).toLowerCase() === 'up' ? 1 : String(val).toLowerCase() === 'down' ? -1 : 0);
    const isUp = num > 0.05, isDown = num < -0.05;
    const cls = isUp ? 'bg-emerald-400/15 text-emerald-300' : isDown ? 'bg-rose-400/15 text-rose-300' : 'bg-violet-400/15 text-violet-200';
    const arrow = isUp ? '↑' : isDown ? '↓' : '→';
    const lbl = isNum ? displayVal : (isUp ? 'emelkedő' : isDown ? 'csökkenő' : 'stabil');
    footer = <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${cls}`}>{arrow} {lbl}</span>;
  } else if (fillPct !== null) {
    footer = (
      <div className="meter-track">
        <div className="meter-fill" style={{ width: `${fillPct}%` }} />
      </div>
    );
  }

  return (
    <motion.div
      layoutId={clickable ? `metric-${config.key}` : undefined}
      onClick={onClick}
      transition={{ type: 'spring', stiffness: 30, damping: 9 }}
      className={`group relative h-full min-h-[118px] rounded-3xl p-4 flex flex-col justify-between overflow-hidden glass-card transition-all duration-300 active:scale-[0.98] ${clickable ? 'cursor-pointer hover:border-white/20' : ''}`}
    >
      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity" style={{ background: gradient }} />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0" style={{ background: gradient }}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-night-200/60 uppercase tracking-wider leading-tight truncate">{label}</span>
        </div>
        {clickable && <ChevronRight className="w-4 h-4 text-night-200/30 group-hover:text-night-200/70 transition-colors shrink-0" />}
      </div>

      <div className="relative z-10">
        <div className="text-2xl font-extrabold text-white flex items-baseline tracking-tight mb-2">
          {displayVal}
          {hasValue && unit && <span className="text-xs font-bold text-night-200/45 ml-0.5">{unit}</span>}
        </div>
        {footer}
      </div>
    </motion.div>
  );
}
