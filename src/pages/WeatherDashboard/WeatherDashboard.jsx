import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { IoRefresh } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import useWeatherData from './useWeatherData';
import SunBar from './SunBar';
import StatCard, { STAT_CARDS_CONFIG } from './StatCard';
import ChartCard, { CHART_CONFIGS } from './ChartCard';
import StatDetailModal from './StatDetailModal';
import { FadeUp } from '../../components/AppleMotion';
import { getForecast, saveForecast } from '../../api/supabase';
import {
  AlertTriangle, MapPin, ExternalLink, Info, Moon, Sun, CloudRain, CloudDrizzle, CloudFog,
  ArrowDown, ArrowUp, Droplets, Wind, Calendar, X
} from 'lucide-react';

const SYNODIC = 29.530588853;
function getMoonPhase(date = new Date()) {
  const ref = Date.UTC(2000, 0, 6, 18, 14, 0);
  let phase = (((date.getTime() - ref) / 86400000) % SYNODIC) / SYNODIC;
  if (phase < 0) phase += 1;
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  const waxing = phase < 0.5;
  let name;
  if (phase < 0.03 || phase > 0.97) name = 'Újhold';
  else if (phase < 0.22) name = 'Növő sarló';
  else if (phase < 0.28) name = 'Első negyed';
  else if (phase < 0.47) name = 'Növő hold';
  else if (phase < 0.53) name = 'Telihold';
  else if (phase < 0.72) name = 'Fogyó hold';
  else if (phase < 0.78) name = 'Utolsó negyed';
  else name = 'Fogyó sarló';
  return { phase, illumination, waxing, name };
}

function ddToText(deg) {
  const dirs = ['É', 'ÉK', 'K', 'DK', 'D', 'DNy', 'Ny', 'ÉNy'];
  return dirs[Math.round(deg / 45) % 8] || '–';
}

// Körkörös hőmérséklet-mérő (SVG) — a hero középpontja
function TempGauge({ temp, feels, condition, CondIcon }) {
  const R = 104, C = 2 * Math.PI * R;
  const frac = temp == null ? 0 : Math.max(0, Math.min(1, (temp + 15) / 55));
  const offset = C * (1 - frac);
  return (
    <div className="relative w-[240px] h-[240px] mx-auto">
      <svg viewBox="0 0 240 240" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="gauge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#06b6d4" />
            <stop offset="0.5" stopColor="#14b8a6" />
            <stop offset="1" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <circle cx="120" cy="120" r={R} fill="none" stroke="rgba(249,249,246,0.06)" strokeWidth="10" />
        <circle
          cx="120" cy="120" r={R} fill="none" stroke="url(#gauge)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease', filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.65))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <CondIcon className="w-7 h-7 text-cyan2-400 mb-1 animate-float" />
        {temp != null ? (
          <div className="flex items-start leading-none">
            <span className="text-6xl font-light tracking-tighter text-white">{temp.toFixed(0)}</span>
            <span className="text-2xl font-light text-white/70 mt-1">°</span>
          </div>
        ) : (
          <span className="text-3xl font-light text-white/60">– °</span>
        )}
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-night-200/80 mt-1">{condition}</p>
        {feels != null && (
          <p className="text-[11px] font-semibold text-night-200/55 mt-0.5">Hőérzet {feels.toFixed(0)}°</p>
        )}
      </div>
    </div>
  );
}

export default function WeatherDashboard() {
  const { currentData, historySeries, loading, error, lastUpdate, refresh } = useWeatherData();

  const [forecastData, setForecastData] = useState({
    title: 'Helyzetjelentés: Betöltés...',
    content: 'Kérjük, várjon...',
    updated_at: new Date().toISOString()
  });
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminTitle, setAdminTitle] = useState('');
  const [adminContent, setAdminContent] = useState('');
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [adminError, setAdminError] = useState('');
  const longPressRef = useRef(null);

  useEffect(() => {
    getForecast().then(data => {
      setForecastData(data);
      setAdminTitle(data.title);
      setAdminContent(data.content);
    });
  }, []);

  const startLongPress = useCallback(() => {
    longPressRef.current = setTimeout(() => {
      setShowAdmin(true);
    }, 2000);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }, []);

  const handleSaveForecast = async () => {
    if (!adminTitle.trim() || !adminContent.trim()) {
      setAdminError('Kérjük, töltsd ki mindkét mezőt!');
      return;
    }
    setSavingAdmin(true);
    setAdminError('');
    try {
      const data = await saveForecast(adminTitle.trim(), adminContent.trim());
      setForecastData(data);
      setShowAdmin(false);
    } catch (err) {
      console.error(err);
      setAdminError(err.message || 'Hiba történt a mentés során.');
    } finally {
      setSavingAdmin(false);
    }
  };

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const lastMeasure = currentData?.last_measure || {};
  const sunInfo = currentData?.sun_info || {};

  const chartSeries = useMemo(() => {
    const out = {};
    for (const k in historySeries) {
      const { ts, data } = historySeries[k];
      out[k] = {
        labels: ts.map(t =>
          new Date(t * 1000).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Budapest' })
        ),
        data
      };
    }
    return out;
  }, [historySeries]);


  const [activeKey, setActiveKey] = useState(null);
  const chartableKeys = useMemo(() => new Set(CHART_CONFIGS.map(c => c.key)), []);
  const activeMetric = useMemo(() => CHART_CONFIGS.find(c => c.key === activeKey) || null, [activeKey]);

  const weather = useMemo(() => {
    const nowSec = Date.now() / 1000;
    const { sunrise, sunset } = sunInfo || {};
    const tw = 45 * 60;
    let timeOfDay;
    if (sunrise && sunset) {
      if (nowSec < sunrise - tw || nowSec > sunset + tw) timeOfDay = 'night';
      else if (nowSec < sunrise + tw) timeOfDay = 'dawn';
      else if (nowSec > sunset - tw) timeOfDay = 'dusk';
      else timeOfDay = 'day';
    } else {
      const h = new Date().getHours();
      timeOfDay = (h < 6 || h >= 21) ? 'night' : h < 8 ? 'dawn' : h >= 19 ? 'dusk' : 'day';
    }
    const rr = lastMeasure.RR_1H || 0;
    const rate = lastMeasure.RR_RATE || 0;
    const u = lastMeasure.U ?? 50;
    const temp = lastMeasure.T;
    let condition = 'clear';
    if (rr > 1.0 || rate > 0.5) condition = 'rain';
    else if (rr > 0.1 || rate > 0) condition = 'drizzle';
    else if (u >= 92) condition = 'fog';

    let label;
    if (condition === 'rain') label = 'Esős idő';
    else if (condition === 'drizzle') label = 'Szemerkélő';
    else if (condition === 'fog') label = 'Párás, ködös';
    else if (timeOfDay === 'night') label = 'Tiszta éj';
    else if (timeOfDay === 'dawn') label = 'Derült hajnal';
    else if (timeOfDay === 'dusk') label = 'Alkonyat';
    else label = temp && temp > 25 ? 'Meleg, napos' : 'Napsütés';

    let CondIcon = Sun;
    if (condition === 'rain') CondIcon = CloudRain;
    else if (condition === 'drizzle') CondIcon = CloudDrizzle;
    else if (condition === 'fog') CondIcon = CloudFog;
    else if (timeOfDay === 'night') CondIcon = Moon;

    return { timeOfDay, condition, label, isNight: timeOfDay === 'night', CondIcon };
  }, [lastMeasure, sunInfo]);

  const moon = useMemo(() => getMoonPhase(new Date()), []);

  const temp = typeof lastMeasure.T === 'number' ? lastMeasure.T : null;
  const feels = typeof lastMeasure.HEAT_INDEX === 'number' ? lastMeasure.HEAT_INDEX : null;
  const tMin = typeof lastMeasure.T_MIN === 'number' ? lastMeasure.T_MIN : null;
  const tMax = typeof lastMeasure.T_MAX === 'number' ? lastMeasure.T_MAX : null;
  const hum = typeof lastMeasure.U === 'number' ? lastMeasure.U : null;
  const wind = typeof lastMeasure.FF === 'number' ? lastMeasure.FF : null;
  const windDir = typeof lastMeasure.DD === 'number' ? lastMeasure.DD : null;

  const now = new Date();
  const dateStr = now.toLocaleDateString('hu-HU', { weekday: 'long', month: 'long', day: 'numeric' });

  let statusColor = 'bg-emerald-400 shadow-[0_0_8px_#34d399]';
  let statusText = 'Kapcsolat stabil';
  if (loading && !currentData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-cyan2-300">
        <div className="w-12 h-12 rounded-full border-[3px] border-cyan2-400 border-t-transparent animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest text-night-200/60">Adatok betöltése...</p>
      </div>
    );
  } else if (loading) {
    statusColor = 'bg-amber-400 shadow-[0_0_8px_#fbbf24]';
    statusText = 'Frissítés...';
  } else if (error) {
    statusColor = 'bg-rose-400 shadow-[0_0_8px_#fb7185]';
    statusText = 'Hiba a lekérdezéskor';
  }

  // Hero alatti gyors-statok
  const quick = [
    { icon: ArrowDown, label: 'Min', val: tMin != null ? `${tMin.toFixed(0)}°` : '–' },
    { icon: ArrowUp, label: 'Max', val: tMax != null ? `${tMax.toFixed(0)}°` : '–' },
    { icon: Droplets, label: 'Pára', val: hum != null ? `${hum.toFixed(0)}%` : '–' },
    { icon: Wind, label: 'Szél', val: wind != null ? `${wind.toFixed(0)} km/h` : '–' },
  ];

  return (
    <div className="max-w-3xl lg:max-w-6xl mx-auto px-4">

      {/* --- HERO: körkörös mérő --- */}
      <FadeUp>
        <div className="relative glass-card rounded-[2rem] p-6 pt-7 overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-cyan2-500/15 blur-3xl pointer-events-none" />

          {/* Hely + dátum */}
          <div className="relative text-center mb-5">
            <div className="inline-flex items-center gap-1.5 text-sm font-bold text-white">
              <MapPin className="w-4 h-4 text-cyan2-300" /> Kőszeg
            </div>
            <p className="text-[11px] font-semibold text-night-200/55 uppercase tracking-[0.15em] mt-1">{dateStr}</p>
            {weather.isNight && (
              <span className="inline-block mt-2 text-[10px] font-bold text-cyan2-200 uppercase tracking-widest bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                🌙 {moon.name}
              </span>
            )}
          </div>

          {/* Mérő */}
          <TempGauge temp={temp} feels={feels} condition={weather.label} CondIcon={weather.CondIcon} />

          {/* Gyors-statok */}
          <div className="relative grid grid-cols-4 gap-2 mt-6">
            {quick.map(({ icon: Icon, label, val }) => (
              <div key={label} className="flex flex-col items-center gap-1 rounded-2xl bg-white/[0.04] border border-white/10 py-3">
                <Icon className="w-4 h-4 text-cyan2-300" />
                <span className="text-sm font-bold text-white leading-none">{val}</span>
                <span className="text-[9px] font-semibold text-night-200/50 uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>

          {windDir != null && (
            <p className="relative text-center text-[11px] font-semibold text-night-200/55 mt-3">
              Szélirány: <span className="text-cyan2-200 font-bold">{ddToText(windDir)} ({windDir.toFixed(0)}°)</span>
            </p>
          )}

        </div>
      </FadeUp>

      {/* --- STATUS / REFRESH --- */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <div className="flex items-center gap-2.5 glass-card rounded-2xl px-3.5 py-2">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-xs font-bold text-white">{statusText}</span>
          {lastUpdate && <span className="text-[10px] font-semibold text-night-200/50">· {lastUpdate}</span>}
        </div>
        <button onClick={refresh} disabled={loading} className="btn-grad px-4 py-2 text-xs disabled:opacity-50">
          <IoRefresh className={`text-sm ${loading ? 'animate-spin' : ''}`} />
          Frissítés
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-2xl bg-rose-400/10 border border-rose-400/25 text-rose-200 text-xs font-semibold flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>API hiba: {error}</span>
        </div>
      )}

      {/* --- HELYI ELŐREJELZÉS / HELYZETJELENTÉS --- */}
      <FadeUp delay={0.02}>
        <div id="dashboard-forecast" className="relative glass-card rounded-[2rem] p-6 overflow-hidden mt-5">
          <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-cyan2-500/10 blur-3xl pointer-events-none" />
          
          <div 
            className="flex items-center justify-between mb-4 select-none cursor-default"
            onMouseDown={startLongPress}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onTouchStart={startLongPress}
            onTouchEnd={cancelLongPress}
            onTouchCancel={cancelLongPress}
          >
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center text-white"><Calendar className="w-4 h-4" /></span>
              <span>László Helyzetjelentése</span>
            </h2>
            <span className="text-[9px] font-bold text-night-200/35 uppercase tracking-widest">
              Előrejelzés
            </span>
          </div>

          <div className="space-y-3 relative z-10">
            <h3 className="text-base font-extrabold text-cyan2-200 leading-snug">{forecastData.title}</h3>
            
            <p className="text-[10px] font-bold text-night-200/50 uppercase tracking-wide">
              Készítette: Ráduly László · Frissítve: {new Date(forecastData.updated_at).toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
            
            <div className="h-px bg-white/5 my-2.5" />
            
            <p className="text-sm text-night-100/85 leading-relaxed whitespace-pre-wrap font-medium">
              {forecastData.content}
            </p>
          </div>
        </div>
      </FadeUp>

      {/* --- NAP-CIKLUS --- */}
      <FadeUp delay={0.05}>
        <SectionLabel>Nap-ciklus</SectionLabel>
        <SunBar sunInfo={sunInfo} loading={loading} />
      </FadeUp>

      {/* --- RÉSZLETES MÉRÉSEK --- */}
      <FadeUp delay={0.05}>
        <SectionLabel>Részletes mérések</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STAT_CARDS_CONFIG.map(cfg => (
            <StatCard
              key={cfg.key}
              config={cfg}
              val={lastMeasure[cfg.key]}
              onClick={chartableKeys.has(cfg.key) ? () => setActiveKey(cfg.key) : undefined}
            />
          ))}
        </div>
      </FadeUp>

      {/* --- ELŐZMÉNYEK --- */}
      <FadeUp delay={0.05}>
        <SectionLabel>24 órás előzmények</SectionLabel>
        <div className="mb-3 p-3.5 rounded-2xl bg-cyan2-400/[0.07] border border-cyan2-400/15 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan2-300 shrink-0 mt-0.5" />
          <p className="text-[11px] text-night-100/80 leading-relaxed">
            Az állomás szervere <strong className="font-bold text-white">nem mindig küld folyamatos adatot</strong>, ezért egy-egy grafikon átmenetileg üres lehet. Ilyenkor nyomd meg párszor a <strong className="font-bold text-cyan2-200">Frissítés</strong> gombot.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {CHART_CONFIGS.map(cfg => (
            <ChartCard
              key={cfg.key}
              config={cfg}
              timestamps={chartSeries[cfg.key]?.labels || []}
              data={chartSeries[cfg.key]?.data || []}
              loading={loading}
            />
          ))}
        </div>
      </FadeUp>

      {/* --- ATTRIBUTION --- */}
      <div className="mt-8 p-5 rounded-[1.5rem] bg-brand-gradient-soft border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="space-y-1">
          <h3 className="text-sm font-extrabold text-white">Köszönjük az adatokat! 🙌</h3>
          <p className="text-xs text-night-200/70 leading-relaxed max-w-xl">
            A mérésekért köszönet <strong className="text-cyan2-200">Ráduly Lászlónak</strong> (Kőszegi Időjárás Előrejelzés)!
          </p>
        </div>
        <a
          href="https://www.facebook.com/search/top?q=k%C5%91szegi%20id%C5%91j%C3%A1r%C3%A1s%20el%C5%91rejelz%C3%A9s"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-grad px-5 py-2.5 text-xs shrink-0"
        >
          <span>Facebook oldal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <StatDetailModal
        metric={activeMetric}
        timestamps={activeKey ? (chartSeries[activeKey]?.labels || []) : []}
        data={activeKey ? (chartSeries[activeKey]?.data || []) : []}
        currentValue={activeKey ? lastMeasure[activeKey] : null}
        onClose={() => setActiveKey(null)}
      />

      {/* --- FORECAST ADMIN MODAL --- */}
      <AnimatePresence>
        {showAdmin && (
          <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-md" 
              onClick={() => setShowAdmin(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-lg bg-night-800 rounded-[2rem] p-6 flex flex-col gap-4 shadow-2xl border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center text-white"><Calendar className="w-4 h-4" /></span>
                  <span>Jelentés Módosítása (Laci)</span>
                </h3>
                <button 
                  onClick={() => setShowAdmin(false)} 
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-night-200/50 uppercase tracking-widest mb-1.5 block">Jelentés címe</label>
                  <input
                    type="text"
                    value={adminTitle}
                    onChange={e => setAdminTitle(e.target.value.slice(0, 80))}
                    placeholder="Pl.: Lassú felmelegedés és záporok..."
                    className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-sm font-semibold placeholder:text-night-200/35 focus:outline-none focus:ring-2 focus:ring-cyan2-400/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-night-200/50 uppercase tracking-widest mb-1.5 block">Jelentés részletei</label>
                  <textarea
                    rows={6}
                    value={adminContent}
                    onChange={e => setAdminContent(e.target.value)}
                    placeholder="Másold be ide a Facebook poszt szövegét..."
                    className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-sm font-semibold placeholder:text-night-200/35 focus:outline-none focus:ring-2 focus:ring-cyan2-400/50 resize-none leading-relaxed"
                  />
                </div>
              </div>

              {adminError && <p className="text-rose-300 text-xs font-extrabold text-center">{adminError}</p>}

              <button 
                onClick={handleSaveForecast} 
                disabled={savingAdmin} 
                className="btn-grad w-full py-4 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {savingAdmin ? 'Mentés folyamatban...' : 'Jelentés Mentése és Publikálása'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-cyan2-200/80 mt-8 mb-3 flex items-center gap-3">
      <span>{children}</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}
