import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentSky } from '../api/weather';

const WeatherMoodContext = createContext(null);
const STORAGE_KEY = 'weatherMoodEnabled';

// Folytonos hőmérséklet-szín skála (-15°C fehéres jégkéktől +40°C mélyvörösig),
// tizedfokonkénti interpolációval, zöld árnyalat NÉLKÜL (a kék -> meleg átmenet
// ezüstös-levendulán és barack-aranyon át vezet, így sosem keveredik ki zöld).
const TEMP_STOPS = [
  [-15, [224, 242, 254]], // #e0f2fe — vakító fehéres jégkék
  [-5,  [125, 211, 252]], // #7dd3fc — sarkvidéki jégkék
  [0,   [56,  189, 248]], // #38bdf8 — fagyos égkék
  [5,   [59,  130, 246]], // #3b82f6 — hűvös acélkék
  [10,  [96,  165, 250]], // #60a5fa — friss őszi/tavaszi világoskék (11°C -> #72acfc)
  [14,  [165, 180, 252]], // #a5b4fc — enyhe ezüstös-azúr
  [17,  [253, 186, 116]], // #fdba74 — lágy barack-arany (kellemes átmeneti idő)
  [21,  [251, 191, 36]],  // #fbbf24 — meleg napsárga / arany
  [26,  [251, 146, 60]],  // #fb923c — nyári narancs
  [31,  [234, 88,  12]],  // #ea580c — forró narancsvörös
  [36,  [220, 38,  38]],  // #dc2626 — kánikula-vörös
  [40,  [185, 28,  28]],  // #b91c1c — izzó mélyvörös
];

function lerp(a, b, f) { return a + (b - a) * f; }

function tempToRgb(t) {
  const min = TEMP_STOPS[0][0], max = TEMP_STOPS[TEMP_STOPS.length - 1][0];
  const c = Math.max(min, Math.min(max, t));
  for (let i = 0; i < TEMP_STOPS.length - 1; i++) {
    const [t0, c0] = TEMP_STOPS[i];
    const [t1, c1] = TEMP_STOPS[i + 1];
    if (c >= t0 && c <= t1) {
      const f = (c - t0) / (t1 - t0);
      return [0, 1, 2].map(i => Math.round(lerp(c0[i], c1[i], f)));
    }
  }
  return TEMP_STOPS[TEMP_STOPS.length - 1][1];
}

function mix(c1, c2, ratio) {
  return [0, 1, 2].map(i => Math.round(c1[i] * (1 - ratio) + c2[i] * ratio));
}

function darken(c, factor = 0.5) {
  return c.map(v => Math.round(v * factor));
}

function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

// YIQ-fényerő: a világos hangulat-színek (pl. jégkék, meleg arany) mellett
// sötét szöveg kell, a sötétek/élénkek (indigó, mélyvörös) mellett fehér —
// ez a segédfüggvény bárhol bevethető, ahol egy UI-elem a TELJES erősségű
// hangulat-színt kapja háttérként (nem csak egy áttetsző derengésként).
function contrastText([r, g, b]) {
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155 ? '#1a1a1a' : '#ffffff';
}

function buildPalette(rgb) {
  const dark = darken(rgb, 0.5);
  return {
    from: rgbToHex(rgb),
    to: rgbToHex(dark),
    glow1: `rgba(${rgb.join(',')},0.30)`,
    glow2: `rgba(${dark.join(',')},0.25)`,
    glow3: `rgba(${rgb.join(',')},0.15)`,
    textOnAccent: contrastText(rgb),
  };
}

const TINT_NIGHT = [79, 70, 229];   // indigó
const TINT_FOG = [100, 116, 139];   // ezüstös szürke
const TINT_SNOW = [226, 232, 240];  // fehéres-jeges
const TINT_RAIN = [14, 165, 233];   // hideg kék

// Közepes erősségű, de érezhető hangulat-paletta: az accent-szín (gombok,
// pill-ek), a háttér ambient-glow-k ÉS a kártyák is ebből a közös forrásból
// jönnek. A hőmérséklet adja a folytonos alapszínt, a pillanatnyi időjárás
// (éjszaka/köd/hó/eső) pedig egy rétegként tovább árnyalja — nem cseréli le
// teljesen (pl. egy forró, esős nap meleg narancs alapon hideg kékes eső-
// árnyalatot kap, nem vált át sima szürke-kékre).
function computeMood({ temperature, isNight, foggy, snowy, rainy }) {
  const t = temperature;
  let base = t != null ? tempToRgb(t) : [6, 182, 212];
  let label = t == null ? 'Alap'
    : t >= 28 ? 'Kánikula'
    : t >= 20 ? 'Meleg'
    : t <= -10 ? 'Mocskos hideg'
    : t <= 0 ? 'Fagy'
    : 'Mérsékelt';

  if (isNight) {
    base = mix(base, TINT_NIGHT, 0.55);
    label += ' · éjszaka';
  } else if (foggy) {
    base = mix(base, TINT_FOG, 0.5);
    label = 'Ködös';
  } else if (snowy) {
    base = mix(base, TINT_SNOW, 0.45);
    label = 'Havazás';
  } else if (rainy) {
    base = mix(base, TINT_RAIN, 0.45);
    label += ' · esős';
  }

  return { label, ...buildPalette(base) };
}

export function WeatherMoodProvider({ children }) {
  const [sky, setSky] = useState(null);
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) !== 'false'; } catch { return true; }
  });

  useEffect(() => {
    let cancelled = false;
    const load = () => fetchCurrentSky().then(s => { if (!cancelled && s) setSky(s); });
    load();
    const timer = setInterval(load, 15 * 60 * 1000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(enabled)); } catch { /* privát mód stb. */ }
  }, [enabled]);

  const mood = useMemo(() => {
    const code = sky?.weathercode;
    return computeMood({
      temperature: sky?.temperature ?? null,
      isNight: sky?.isNight ?? false,
      foggy: code === 45 || code === 48,
      snowy: code != null && ((code >= 71 && code <= 77) || code === 85 || code === 86),
      rainy: code != null && ((code >= 51 && code <= 67) || (code >= 80 && code <= 99)),
    });
  }, [sky]);

  const value = useMemo(() => ({ ...mood, enabled, setEnabled }), [mood, enabled]);

  return (
    <WeatherMoodContext.Provider value={value}>
      {children}
    </WeatherMoodContext.Provider>
  );
}

export function useWeatherMood() {
  const ctx = useContext(WeatherMoodContext);
  if (!ctx) throw new Error('useWeatherMood must be used within a WeatherMoodProvider');
  return ctx;
}
