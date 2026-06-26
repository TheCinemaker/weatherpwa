import { useState, useEffect, useCallback } from 'react';

const STATION_ID = 72461;
const API_BASE = 'https://api2.smartmixin.io';
const CURRENT_URL = `${API_BASE}/api/stations/${STATION_ID}/?refresh=1`;
const HISTORY_URL = `${API_BASE}/api/measures/`;

const CURRENT_HEADERS = {
  'Accept': 'application/json',
  'X-SmartMixin-Context': 'UI'
};
const HISTORY_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-SmartMixin-Context': 'UI'
};

// A smartmixin API kiszámíthatatlan: ugyanarra a kérésre időnként üres tömböt ad,
// és ABLAKONKÉNT/METRIKÁNKÉNT is inkonzisztens — pl. egyszer a 24h adja a hőmérsékletet
// és a 48h nem, máskor fordítva. Ezért több ablakot kérünk le párhuzamosan, és
// metrikánként azt választjuk, amelyikben tényleg van adat. Plusz metrikánkénti
// utolsó-jó cache: egy hiányos válasz nem üríti ki a már működő grafikont.
const METRICS = ['T', 'U', 'FF', 'FXY', 'SLP', 'RR_1H', 'HEAT_INDEX', 'HUMIDEX'];
const WINDOW_HOURS = [24, 48]; // párhuzamosan lekért ablakok
const DISPLAY_HOURS = 24;      // ennyit jelenítünk meg

const hasPoints = (s) =>
  s && Array.isArray(s.timestamps) && s.timestamps.length > 0;

const countNonNull = (arr) => arr.reduce((n, v) => n + (v != null ? 1 : 0), 0);

// Egy metrika-sorozat levágása az utolsó `hours` órára
const trimSeries = (ts, data, hours) => {
  const cutoff = Math.floor(Date.now() / 1000) - hours * 3600;
  let i = 0;
  while (i < ts.length && ts[i] < cutoff) i++;
  return { ts: ts.slice(i), data: data.slice(i) };
};

export default function useWeatherData() {
  const [currentData, setCurrentData] = useState(null);
  const [historySeries, setHistorySeries] = useState({}); // { [metrika]: { ts:[], data:[] } }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [lastMeasureAt, setLastMeasureAt] = useState(null); // az állomás tényleges mérési ideje (unix mp)

  const fetchCurrent = useCallback(async () => {
    const res = await fetch(`${CURRENT_URL}&_=${Date.now()}`, { headers: CURRENT_HEADERS, cache: 'no-store' });
    if (!res.ok) throw new Error(`Aktuális API hiba: ${res.status}`);
    return res.json();
  }, []);

  // Egyetlen ablak lekérése → { timestamps, results } vagy null
  const fetchWindow = useCallback(async (hours) => {
    const now = Math.floor(Date.now() / 1000);
    const body = {
      series: [{
        station: STATION_ID,
        metrics: METRICS,
        scale: 'max',
        start: now - hours * 3600,
        end: now,
        sharp: true
      }]
    };
    const res = await fetch(HISTORY_URL, {
      method: 'POST',
      headers: HISTORY_HEADERS,
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Előzmény API hiba: ${res.status}`);
    const json = await res.json();
    return Array.isArray(json) && hasPoints(json[0]) ? json[0] : null;
  }, []);

  const fetchMetNetHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/fetch-metnet');
      if (!res.ok) throw new Error(`MetNet hiba: ${res.status}`);
      const data = await res.json();
      
      const out = {};
      for (const k of METRICS) {
        const series = data[k];
        if (series && Array.isArray(series.ts) && Array.isArray(series.data)) {
          const trimmed = trimSeries(series.ts, series.data, DISPLAY_HOURS);
          if (countNonNull(trimmed.data) > 0) {
            out[k] = trimmed;
          }
        }
      }
      return Object.keys(out).length ? out : null;
    } catch (e) {
      console.error("MetNet előzmény lekérési hiba:", e);
      return null;
    }
  }, []);

  const fetchOpenMeteoHistory = useCallback(async () => {
    try {
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=47.3971&longitude=16.5460&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,pressure_msl,precipitation,apparent_temperature&past_days=2&forecast_days=1&timezone=Europe%2FBerlin';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Open-Meteo hiba: ${res.status}`);
      const json = await res.json();

      const hourly = json.hourly;
      if (!hourly || !Array.isArray(hourly.time)) return null;

      const utcOffset = json.utc_offset_seconds || 0;
      const rawTimestamps = hourly.time.map(timeStr => {
        return Math.floor(new Date(timeStr + 'Z').getTime() / 1000) - utcOffset;
      });

      const rawData = {
        T: hourly.temperature_2m,
        U: hourly.relative_humidity_2m,
        FF: hourly.wind_speed_10m,
        FXY: hourly.wind_gusts_10m,
        SLP: hourly.pressure_msl,
        RR_1H: hourly.precipitation,
        HEAT_INDEX: hourly.apparent_temperature,
        HUMIDEX: hourly.temperature_2m.map((t, idx) => {
          const rh = hourly.relative_humidity_2m[idx];
          if (t === null || t === undefined || rh === null || rh === undefined) return null;
          const e = 6.112 * Math.pow(10, (7.5 * t) / (237.7 + t)) * (rh / 100);
          return t + (5 / 9) * (e - 10);
        })
      };

      const out = {};
      for (const k of METRICS) {
        const arr = rawData[k];
        if (!Array.isArray(arr)) continue;
        const trimmed = trimSeries(rawTimestamps, arr, DISPLAY_HOURS);
        if (countNonNull(trimmed.data) > 0) {
          out[k] = trimmed;
        }
      }
      return Object.keys(out).length ? out : null;
    } catch (e) {
      console.error("Open-Meteo előzmény lekérési hiba:", e);
      return null;
    }
  }, []);

  // Több ablakot lekér, és metrikánként a legtöbb (utolsó 24h-s) adattal rendelkezőt választja.
  const fetchHistory = useCallback(async () => {
    const windows = (await Promise.all(
      WINDOW_HOURS.map(h => fetchWindow(h).catch(() => null))
    )).filter(Boolean);
    if (!windows.length) return null;

    const out = {};
    for (const k of METRICS) {
      let best = null;
      let bestCount = 0;
      for (const w of windows) {
        const arr = w.results?.[k];
        if (!Array.isArray(arr)) continue;
        const trimmed = trimSeries(w.timestamps, arr, DISPLAY_HOURS);
        const count = countNonNull(trimmed.data);
        if (count > bestCount) { bestCount = count; best = trimmed; }
      }
      if (best && bestCount > 0) out[k] = best;
    }
    return Object.keys(out).length ? out : null;
  }, [fetchWindow]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both. If history fails, we still want to show current weather.
      const current = await fetchCurrent().catch(e => {
        setError(prev => prev ? `${prev} | ${e.message}` : e.message);
        return null;
      });

      let history = await fetchHistory().catch(e => {
        console.error("Előzmény lekérési hiba:", e);
        return null;
      });

      // Check if SmartMixin history is missing or incomplete
      const isSmartMixinOk = history && history.T && Object.keys(history).length > 0;

      if (!isSmartMixinOk) {
        console.log("SmartMixin előzmény hiányzik vagy hiányos, MetNet backup lekérése...");
        const metnetHistory = await fetchMetNetHistory();
        
        // Check if MetNet data is present and fresh (last data point is less than 4 hours old)
        let isMetNetFresh = false;
        if (metnetHistory && metnetHistory.T && metnetHistory.T.ts.length > 0) {
          const lastTs = metnetHistory.T.ts[metnetHistory.T.ts.length - 1];
          const ageSec = Math.floor(Date.now() / 1000) - lastTs;
          if (ageSec < 4 * 3600) {
            isMetNetFresh = true;
          }
        }

        if (isMetNetFresh) {
          console.log("MetNet backup sikeres és friss.");
          history = metnetHistory;
        } else {
          console.log("MetNet előzmény nem elérhető vagy elavult (offline állomás). Open-Meteo fallback lekérése...");
          const openMeteoHistory = await fetchOpenMeteoHistory();
          if (openMeteoHistory) {
            console.log("Open-Meteo modell alapú fallback sikeres.");
            history = openMeteoHistory;
          }
        }
      }

      if (current) {
        setCurrentData(current);
        const now = new Date();
        setLastUpdate(now.toLocaleTimeString('hu-HU', { timeZone: 'Europe/Budapest' }));
        if (typeof current.last_measure_at === 'number') {
          setLastMeasureAt(current.last_measure_at);
        }
      }
      // Metrikánként frissítünk: a most megkapott metrikák új adatot kapnak,
      // a hiányzók megtartják az utolsó jó sorozatukat (nem ürül ki a grafikon).
      if (history) {
        setHistorySeries(prev => ({ ...prev, ...history }));
      }
      return !!history;
    } catch (e) {
      console.error(e);
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCurrent, fetchHistory, fetchMetNetHistory, fetchOpenMeteoHistory]);

  useEffect(() => {
    let cancelled = false;
    let quickTimer;
    // Induláskor: ha épp API-kimaradásba esünk és nincs még előzmény,
    // gyorsan (15 mp) újrapróbálunk pár alkalommal, mielőtt a normál ciklusra váltunk.
    const kickoff = async (tries = 0) => {
      const ok = await loadAll();
      if (!cancelled && !ok && tries < 5) {
        quickTimer = setTimeout(() => kickoff(tries + 1), 15000);
      }
    };
    kickoff();
    const timer = setInterval(loadAll, 300000); // 5m auto-refresh
    return () => {
      cancelled = true;
      clearTimeout(quickTimer);
      clearInterval(timer);
    };
  }, [loadAll]);

  return {
    currentData,
    historySeries,
    loading,
    error,
    lastUpdate,
    lastMeasureAt,
    refresh: loadAll
  };
}
