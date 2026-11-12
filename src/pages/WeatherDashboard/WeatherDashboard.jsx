import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { IoRefresh } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import useWeatherData from './useWeatherData';
import StatCard, { STAT_CARDS_CONFIG } from './StatCard';
import ChartCard, { CHART_CONFIGS } from './ChartCard';
import StatDetailModal from './StatDetailModal';
import UvCard from '../../components/UvCard';
import SponsorTile from '../../components/SponsorTile';
import HeroSky from '../../components/HeroSky';
import HeroWeatherVideo from '../../components/HeroWeatherVideo';
import { TempGauge, WindGauge } from '../../components/GaugeBar';
import { CONDITION_ICONS } from '../../utils/weatherConditionIcons';
import { MOON_PHASE_ICONS, moonriseIcon, moonsetIcon } from '../../utils/moonPhaseIcons';
import { getMoonTimes } from 'suncalc';
import { fetchCurrentSky } from '../../api/weather';
import { getWeatherVideoCategory } from '../../utils/weatherVideoCategory';
import { useAdminUnlock } from '../../components/AdminContext';
import { useWeatherMood } from '../../components/WeatherMoodContext';
import { FadeUp } from '../../components/AppleMotion';
import { createPortal } from 'react-dom';
import { supabase, getForecast, saveForecast, getSponsors, getNewsBlurbs, addNewsBlurb, updateNewsBlurb, deleteNewsBlurb, uploadForecastImage, getPushSubscriberCount, evaluatePredictions, getLocalDateStr, getPendingTippeldeSummary } from '../../api/supabase';
import {
  AlertTriangle, MapPin, Info,
  Newspaper, Plus, Trash2, Pencil, Check, Image as ImageIcon,
  ArrowDown, ArrowUp, Droplets, Wind, Calendar, X, Bell, Trophy,
  Thermometer, Sunrise, Sunset
} from 'lucide-react';


// Kép tömörítése feltöltés előtt (max 1000px széles, JPEG).
function compressImage(file, maxW = 1000) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(resolve, 'image/jpeg', 0.85);
    };
    img.src = url;
  });
}

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

// Főoldali tartalom-kapcsoló lapjai (lásd activeTab state)
const CONTENT_TABS = [
  { key: 'forecast', label: 'Előrejelzés' },
  { key: 'news', label: 'Villámhírek' },
  { key: 'measurements', label: 'Mérések' },
];

function ddToText(deg) {
  const dirs = ['É', 'ÉK', 'K', 'DK', 'D', 'DNy', 'Ny', 'ÉNy'];
  return dirs[Math.round(deg / 45) % 8] || '–';
}

// Napkelte/napnyugta unix időbélyeg -> "HH:mm" (hero arany-óra sáv).
function formatClock(unixSec) {
  if (!unixSec) return '–';
  try {
    return new Date(unixSec * 1000).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Budapest' });
  } catch {
    return '–';
  }
}

// SunCalc Date objektumhoz (holdkelte/holdnyugta) — nem unix mp, hanem már Date.
function formatClockDate(date) {
  if (!date) return '–';
  try {
    return date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Budapest' });
  } catch {
    return '–';
  }
}

// Relatív idő magyarul a tényleges mérési időbélyeghez (unix mp).
function formatAgoHu(unixSec, nowMs) {
  if (!unixSec) return null;
  const diffMin = Math.max(0, Math.round((nowMs - unixSec * 1000) / 60000));
  if (diffMin < 1) return 'épp most';
  if (diffMin < 60) return `${diffMin} perce`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m ? `${h} ó ${m} p` : `${h} órája`;
}

// Landscape weather hero card matching custom mockup
function WeatherHero({
  temp, feels, isNight, timeOfDay, dateStr, tempTrend, tempClicks = 0, onTempClick,
  videoCategory, wind, windDir, hum, tMin, tMax, sunInfo, condition, weatherLabel, moon,
}) {
  const mood = useWeatherMood();
  const trendUp = tempTrend === 'up';
  const trendDown = tempTrend === 'down';

  // Reduced-motion / adattakarékos mód esetén meg se próbáljuk betölteni a videót.
  const allowVideo = typeof window !== 'undefined'
    && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    && !navigator.connection?.saveData;
  const [failedCategory, setFailedCategory] = useState(null);
  const showVideo = allowVideo && !!videoCategory && failedCategory !== videoCategory;
  let gradientClass = 'from-cyan-600 via-cyan-500 to-teal-500';

  if (timeOfDay === 'night') {
    gradientClass = 'from-indigo-950 via-slate-900 to-blue-950';
  } else if (timeOfDay === 'dawn') {
    gradientClass = 'from-orange-500 via-rose-500 to-indigo-700';
  } else if (timeOfDay === 'dusk') {
    gradientClass = 'from-indigo-900 via-purple-800 to-pink-700';
  }

  // Nap pozíciója napkelte és napnyugta között (0 = kel, 1 = nyugszik) az arany-óra sávhoz
  const sunrise = sunInfo?.sunrise;
  const sunset = sunInfo?.sunset;
  const now = Date.now() / 1000;
  let dayFraction = 0;
  if (sunrise && sunset) {
    dayFraction = now < sunrise ? 0 : now > sunset ? 1 : (now - sunrise) / (sunset - sunrise);
  }

  // Ugyanez a Holdra: pozíció holdkelte és holdnyugta között, ugyanazzal a logikával
  const moonRiseSec = moon?.rise ? moon.rise.getTime() / 1000 : null;
  const moonSetSec = moon?.set ? moon.set.getTime() / 1000 : null;
  let moonFraction = moon?.alwaysUp ? 0.5 : 0;
  if (moonRiseSec && moonSetSec) {
    moonFraction = now < moonRiseSec ? 0 : now > moonSetSec ? 1 : (now - moonRiseSec) / (moonSetSec - moonRiseSec);
  }

  return (
    <div>
      {/* FOTÓ/VIDEÓ — maga a videó réteg van a szélein (kb. 5-7%) valódi filter:blur()-ral
          elmosva és maszkolva, így éles vágás nélkül olvad bele az oldal hátterébe */}
      <div className="relative left-1/2 -mx-[50vw] w-screen lg:left-0 lg:mx-0 lg:w-full h-[196px] sm:h-[238px]">
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, black 7%, black 93%, transparent 100%), ' +
              'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
            WebkitMaskComposite: 'source-in',
            maskImage:
              'linear-gradient(to bottom, transparent 0%, black 7%, black 93%, transparent 100%), ' +
              'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
            maskComposite: 'intersect',
          }}
        >
          {showVideo ? (
            <>
              {/* 1. Alapréteg: maga a videó közvetlen filter:blur(12px) elmosással a szélekhez */}
              <HeroWeatherVideo
                category={videoCategory}
                onError={() => setFailedCategory(videoCategory)}
                className="absolute inset-0 w-full h-full object-cover scale-105 blur-[12px]"
                ariaHidden="true"
              />
              {/* 2. Éles középső videó réteg: a külső 5-7%-os sávban átlátszóvá válik,
                  így a szélén az alatta futó, valóban elmosott videó-réteg látszik */}
              <HeroWeatherVideo
                category={videoCategory}
                onError={() => setFailedCategory(videoCategory)}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  WebkitMaskImage:
                    'linear-gradient(to bottom, transparent 0%, transparent 2%, black 9%, black 91%, transparent 98%, transparent 100%), ' +
                    'linear-gradient(to right, transparent 0%, transparent 1.5%, black 7%, black 93%, transparent 98.5%, transparent 100%)',
                  WebkitMaskComposite: 'source-in',
                  maskImage:
                    'linear-gradient(to bottom, transparent 0%, transparent 2%, black 9%, black 91%, transparent 98%, transparent 100%), ' +
                    'linear-gradient(to right, transparent 0%, transparent 1.5%, black 7%, black 93%, transparent 98.5%, transparent 100%)',
                  maskComposite: 'intersect',
                }}
              />
            </>
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
              <HeroSky isNight={isNight} />
            </div>
          )}

          {/* Finom alsó sötétítés a szöveg olvashatóságához (a külső maszk ezt is beleolvasztja a háttérbe) */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />
        </div>

        {/* Lebegő dátum-cimke a videón */}
        <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-bold text-white">
          {dateStr}
        </div>

        {/* A helyszín felirata közvetlenül a videón, mellette a Meteocons animált időjárás-állapot ikonja */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-5 sm:px-6 pb-4 max-w-3xl lg:max-w-6xl mx-auto flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">Kőszeg</h2>
            <p className="flex items-center gap-1.5 text-[13px] text-white/70 font-medium mt-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
              <MapPin className="w-3.5 h-3.5 text-white/60 shrink-0" />
              47.3971°N, 16.546°E · 274 m
            </p>
          </div>
          {CONDITION_ICONS[condition] && (
            <img
              src={CONDITION_ICONS[condition]}
              alt={weatherLabel || ''}
              className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 drop-shadow-[0_3px_10px_rgba(0,0,0,0.5)]"
            />
          )}
        </div>
      </div>

      {/* ADAT-SZEKCIÓ a videó alatt — vissza a lap normál tartalom-szélességére, nincs
          közös külső doboz/keret a csempék körül, mindegyik önállóan lebeg. */}
      <div className="relative pt-4 text-white">
        {/* Két nagy csempe: Hőmérséklet + Szél */}
        <div className="grid grid-cols-2 gap-2">
            <div className="relative rounded-apple-card glass-card p-3.5 overflow-hidden">
              {mood.enabled && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: `linear-gradient(135deg, ${mood.glow1}, transparent 75%)` }}
                />
              )}
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-1">
                  <Thermometer className="w-7 h-7 shrink-0" style={{ color: mood.enabled ? mood.from : 'rgba(255,255,255,0.6)' }} />
                  <motion.span
                    onClick={onTempClick}
                    animate={{ rotate: tempClicks * 72 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="inline-flex items-baseline gap-1 text-2xl font-bold text-white cursor-pointer select-none active:scale-95 origin-center drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] text-right"
                  >
                    {temp != null ? temp.toFixed(1) : '–'}°C
                    {(trendUp || trendDown) && (
                      <span className={`text-sm font-bold ${trendUp ? 'text-rose-300' : 'text-cyan-300'}`}>
                        {trendUp ? '↑' : '↓'}
                      </span>
                    )}
                  </motion.span>
                </div>
                <TempGauge value={temp} />
                <p className="text-xs text-white/70 font-semibold mt-2">Jelenlegi hőmérséklet</p>
              </div>
            </div>

            <div className="relative rounded-apple-card glass-card p-3.5 overflow-hidden">
              {mood.enabled && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: `linear-gradient(135deg, ${mood.glow2}, transparent 75%)` }}
                />
              )}
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-1">
                  <Wind className="w-7 h-7 shrink-0" style={{ color: mood.enabled ? mood.to : 'rgba(255,255,255,0.6)' }} />
                  <span className="text-2xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] text-right">
                    {wind != null ? `${wind.toFixed(0)} km/h` : '–'}
                  </span>
                </div>
                <WindGauge value={wind} />
                <p className="text-xs text-white/70 font-semibold mt-2">
                  Szél{windDir != null ? ` · ${ddToText(windDir)}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* 4 kisebb csempe */}
          <div className="grid grid-cols-4 gap-2 mt-2.5">
            {[
              { Icon: Droplets, val: hum != null ? `${hum.toFixed(0)}%` : '–', label: 'Pára', color: mood.enabled ? mood.from : 'rgba(255,255,255,0.55)' },
              { Icon: Thermometer, val: feels != null ? `${feels.toFixed(1)}°` : '–', label: 'Hőérzet', color: mood.enabled ? mood.to : 'rgba(255,255,255,0.55)' },
              { Icon: ArrowDown, val: tMin != null ? `${tMin.toFixed(0)}°` : '–', label: 'Min', color: '#67e8f9' },
              { Icon: ArrowUp, val: tMax != null ? `${tMax.toFixed(0)}°` : '–', label: 'Max', color: '#ef4444' },
            ].map(({ Icon, val, label, color }) => (
              <div key={label} className="relative rounded-apple-inner glass-card p-2.5 overflow-hidden">
                {mood.enabled && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: `linear-gradient(135deg, ${mood.glow1}, transparent 75%)` }}
                  />
                )}
                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-1">
                    <Icon className="w-6 h-6 shrink-0" style={{ color }} />
                    <span className="text-lg font-bold text-white text-right leading-tight">{val}</span>
                  </div>
                  <p className="text-xs text-white/70 font-semibold mt-1.5 leading-none">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* NAP + HOLD — egy közös, kompakt csempében, hogy ne vigyen el sok helyet */}
          <div className="relative mt-5 rounded-apple-card glass-card p-3.5 overflow-hidden">
            {/* Napkelte/napnyugta — arany sáv */}
            <div className="relative flex items-center justify-between text-[11px] font-bold text-white/70 mb-2">
              <span className="flex items-center gap-1.5">
                <Sunrise className="w-3.5 h-3.5 text-amber-300" />
                Napkelte <span className="text-white">{formatClock(sunrise)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                Napnyugta <span className="text-white">{formatClock(sunset)}</span>
                <Sunset className="w-3.5 h-3.5 text-amber-300" />
              </span>
            </div>
            <div className="relative h-1.5 rounded-full bg-white/10 overflow-visible">
              <div
                className="h-full rounded-full"
                style={{ width: `${dayFraction * 100}%`, background: 'linear-gradient(90deg,#fde047,#f97316)' }}
              />
              {/* A "napocska" (Meteocons, beépített forgó sugár-animációval) fut végig a
                  sávon a nap pillanatnyi pozíciójában — nem egy sima pötty */}
              <div
                className="absolute top-1/2 w-7 h-7 pointer-events-none"
                style={{ left: `${dayFraction * 100}%`, transform: 'translate(-50%, -50%)', filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.7))' }}
              >
                <img src={CONDITION_ICONS['clear-day']} alt="" className="w-full h-full" />
              </div>
            </div>

            {moon && (
              <>
                <div className="h-px bg-white/10 my-3" />

                {/* Holdkelte/holdnyugta — ugyanaz a sáv-stílus, csak fehéres/ezüstös
                    színnel (nem sárga) és a holdfázis-ikon fut rajta pötty helyett */}
                <div className="relative flex items-center justify-between text-[11px] font-bold text-white/70 mb-2">
                  <span className="flex items-center gap-1.5">
                    <img src={moonriseIcon} alt="" className="w-3.5 h-3.5" />
                    Holdkelte <span className="text-white">{moon.alwaysUp ? 'egész nap' : formatClockDate(moon.rise)}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    Holdnyugta <span className="text-white">{moon.alwaysDown ? 'egész nap' : formatClockDate(moon.set)}</span>
                    <img src={moonsetIcon} alt="" className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="relative h-1.5 rounded-full bg-white/10 overflow-visible">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${moonFraction * 100}%`, background: 'linear-gradient(90deg,#64748b,#f1f5f9)' }}
                  />
                  <div
                    className="absolute top-1/2 w-6 h-6 pointer-events-none"
                    style={{ left: `${moonFraction * 100}%`, transform: 'translate(-50%, -50%)', filter: 'drop-shadow(0 0 7px rgba(226,232,240,0.75))' }}
                  >
                    {MOON_PHASE_ICONS[moon.name] && (
                      <img src={MOON_PHASE_ICONS[moon.name]} alt={moon.name} className="w-full h-full" />
                    )}
                  </div>
                </div>
                <p className="text-center text-[10px] font-bold text-white/50 mt-2">
                  {moon.name} · {Math.round(moon.illumination * 100)}% megvilágítva
                </p>
              </>
            )}
          </div>
        </div>
      </div>
  );
}

export default function WeatherDashboard() {
  const mood = useWeatherMood();
  const { currentData, historySeries, historySource, loading, error, lastUpdate, lastMeasureAt, refresh } = useWeatherData();

  // Égbolt-állapot (WMO weathercode + szélsebesség) a hero-kártya loop-videójához.
  // Ritkán frissül, külön a mérőállomás-adattól (annak nincs égbolt-szenzora).
  const [skyCondition, setSkyCondition] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const load = () => fetchCurrentSky().then(sky => { if (!cancelled && sky) setSkyCondition(sky); });
    load();
    const timer = setInterval(load, 15 * 60 * 1000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const [forecastData, setForecastData] = useState({
    title: 'Helyzetjelentés: Betöltés...',
    content: 'Kérjük, várjon...',
    announcement_text: '',
    announcement_active: false,
    updated_at: new Date().toISOString()
  });
  const [sponsors, setSponsors] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);

  // Admin belépés a (közös) logóról: sikeres PIN után nyíljon a szerkesztő.
  useAdminUnlock(() => setShowAdmin(true));
  const [adminTitle, setAdminTitle] = useState('');
  const [adminContent, setAdminContent] = useState('');
  const [adminAnnText, setAdminAnnText] = useState('');
  const [adminAnnActive, setAdminAnnActive] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [pushSubCount, setPushSubCount] = useState(null);

  // Tartalom-kapcsoló a főoldalon: Előrejelzés / Villámhírek / Mérések —
  // egyszerre csak egy lap tartalma látszik, hogy ne kelljen vég nélkül görgetni.
  const [activeTab, setActiveTab] = useState('forecast');

  // Tippelde & Játékok
  const [tempClicks, setTempClicks] = useState(0);
  const tempClicksTimeoutRef = useRef(null);
  const [evalDate, setEvalDate] = useState(getLocalDateStr());
  const [evalTemp, setEvalTemp] = useState('');
  const [evalBusy, setEvalBusy] = useState(false);
  const [evalSuccess, setEvalSuccess] = useState('');
  const [evalError, setEvalError] = useState('');
  const [pendingTips, setPendingTips] = useState([]);

  useEffect(() => {
    if (showAdmin) {
      getPendingTippeldeSummary().then(data => {
        setPendingTips(data);
        if (data.length > 0) {
          setEvalDate(data[0].date);
        }
      }).catch(err => console.error('Failed to load pending tips summary:', err));
    }
  }, [showAdmin]);

  const handleTempClick = () => {
    setTempClicks(c => {
      const next = c + 1;
      if (tempClicksTimeoutRef.current) {
        clearTimeout(tempClicksTimeoutRef.current);
      }
      if (next >= 5) {
        window.dispatchEvent(new CustomEvent('open-tippelde'));
        return 0;
      } else {
        tempClicksTimeoutRef.current = setTimeout(() => {
          setTempClicks(0);
        }, 3000);
        return next;
      }
    });
  };

  // Szélsebesség Easter Egg (Kvíz)
  const [windClicks, setWindClicks] = useState(0);
  const windClicksTimeoutRef = useRef(null);

  const handleWindIconClick = () => {
    setWindClicks(c => {
      const next = c + 1;
      if (windClicksTimeoutRef.current) {
        clearTimeout(windClicksTimeoutRef.current);
      }
      if (next >= 5) {
        window.dispatchEvent(new CustomEvent('open-quiz'));
        return 0;
      } else {
        windClicksTimeoutRef.current = setTimeout(() => {
          setWindClicks(0);
        }, 3000);
        return next;
      }
    });
  };

  const handleEvaluate = async () => {
    if (!evalDate || !evalTemp) {
      setEvalError('Kérjük, válaszd ki a dátumot és add meg a mért hőmérsékletet!');
      return;
    }
    setEvalBusy(true);
    setEvalError('');
    setEvalSuccess('');
    try {
      const res = await evaluatePredictions(evalDate, parseFloat(evalTemp));
      setEvalSuccess(`Sikeres kiértékelés! ${res.count} db tippet pontoztunk le.`);
      setEvalTemp('');
      const updated = await getPendingTippeldeSummary();
      setPendingTips(updated);
      if (updated.length > 0) {
        setEvalDate(updated[0].date);
      }
    } catch (err) {
      console.error(err);
      setEvalError(err.message || 'Hiba történt a kiértékelés során.');
    } finally {
      setEvalBusy(false);
    }
  };

  // Hírmorzsák
  const [newsBlurbs, setNewsBlurbs] = useState([]);
  const [newBlurb, setNewBlurb] = useState('');
  const [newBlurbFile, setNewBlurbFile] = useState(null);
  const [newBlurbPreview, setNewBlurbPreview] = useState(null);
  const [blurbBusy, setBlurbBusy] = useState(false);
  const [editBlurbId, setEditBlurbId] = useState(null);
  const [editBlurbText, setEditBlurbText] = useState('');
  const [editBlurbFile, setEditBlurbFile] = useState(null);
  const [editBlurbPreview, setEditBlurbPreview] = useState(null); // megjelenített előnézet (régi URL vagy új blob)
  const [blurbZoom, setBlurbZoom] = useState(null); // publikus nagykép

  // Hálózati állapot + "óránként újraszámolt" tick a relatív mérési időhöz.
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [nowTick, setNowTick] = useState(Date.now());
  const activeNewsBlurbs = useMemo(() => {
    const tickTime = new Date(nowTick);
    return newsBlurbs.filter(b => !b.expires_at || new Date(b.expires_at) > tickTime);
  }, [newsBlurbs, nowTick]);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const t = setInterval(() => setNowTick(Date.now()), 60000); // percenként frissül a "X perce" felirat
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    getForecast().then(data => {
      setForecastData(data);
      setAdminTitle(data.title);
      setAdminContent(data.content);
      setAdminAnnText(data.announcement_text || '');
      setAdminAnnActive(data.announcement_active || false);
      // Load push subscriber count when admin opens
      getPushSubscriberCount().then(setPushSubCount);
    });

    getNewsBlurbs().then(data => {
      const now = new Date();
      const active = data.filter(b => !b.expires_at || new Date(b.expires_at) > now);
      setNewsBlurbs(active);
    });

    let blurbChannel = null;
    if (supabase) {
      blurbChannel = supabase
        .channel('realtime_news_blurbs')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'news_blurbs' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setNewsBlurbs((prev) => {
              if (prev.some(b => b.id === payload.new.id)) return prev;
              return [payload.new, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            setNewsBlurbs((prev) => prev.filter((b) => b.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setNewsBlurbs((prev) => prev.map((b) => b.id === payload.new.id ? payload.new : b));
          }
        })
        .subscribe();
    }

    getSponsors().then(data => {
      const activeSponsors = data.filter(sp => sp.active && new Date(sp.expires_at) > new Date());
      setSponsors(activeSponsors);
    });

    return () => {
      if (blurbChannel) supabase.removeChannel(blurbChannel);
    };
  }, []);


  // --- Pull-to-refresh (mobil) ---
  const pullStartY = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const PULL_THRESHOLD = 64;

  const onTouchStart = useCallback((e) => {
    if (window.scrollY <= 0) pullStartY.current = e.touches[0].clientY;
    else pullStartY.current = null;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (pullStartY.current == null) return;
    const delta = e.touches[0].clientY - pullStartY.current;
    if (delta > 0 && window.scrollY <= 0) {
      // csillapított húzás, max ~90px
      setPullDistance(Math.min(delta * 0.5, 90));
    } else {
      setPullDistance(0);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (pullStartY.current != null && pullDistance > PULL_THRESHOLD && !loading) {
      refresh();
    }
    pullStartY.current = null;
    setPullDistance(0);
  }, [pullDistance, loading, refresh]);

  const handleSaveForecast = async () => {
    if (!adminTitle.trim() || !adminContent.trim()) {
      setAdminError('Kérjük, töltsd ki mindkét mezőt!');
      return;
    }
    setSavingAdmin(true);
    setAdminError('');
    try {
      const data = await saveForecast({
        title: adminTitle.trim(),
        content: adminContent.trim(),
        announcement_text: adminAnnText.trim(),
        announcement_active: adminAnnActive
      });
      setForecastData(data);

      // --- Send Web Push notification if emergency alert is active ---
      if (adminAnnActive && adminAnnText.trim().length > 0) {
        try {
          const pushRes = await fetch('/.netlify/functions/send-push-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Rendkívüli Riasztás!',
              body: adminAnnText.trim(),
              url: `/?alert=true&title=${encodeURIComponent('Rendkívüli Riasztás!')}&body=${encodeURIComponent(adminAnnText.trim())}`
            })
          });
          const pushData = await pushRes.json();
          console.log('[Admin] Push alert sent:', pushData);
        } catch (pushErr) {
          // Push failure is non-fatal — the forecast is already saved
          console.warn('[Admin] Push notification failed (non-fatal):', pushErr.message);
        }
      }

      setShowAdmin(false);
    } catch (err) {
      console.error(err);
      setAdminError(err.message || 'Hiba történt a mentés során.');
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleNewBlurbFile = (e) => {
    const f = e.target.files?.[0];
    if (f) { setNewBlurbFile(f); setNewBlurbPreview(URL.createObjectURL(f)); }
  };

  const handleAddBlurb = async () => {
    const text = newBlurb.trim();
    if (!text) return;
    setBlurbBusy(true);
    try {
      let imageUrl = null;
      if (newBlurbFile) {
        const compressed = await compressImage(newBlurbFile);
        imageUrl = await uploadForecastImage(compressed);
      }
      const created = await addNewsBlurb(text, imageUrl);
      setNewsBlurbs(prev => [created, ...prev]);
      setNewBlurb('');
      setNewBlurbFile(null);
      setNewBlurbPreview(null);
    } catch (err) {
      console.error(err);
      setAdminError(err.message || 'Hiba a hírmorzsa mentésekor.');
    } finally {
      setBlurbBusy(false);
    }
  };

  const handleDeleteBlurb = async (id) => {
    setBlurbBusy(true);
    try {
      await deleteNewsBlurb(id);
      setNewsBlurbs(prev => prev.filter(b => b.id !== id));
      if (editBlurbId === id) setEditBlurbId(null);
    } catch (err) {
      console.error(err);
      setAdminError(err.message || 'Hiba a hírmorzsa törlésekor.');
    } finally {
      setBlurbBusy(false);
    }
  };

  const startEditBlurb = (b) => {
    setEditBlurbId(b.id);
    setEditBlurbText(b.content);
    setEditBlurbFile(null);
    setEditBlurbPreview(b.image_url || null);
  };

  const cancelEditBlurb = () => {
    setEditBlurbId(null);
    setEditBlurbText('');
    setEditBlurbFile(null);
    setEditBlurbPreview(null);
  };

  const handleEditBlurbFile = (e) => {
    const f = e.target.files?.[0];
    if (f) { setEditBlurbFile(f); setEditBlurbPreview(URL.createObjectURL(f)); }
  };

  const handleRemoveEditBlurbImage = () => {
    setEditBlurbFile(null);
    setEditBlurbPreview(null);
  };

  const handleSaveEditBlurb = async () => {
    const text = editBlurbText.trim();
    if (!text || !editBlurbId) return;
    setBlurbBusy(true);
    try {
      let imageUrl = editBlurbPreview; // megtartott meglévő URL, vagy null ha eltávolítva
      if (editBlurbFile) {
        const compressed = await compressImage(editBlurbFile);
        imageUrl = await uploadForecastImage(compressed);
      }
      const updated = await updateNewsBlurb(editBlurbId, text, imageUrl || null);
      setNewsBlurbs(prev => prev.map(b => (b.id === editBlurbId ? updated : b)));
      cancelEditBlurb();
    } catch (err) {
      console.error(err);
      setAdminError(err.message || 'Hiba a hírmorzsa módosításakor.');
    } finally {
      setBlurbBusy(false);
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
    // Alkonyatkor (dusk, napnyugta előtt 45 perccel) már az esti/éjszakai videót és ikont adjuk
    const isNight = timeOfDay === 'night' || timeOfDay === 'dusk';
    const rr = lastMeasure.RR_1H || 0;
    const rate = lastMeasure.RR_RATE || 0;
    const code = skyCondition?.weathercode;
    const windKmh = skyCondition?.windSpeedKmh ?? lastMeasure.FF ?? 0;

    // Elsősorban a mérőállomás csapadék-adata dönt (az a legpontosabb helyi mérés),
    // a többi feltételnél az Open-Meteo égbolt-kódja (annak nincs csapadék-szenzora).
    let condition, label;
    if (rr > 1.0 || rate > 0.5) {
      condition = 'rain'; label = 'Esős idő';
    } else if (rr > 0.1 || rate > 0) {
      condition = 'drizzle'; label = 'Szemerkélő eső';
    } else if (code != null && code >= 95) {
      condition = isNight ? 'thunderstorm-night' : 'thunderstorm-day'; label = 'Zivatar';
    } else if (code != null && ((code >= 71 && code <= 77) || code === 85 || code === 86)) {
      condition = 'snow'; label = 'Havazás';
    } else if (code != null && ((code >= 80 && code <= 82) || (code >= 65 && code <= 67))) {
      condition = 'heavy-rain'; label = 'Felhőszakadás';
    } else if (code != null && code >= 61 && code <= 64) {
      condition = 'rain'; label = 'Esős idő';
    } else if (code != null && code >= 51 && code <= 57) {
      condition = 'drizzle'; label = 'Szemerkélő eső';
    } else if (code === 45 || code === 48) {
      condition = isNight ? 'fog-night' : 'fog-day'; label = 'Ködös';
    } else if (windKmh >= 35) {
      condition = 'windy'; label = 'Szeles';
    } else if (code === 0) {
      condition = isNight ? 'clear-night' : 'clear-day'; label = 'Tiszta égbolt';
    } else if (code != null && code <= 2) {
      condition = isNight ? 'partly-cloudy-night' : 'partly-cloudy-day'; label = 'Változóan felhős';
    } else {
      condition = isNight ? 'overcast-night' : 'overcast-day'; label = 'Borult';
    }

    return { timeOfDay, condition, label, isNight };
  }, [lastMeasure, sunInfo, skyCondition]);

  const videoCategory = useMemo(() => getWeatherVideoCategory({
    weathercode: skyCondition?.weathercode,
    windSpeedKmh: skyCondition?.windSpeedKmh ?? lastMeasure.FF ?? 0,
    isNight: weather.isNight,
  }), [skyCondition, lastMeasure.FF, weather.isNight]);


  const moon = useMemo(() => {
    const phaseInfo = getMoonPhase(new Date());
    const times = getMoonTimes(new Date(), 47.3971, 16.546);
    return { ...phaseInfo, rise: times.rise || null, set: times.set || null, alwaysUp: !!times.alwaysUp, alwaysDown: !!times.alwaysDown };
  }, []);

  const temp = typeof lastMeasure.T === 'number' ? lastMeasure.T : null;
  // Hőérzet: hidegben (≤10°C) a szél-index (wind chill), melegben a hőindex a helyes.
  const windChill = typeof lastMeasure.WIND_CHILL === 'number' ? lastMeasure.WIND_CHILL : null;
  const heatIndex = typeof lastMeasure.HEAT_INDEX === 'number' ? lastMeasure.HEAT_INDEX : null;
  const feels = (temp != null && temp <= 10 && windChill != null) ? windChill : heatIndex;
  const tempTrend = lastMeasure.T_TREND || null; // 'up' | 'down' | 'stable'
  const tMin = typeof lastMeasure.T_MIN === 'number' ? lastMeasure.T_MIN : null;
  const tMax = typeof lastMeasure.T_MAX === 'number' ? lastMeasure.T_MAX : null;
  const hum = typeof lastMeasure.U === 'number' ? lastMeasure.U : null;
  const wind = typeof lastMeasure.FF === 'number' ? lastMeasure.FF : null;
  const windDir = typeof lastMeasure.DD === 'number' ? lastMeasure.DD : null;

  const now = new Date();
  const dateStr = now.toLocaleDateString('hu-HU', { weekday: 'long', month: 'long', day: 'numeric' });

  // Mennyire friss az állomás adata? (tényleges mérési idő, nem a lekérés ideje)
  const measureAgeMin = lastMeasureAt ? Math.round((nowTick - lastMeasureAt * 1000) / 60000) : null;
  const isStale = measureAgeMin != null && measureAgeMin >= 30;
  const measureAgo = formatAgoHu(lastMeasureAt, nowTick);

  let statusColor = 'bg-emerald-400 shadow-[0_0_8px_#34d399]';
  let statusText = 'Kapcsolat stabil';
  if (loading && !currentData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-cyan2-300">
        <div className="w-12 h-12 rounded-full border-[3px] border-cyan2-400 border-t-transparent animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest text-night-200/60">Adatok betöltése...</p>
      </div>
    );
  } else if (!isOnline) {
    statusColor = 'bg-night-300 shadow-[0_0_8px_#64748b]';
    statusText = 'Offline · mentett adat';
  } else if (loading) {
    statusColor = 'bg-amber-400 shadow-[0_0_8px_#fbbf24]';
    statusText = 'Frissítés...';
  } else if (error) {
    statusColor = 'bg-rose-400 shadow-[0_0_8px_#fb7185]';
    statusText = 'Hiba a lekérdezéskor';
  } else if (isStale) {
    statusColor = 'bg-amber-400 shadow-[0_0_8px_#fbbf24]';
    statusText = 'Az állomás régen mért';
  }


  return (
    <div
      className="max-w-3xl lg:max-w-6xl mx-auto px-4"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* --- PULL-TO-REFRESH INDIKÁTOR --- */}
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center overflow-hidden text-cyan2-300"
          style={{ height: pullDistance }}
        >
          <IoRefresh
            className="text-xl"
            style={{
              transform: `rotate(${pullDistance * 4}deg)`,
              opacity: Math.min(1, pullDistance / PULL_THRESHOLD)
            }}
          />
          <span className="ml-2 text-[11px] font-bold uppercase tracking-widest">
            {pullDistance > PULL_THRESHOLD ? 'Engedd el a frissítéshez' : 'Húzd le a frissítéshez'}
          </span>
        </div>
      )}

      {/* --- HERO: fotó/videó-vezérelt "úti-cél kártya" stílus, a kapott referencia alapján --- */}
      <FadeUp>
        <WeatherHero
          temp={temp}
          feels={feels}
          isNight={weather.isNight}
          timeOfDay={weather.timeOfDay}
          dateStr={dateStr}
          tempTrend={tempTrend}
          tempClicks={tempClicks}
          onTempClick={handleTempClick}
          videoCategory={videoCategory}
          wind={wind}
          windDir={windDir}
          hum={hum}
          tMin={tMin}
          tMax={tMax}
          sunInfo={sunInfo}
          condition={weather.condition}
          weatherLabel={weather.label}
          moon={moon}
        />
      </FadeUp>

      {/* --- STATUS / REFRESH ---
      Kikommentelve a user kérésére (2026-11-11): a "Kapcsolat stabil" jelző + Frissítés gomb
      szerinte senki nem használja/olvassa, és feleslegesen foglal helyet. Ne töröld, csak hagyd így!
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <div className="flex items-center gap-2.5 glass-card rounded-apple-inner px-3.5 py-2">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-xs font-bold text-white">{statusText}</span>
          {measureAgo && (
            <span className={`text-[11px] font-semibold ${isStale ? 'text-amber-300' : 'text-night-200/60'}`}>
              · mérve {measureAgo}
            </span>
          )}
        </div>
        <button onClick={refresh} disabled={loading} className="btn-grad px-4 py-2 text-xs disabled:opacity-50">
          <IoRefresh className={`text-sm ${loading ? 'animate-spin' : ''}`} />
          Frissítés
        </button>
      </div>
      --- */}

      {/* Elavult adat figyelmeztetés */}
      {isStale && !error && (
        <div className="mt-3 p-3 rounded-apple-card bg-amber-400/10 border border-amber-400/25 text-amber-100 text-[11px] font-semibold flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" />
          <span>
            Az állomás legutóbb <strong className="font-extrabold">{measureAgo}</strong> küldött adatot – lehet, hogy átmenetileg kimaradt. Az értékek nem feltétlenül a pillanatnyi időjárást mutatják.
          </span>
        </div>
      )}

      {/* Nyers API hibaüzenet — kikommentelve a user kérésére (2026-11-11): sok helyet foglal,
      a usereknek amúgy sem releváns infó. Ne töröld, csak hagyd így!
      {error && (
        <div className="mt-4 p-4 rounded-apple-card bg-rose-400/10 border border-rose-400/25 text-rose-200 text-xs font-semibold flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>API hiba: {error}</span>
        </div>
      )}
      --- */}

      {/* --- TARTALOM-KAPCSOLÓ: Előrejelzés / Villámhírek / Mérések — igazi csúszka,
          a hangulat-színnel, kevésbé lekerekítve (apple-card/apple-inner koncentrikusan) --- */}
      <div className="mt-5 relative flex items-center gap-1 p-1 rounded-apple-card bg-white/[0.04] border border-white/10">
        {CONTENT_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="relative flex-1 py-2 rounded-apple-inner text-xs font-bold transition-colors"
            style={{ color: activeTab === t.key ? (mood.enabled ? mood.textOnAccent : '#0a0f14') : 'rgba(255,255,255,0.55)' }}
          >
            {activeTab === t.key && (
              <motion.span
                layoutId="dashboard-tab-pill"
                className="absolute inset-0 rounded-apple-inner"
                style={{
                  background: mood.enabled
                    ? `linear-gradient(135deg, ${mood.from}, ${mood.to})`
                    : '#ffffff',
                }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>

      {/* --- KAPCSOLÓ ALATTI CSEMPE: csak a kiválasztott lap tartalma látszik --- */}
      <FadeUp key={activeTab} delay={0.02}>
        <div className="mt-3">

          {activeTab === 'forecast' && (
            <div id="dashboard-forecast" className="relative glass-card rounded-apple-outer p-6 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-cyan2-500/10 blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4 select-none cursor-default">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2.5">
                  <span
                    className="relative w-10 h-10 rounded-apple-inner flex items-center justify-center shrink-0"
                    style={{
                      background: mood.enabled
                        ? `linear-gradient(135deg, ${mood.from}, ${mood.to})`
                        : 'linear-gradient(135deg, #0284c7, #06b6d4)',
                    }}
                  >
                    {CONDITION_ICONS[weather.condition] ? (
                      <img src={CONDITION_ICONS[weather.condition]} alt="" className="w-7 h-7" />
                    ) : (
                      <Calendar className="w-4 h-4 text-white" />
                    )}
                  </span>
                  <span>Előrejelzés az Alpokaljára</span>
                </h2>
              </div>

              <div className="space-y-3 relative z-10">
                <h3
                  className="text-base font-extrabold leading-snug"
                  style={{ color: mood.enabled ? mood.from : '#fff' }}
                >
                  {forecastData.title}
                </h3>

                <p className="text-[10px] font-bold text-night-200/50 uppercase tracking-wide">
                  Készítette: Ráduly László · Frissítve: {new Date(forecastData.updated_at).toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>

                <div className="h-px bg-white/5 my-2.5" />

                <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap font-medium">
                  {forecastData.content}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'news' && (
            activeNewsBlurbs.length > 0 ? (
              <div className="space-y-3">
                {activeNewsBlurbs.map(b => (
                  <div key={b.id} className="relative glass-card rounded-apple-card p-4">
                    <div className="min-w-0 space-y-1.5">
                      <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap font-medium">{b.content}</p>
                      {b.image_url && (
                        <div
                          className="mt-1 rounded-apple-inner overflow-hidden border border-white/10 bg-black/25 cursor-zoom-in max-w-md"
                          onClick={() => setBlurbZoom(b.image_url)}
                        >
                          <img
                            src={b.image_url}
                            alt="Hírmorzsa kép"
                            loading="lazy"
                            className="w-full h-auto max-h-72 object-cover active:scale-[0.99] transition-transform"
                          />
                        </div>
                      )}
                      <p className="text-[10px] font-bold text-night-200/45 uppercase tracking-wide">
                        Ráduly László · {new Date(b.created_at).toLocaleString('hu-HU', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-apple-outer p-6 text-center text-sm text-night-200/50 font-semibold">
                Jelenleg nincs aktív villámhír.
              </div>
            )
          )}

          {activeTab === 'measurements' && (
            <div className="space-y-5">
              <div>
                <SectionLabel>Részletes mérések</SectionLabel>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <UvCard tile />
                  {STAT_CARDS_CONFIG.map(cfg => (
                    <StatCard
                      key={cfg.key}
                      config={cfg}
                      val={lastMeasure[cfg.key]}
                      onClick={chartableKeys.has(cfg.key) ? () => setActiveKey(cfg.key) : undefined}
                      windClicks={cfg.key === 'FF' ? windClicks : undefined}
                      onIconClick={cfg.key === 'FF' ? handleWindIconClick : undefined}
                      className={cfg.key === 'T' ? 'col-span-2' : undefined}
                    />
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>24 órás előzmények</SectionLabel>
                <div className="mb-3 p-3.5 rounded-apple-card bg-cyan2-400/[0.07] border border-cyan2-400/15 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-cyan2-300 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-night-100/80 leading-relaxed">
                    <p>
                      Az állomás szervere <strong className="font-bold text-white">nem mindig küld folyamatos adatot</strong>, ezért egy-egy grafikon átmenetileg üres lehet. Ilyenkor húzd le a képernyő tetejéről az oldalt az újratöltéshez.
                    </p>
                    {historySource && (
                      <p className="mt-1.5 text-[10px] text-night-200/60 font-semibold tracking-wide uppercase flex items-center gap-1.5">
                        <span>Aktuális diagram adatok forrása:</span>
                        <span className="px-2 py-0.5 rounded-full bg-cyan2-400/10 border border-cyan2-400/20 text-cyan2-200 font-extrabold text-[9px]">
                          {historySource === 'smartmixin' && 'smartmixin'}
                          {historySource === 'metnet' && 'metnet'}
                          {historySource === 'open-meteo' && 'nem saját forrás: Open-meteo'}
                        </span>
                      </p>
                    )}
                  </div>
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
              </div>
            </div>
          )}

        </div>
      </FadeUp>

      {/* --- TÁMOGATÓK: egy csempében, a footer fölött --- */}
      <FadeUp delay={0.04}>
        <div className="mt-5">
          <SponsorTile sponsors={sponsors} />
        </div>
      </FadeUp>

      <StatDetailModal
        metric={activeMetric}
        timestamps={activeKey ? (chartSeries[activeKey]?.labels || []) : []}
        data={activeKey ? (chartSeries[activeKey]?.data || []) : []}
        currentValue={activeKey ? lastMeasure[activeKey] : null}
        onClose={() => setActiveKey(null)}
      />

      {/* --- HÍRMORZSA NAGYKÉP (portál a body-ba) --- */}
      {createPortal(
        <AnimatePresence>
          {blurbZoom && (
            <div
              className="fixed inset-0 z-[400] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
              onClick={() => setBlurbZoom(null)}
            >
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setBlurbZoom(null)}
                aria-label="Bezárás"
                className="absolute top-5 right-5 w-12 h-12 rounded-full bg-black/70 hover:bg-rose-500 border-2 border-white/40 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all active:scale-90 z-[60]"
              >
                <X className="w-7 h-7" />
              </motion.button>
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                src={blurbZoom}
                alt="Hírmorzsa kép nagyítva"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl relative z-10"
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* --- FORECAST ADMIN MODAL --- */}
      <AnimatePresence>
        {showAdmin && (
          <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }} transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-md"
              onClick={() => setShowAdmin(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 24, scale: 0.96, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
              transition={{ type: 'spring', stiffness: 440, damping: 34, mass: 0.7 }}
              className="relative w-full max-w-lg bg-night-800 rounded-apple-outer p-6 flex flex-col gap-4 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-apple-inner bg-brand-gradient flex items-center justify-center text-white"><Calendar className="w-4 h-4" /></span>
                  <span>Jelentés Módosítása (Laci)</span>
                </h3>
                <button 
                  onClick={() => setShowAdmin(false)} 
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Push subscriber counter */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-apple-inner bg-white/[0.04] border border-white/10">
                <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-white/80">Feliratkozott eszközök:</span>
                <span className="text-xs font-extrabold text-emerald-300 ml-auto">
                  {pushSubCount === null ? '…' : pushSubCount.toLocaleString('hu-HU')}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-night-200/50 uppercase tracking-widest mb-1.5 block">Jelentés címe</label>
                  <input
                    type="text"
                    value={adminTitle}
                    onChange={e => setAdminTitle(e.target.value.slice(0, 80))}
                    placeholder="Pl.: Lassú felmelegedés és záporok..."
                    className="w-full px-4 py-3 rounded-apple-inner border border-white/10 bg-white/[0.04] text-white text-sm font-semibold placeholder:text-night-200/35 focus:outline-none focus:ring-2 focus:ring-cyan2-400/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-night-200/50 uppercase tracking-widest mb-1.5 block">Jelentés részletei</label>
                  <textarea
                    rows={12}
                    value={adminContent}
                    onChange={e => setAdminContent(e.target.value)}
                    placeholder="Másold be ide a Facebook poszt szövegét..."
                    className="w-full px-4 py-3 rounded-apple-inner border border-white/10 bg-white/[0.04] text-white text-sm font-semibold placeholder:text-night-200/35 focus:outline-none focus:ring-2 focus:ring-cyan2-400/50 resize-y leading-relaxed"
                  />
                </div>

                <div className="h-px bg-white/5 my-1" />

                {/* Announcement fields */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-night-200/50 uppercase tracking-widest block">Sürgős Értesítés (pl. Viharjelzés)</label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-white">
                      <input
                        type="checkbox"
                        checked={adminAnnActive}
                        onChange={e => setAdminAnnActive(e.target.checked)}
                        className="rounded border-white/10 bg-white/[0.04] text-cyan2-500 focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <span>Aktív</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={adminAnnText}
                    onChange={e => setAdminAnnText(e.target.value.slice(0, 200))}
                    placeholder="Pl.: Viharjelzés! Erős széllökések várhatók..."
                    className="w-full px-4 py-3 rounded-apple-inner border border-white/10 bg-white/[0.04] text-white text-sm font-semibold placeholder:text-night-200/35 focus:outline-none focus:ring-2 focus:ring-cyan2-400/50"
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

              {/* --- HÍRMORZSÁK KEZELÉSE --- */}
              <div className="h-px bg-white/5" />
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold text-night-200/50 uppercase tracking-widest flex items-center gap-1.5">
                  <Newspaper className="w-3.5 h-3.5 text-cyan2-300" /> Villámhírek
                </label>
                <textarea
                  rows={2}
                  value={newBlurb}
                  onChange={e => setNewBlurb(e.target.value)}
                  placeholder="Pl.: 2026 első trópusi éjszakája Kőszegen – a minimum 21,2 °C volt..."
                  className="w-full px-4 py-3 rounded-apple-inner border border-white/10 bg-white/[0.04] text-white text-sm font-semibold placeholder:text-night-200/35 focus:outline-none focus:ring-2 focus:ring-cyan2-400/50 resize-none leading-relaxed"
                />

                {/* Kép feltöltése az új hírhez */}
                <input type="file" accept="image/*" onChange={handleNewBlurbFile} className="hidden" id="news-blurb-file" />
                {newBlurbPreview ? (
                  <div className="relative w-full h-24 rounded-apple-inner overflow-hidden border border-white/10 bg-black/20 flex items-center justify-center">
                    <img src={newBlurbPreview} alt="Előnézet" className="h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => { setNewBlurbFile(null); setNewBlurbPreview(null); }}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-md"
                      title="Kép eltávolítása"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="news-blurb-file" className="flex items-center justify-center gap-2 p-3 rounded-apple-inner border border-dashed border-white/20 hover:border-cyan2-400/40 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer text-xs font-bold text-white transition-all">
                    <ImageIcon className="w-4 h-4 text-cyan2-300" /> Kép hozzáadása (opcionális)
                  </label>
                )}

                <button
                  onClick={handleAddBlurb}
                  disabled={blurbBusy || !newBlurb.trim()}
                  className="btn-grad w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> {blurbBusy ? 'Mentés...' : 'Villámhír hozzáadása'}
                </button>

                {activeNewsBlurbs.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {activeNewsBlurbs.map(b => (
                      <div key={b.id} className="p-2.5 rounded-apple-card bg-white/[0.03] border border-white/5">
                        {editBlurbId === b.id ? (
                          <div className="space-y-2">
                            <textarea
                              rows={3}
                              value={editBlurbText}
                              onChange={e => setEditBlurbText(e.target.value)}
                              className="w-full px-3 py-2 rounded-apple-inner border border-cyan2-400/40 bg-white/[0.04] text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan2-400/50 resize-none leading-relaxed"
                            />

                            {/* Kép szerkesztése */}
                            <input type="file" accept="image/*" onChange={handleEditBlurbFile} className="hidden" id={`news-edit-file-${b.id}`} />
                            {editBlurbPreview ? (
                              <div className="relative w-full h-24 rounded-apple-inner overflow-hidden border border-white/10 bg-black/20 flex items-center justify-center">
                                <img src={editBlurbPreview} alt="Előnézet" className="h-full object-contain" />
                                <button
                                  type="button"
                                  onClick={handleRemoveEditBlurbImage}
                                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-md"
                                  title="Kép eltávolítása"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <label htmlFor={`news-edit-file-${b.id}`} className="flex items-center justify-center gap-2 p-2.5 rounded-apple-inner border border-dashed border-white/20 hover:border-cyan2-400/40 bg-white/[0.02] cursor-pointer text-[11px] font-bold text-white transition-all">
                                <ImageIcon className="w-3.5 h-3.5 text-cyan2-300" /> Kép hozzáadása
                              </label>
                            )}

                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleSaveEditBlurb}
                                disabled={blurbBusy || !editBlurbText.trim()}
                                className="btn-grad flex-1 py-2 text-[11px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" /> {blurbBusy ? 'Mentés...' : 'Mentés'}
                              </button>
                              <button
                                onClick={cancelEditBlurb}
                                disabled={blurbBusy}
                                className="px-3 py-2 rounded-apple-inner bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-colors disabled:opacity-50"
                              >
                                Mégse
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <p className="flex-1 text-xs text-night-100/80 leading-relaxed whitespace-pre-wrap min-w-0">{b.content}</p>
                            <button
                              onClick={() => startEditBlurb(b)}
                              disabled={blurbBusy}
                              className="shrink-0 w-7 h-7 rounded-apple-inner bg-white/10 hover:bg-cyan2-500/30 text-white flex items-center justify-center transition-colors disabled:opacity-50"
                              title="Villámhír szerkesztése"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBlurb(b.id)}
                              disabled={blurbBusy}
                              className="shrink-0 w-7 h-7 rounded-apple-inner bg-rose-500/80 hover:bg-rose-500 text-white flex items-center justify-center transition-colors disabled:opacity-50"
                              title="Villámhír törlése"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* --- TIPPELDE KIÉRTÉKELÉSE --- */}
                <div className="h-px bg-white/5 my-2" />
                <div className="space-y-2.5">
                  <label className="text-[10px] font-bold text-night-200/50 uppercase tracking-widest flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" /> Tippek Kiértékelése
                  </label>

                  {pendingTips.length > 0 ? (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-apple-inner p-2.5 space-y-1.5 text-left">
                      <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider block">
                        Várakozó tippek lepontozásra ({pendingTips.reduce((acc, curr) => acc + curr.count, 0)} db):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {pendingTips.map(item => (
                          <button
                            key={item.date}
                            type="button"
                            onClick={() => setEvalDate(item.date)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all border ${
                              evalDate === item.date
                                ? 'bg-amber-400 text-night-900 border-amber-300 font-extrabold shadow-sm'
                                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                            }`}
                          >
                            📅 {item.date} ({item.count} tipp)
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-apple-inner p-2 text-left">
                      <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Minden leadott tipp ki van értékelve!
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div>
                      <label className="text-[8px] text-night-200/50 uppercase font-bold tracking-wider mb-1 block">Dátum</label>
                      <input
                        type="date"
                        value={evalDate}
                        onChange={e => setEvalDate(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-apple-inner border border-white/10 bg-night-800 text-white text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] text-night-200/50 uppercase font-bold tracking-wider mb-1 block">Mért Max Hőm (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Pl.: 28.4"
                        value={evalTemp}
                        onChange={e => setEvalTemp(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-apple-inner border border-white/10 bg-white/[0.04] text-white text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                  {evalError && <p className="text-[11px] text-rose-300 font-extrabold text-left">{evalError}</p>}
                  {evalSuccess && <p className="text-[11px] text-emerald-300 font-extrabold text-left">{evalSuccess}</p>}
                  <button
                    onClick={handleEvaluate}
                    disabled={evalBusy || !evalTemp}
                    className="btn-grad w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{evalBusy ? 'Feldolgozás...' : 'Tippek Lezárása és Pontozás'}</span>
                  </button>
                </div>

              </div>
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
