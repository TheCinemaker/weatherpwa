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

function parseMetNetHtml(html) {
  const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;

  const rows = [];
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const rowContent = match[1];
    if (rowContent.includes('table2') || rowContent.includes('table3')) {
      const cells = [];
      let cellMatch;
      cellRegex.lastIndex = 0;
      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        cells.push(cellMatch[1].trim());
      }
      if (cells.length >= 8) {
        rows.push(cells);
      }
    }
  }

  function parseBudapestDate(str) {
    const parts = str.match(/(\d+)/g);
    if (!parts) return null;
    const [y, m, d, hr, min, sec] = parts.map(Number);
    const testDate = new Date(Date.UTC(y, m - 1, d, hr, min, sec));
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Budapest',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      });
      const formatted = formatter.format(testDate);
      const fParts = formatted.match(/(\d+)/g);
      if (fParts) {
        const [fMonth, fDay, fYear, fHr, fMin, fSec] = fParts.map(Number);
        const formattedUtc = Date.UTC(fYear, fMonth - 1, fDay, fHr, fMin, fSec);
        const diffMs = testDate.getTime() - formattedUtc;
        return Math.floor((Date.UTC(y, m - 1, d, hr, min, sec) + diffMs) / 1000);
      }
    } catch (e) {}
    const isSummer = (m > 3 && m < 11);
    const offsetHours = isSummer ? 2 : 1;
    return Math.floor((Date.UTC(y, m - 1, d, hr, min, sec) - offsetHours * 3600000) / 1000);
  }

  function parseTemp(str) {
    const clean = str.replace(/<[^>]*>/g, '').replace('°C', '').trim();
    return isNaN(parseFloat(clean)) ? null : parseFloat(clean);
  }

  function parseHumidity(str) {
    const clean = str.replace('%', '').trim();
    return isNaN(parseFloat(clean)) ? null : parseFloat(clean);
  }

  function parseWindSpeed(str) {
    const parts = str.split('/');
    if (parts.length < 2) return null;
    const speedPart = parts[1].replace('km/h', '').trim();
    return isNaN(parseFloat(speedPart)) ? null : parseFloat(speedPart);
  }

  function parsePressure(str) {
    const clean = str.replace('hPa', '').trim();
    return isNaN(parseFloat(clean)) ? null : parseFloat(clean);
  }

  function parsePrecipitation(str) {
    const clean = str.replace('mm', '').trim();
    return isNaN(parseFloat(clean)) ? null : parseFloat(clean);
  }

  function calculateHeatIndex(T, rh, WS_kmh) {
    if (T === null || rh === null) return null;
    const ws = (WS_kmh || 0) / 3.6;
    const e = (rh / 100) * 6.105 * Math.exp((17.27 * T) / (237.7 + T));
    const AT = T + 0.33 * e - 0.7 * ws - 4.0;
    return Math.round(AT * 10) / 10;
  }

  function calculateHumidex(T, rh) {
    if (T === null || rh === null) return null;
    const e = 6.112 * Math.pow(10, (7.5 * T) / (237.7 + T)) * (rh / 100);
    const h = T + (5 / 9) * (e - 10);
    return Math.round(h * 10) / 10;
  }

  const reversedRows = rows.reverse();
  const timestamps = [];
  const T_arr = [];
  const U_arr = [];
  const FF_arr = [];
  const FXY_arr = [];
  const SLP_arr = [];
  const RR_1H_arr = [];
  const HEAT_INDEX_arr = [];
  const HUMIDEX_arr = [];

  for (const r of reversedRows) {
    const ts = parseBudapestDate(r[0]);
    if (!ts) continue;

    const T = parseTemp(r[1]);
    const U = parseHumidity(r[3]);
    const FF = parseWindSpeed(r[4]);
    const SLP = parsePressure(r[5]);
    const RR_1H = parsePrecipitation(r[6]);
    const HEAT_INDEX = calculateHeatIndex(T, U, FF);
    const HUMIDEX = calculateHumidex(T, U);

    timestamps.push(ts);
    T_arr.push(T);
    U_arr.push(U);
    FF_arr.push(FF);
    FXY_arr.push(FF);
    SLP_arr.push(SLP);
    RR_1H_arr.push(RR_1H);
    HEAT_INDEX_arr.push(HEAT_INDEX);
    HUMIDEX_arr.push(HUMIDEX);
  }

  return {
    T: { ts: timestamps, data: T_arr },
    U: { ts: timestamps, data: U_arr },
    FF: { ts: timestamps, data: FF_arr },
    FXY: { ts: timestamps, data: FXY_arr },
    SLP: { ts: timestamps, data: SLP_arr },
    RR_1H: { ts: timestamps, data: RR_1H_arr },
    HEAT_INDEX: { ts: timestamps, data: HEAT_INDEX_arr },
    HUMIDEX: { ts: timestamps, data: HUMIDEX_arr }
  };
}

export default function useWeatherData() {
  const [currentData, setCurrentData] = useState(null);
  const [historySeries, setHistorySeries] = useState({}); // { [metrika]: { ts:[], data:[] } }
  const [historySource, setHistorySource] = useState(null); // 'smartmixin', 'metnet', 'open-meteo'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [lastMeasureAt, setLastMeasureAt] = useState(null); // az állomás tényleges mérési ideje (unix mp)

  const fetchCurrent = useCallback(async () => {
    const res = await fetch(`${CURRENT_URL}&_=${Date.now()}`, { 
      headers: CURRENT_HEADERS, 
      cache: 'no-store',
      signal: AbortSignal.timeout(4000)
    });
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
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) throw new Error(`Előzmény API hiba: ${res.status}`);
    const json = await res.json();
    return Array.isArray(json) && hasPoints(json[0]) ? json[0] : null;
  }, []);

  const fetchMetNetHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/fetch-metnet', { signal: AbortSignal.timeout(4000) });
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
      console.warn("Szerveroldali MetNet API nem elérhető, próbálkozás kliensoldali proxyval...", e);
      try {
        const targetUrl = 'https://www.metnet.hu/online-allomasok?sub=showosdata&ostid=1155';
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        const proxyRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
        if (!proxyRes.ok) throw new Error(`CORS proxy hiba: ${proxyRes.status}`);
        const html = await proxyRes.text();
        const parsed = parseMetNetHtml(html);
        
        const out = {};
        for (const k of METRICS) {
          const series = parsed[k];
          if (series && Array.isArray(series.ts) && Array.isArray(series.data)) {
            const trimmed = trimSeries(series.ts, series.data, DISPLAY_HOURS);
            if (countNonNull(trimmed.data) > 0) {
              out[k] = trimmed;
            }
          }
        }
        return Object.keys(out).length ? out : null;
      } catch (proxyError) {
        console.error("Kliensoldali MetNet lekérési hiba:", proxyError);
        return null;
      }
    }
  }, []);

  const fetchOpenMeteoHistory = useCallback(async () => {
    try {
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=47.3971&longitude=16.5460&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,pressure_msl,precipitation,apparent_temperature&past_days=2&forecast_days=1&timezone=Europe%2FBerlin';
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
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

  const loadAll = useCallback(async (forcedInput = false) => {
    const forced = forcedInput === true || (forcedInput && typeof forcedInput === 'object');
    setLoading(true);
    setError(null);
    try {
      // 1. Attempt to fetch unified weather data from our server-side cached proxy
      const apiQuery = forced ? `?_=${Date.now()}` : '';
      const res = await fetch(`/api/weather-data${apiQuery}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.current) {
          setCurrentData(json.current);
          setHistorySeries(json.history || {});
          setHistorySource(json.source || null);
          const now = new Date();
          setLastUpdate(now.toLocaleTimeString('hu-HU', { timeZone: 'Europe/Budapest' }));
          if (json.current.last_measure_at) {
            setLastMeasureAt(json.current.last_measure_at);
          }
          return true;
        }
      }
      throw new Error(`Szerveroldali API hiba vagy érvénytelen válasz.`);
    } catch (e) {
      console.warn("Szerveroldali API sikertelen, próbálkozás kliensoldali lekérésekkel...", e);
      
      // Fallback: Client-side direct fetches
      try {
        const current = await fetchCurrent().catch(err => {
          setError(prev => prev ? `${prev} | ${err.message}` : err.message);
          return null;
        });

        let history = await fetchHistory().catch(err => {
          console.error("Előzmény lekérési hiba:", err);
          return null;
        });

        // Check if SmartMixin history is missing or incomplete
        const isSmartMixinOk = history && history.T && Object.keys(history).length > 0;

        if (!isSmartMixinOk) {
          console.log("SmartMixin előzmény hiányzik vagy hiányos, MetNet backup lekérése...");
          const metnetHistory = await fetchMetNetHistory();
          
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
            setHistorySource('metnet');
          } else {
            console.log("MetNet előzmény nem elérhető vagy elavult (offline állomás). Open-Meteo fallback lekérése...");
            const openMeteoHistory = await fetchOpenMeteoHistory();
            if (openMeteoHistory) {
              console.log("Open-Meteo modell alapú fallback sikeres.");
              history = openMeteoHistory;
              setHistorySource('open-meteo');
            } else {
              setHistorySource(null);
            }
          }
        } else {
          setHistorySource('smartmixin');
        }

        if (current) {
          setCurrentData(current);
          const now = new Date();
          setLastUpdate(now.toLocaleTimeString('hu-HU', { timeZone: 'Europe/Budapest' }));
          if (typeof current.last_measure_at === 'number') {
            setLastMeasureAt(current.last_measure_at);
          }
        }

        if (history) {
          setHistorySeries(prev => ({ ...prev, ...history }));
        }
        return !!history;
      } catch (clientErr) {
        console.error("Kliensoldali lekérési hiba:", clientErr);
        setError(clientErr.message);
        return false;
      }
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
    historySource,
    loading,
    error,
    lastUpdate,
    lastMeasureAt,
    refresh: loadAll
  };
}
