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

const METRICS = ['T', 'U', 'FF', 'FXY', 'SLP', 'RR_1H', 'HEAT_INDEX', 'HUMIDEX'];
const WINDOW_HOURS = [24, 48];
const DISPLAY_HOURS = 24;

const hasPoints = (s) =>
  s && Array.isArray(s.timestamps) && s.timestamps.length > 0;

const countNonNull = (arr) => arr.reduce((n, v) => n + (v != null ? 1 : 0), 0);

const trimSeries = (ts, data, hours) => {
  const cutoff = Math.floor(Date.now() / 1000) - hours * 3600;
  let i = 0;
  while (i < ts.length && ts[i] < cutoff) i++;
  return { ts: ts.slice(i), data: data.slice(i) };
};

// MetNet Scraper Parser
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

  function parseWindDirection(str) {
    const parts = str.split('/');
    if (parts.length === 0) return null;
    const degPart = parts[0].replace('°', '').trim();
    return isNaN(parseFloat(degPart)) ? null : parseFloat(degPart);
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
  const DP_arr = [];
  const U_arr = [];
  const FF_arr = [];
  const DD_arr = [];
  const FXY_arr = [];
  const SLP_arr = [];
  const RR_1H_arr = [];
  const RR_TODAY_arr = [];
  const HEAT_INDEX_arr = [];
  const HUMIDEX_arr = [];

  for (const r of reversedRows) {
    const ts = parseBudapestDate(r[0]);
    if (!ts) continue;

    const T = parseTemp(r[1]);
    const DP = parseTemp(r[2]);
    const U = parseHumidity(r[3]);
    const FF = parseWindSpeed(r[4]);
    const DD = parseWindDirection(r[4]);
    const SLP = parsePressure(r[5]);
    const RR_1H = parsePrecipitation(r[6]);
    const RR_TODAY = parsePrecipitation(r[7]);
    const HEAT_INDEX = calculateHeatIndex(T, U, FF);
    const HUMIDEX = calculateHumidex(T, U);

    timestamps.push(ts);
    T_arr.push(T);
    DP_arr.push(DP);
    U_arr.push(U);
    FF_arr.push(FF);
    DD_arr.push(DD);
    FXY_arr.push(FF);
    SLP_arr.push(SLP);
    RR_1H_arr.push(RR_1H);
    RR_TODAY_arr.push(RR_TODAY);
    HEAT_INDEX_arr.push(HEAT_INDEX);
    HUMIDEX_arr.push(HUMIDEX);
  }

  return {
    T: { ts: timestamps, data: T_arr },
    DP: { ts: timestamps, data: DP_arr },
    U: { ts: timestamps, data: U_arr },
    FF: { ts: timestamps, data: FF_arr },
    DD: { ts: timestamps, data: DD_arr },
    FXY: { ts: timestamps, data: FXY_arr },
    SLP: { ts: timestamps, data: SLP_arr },
    RR_1H: { ts: timestamps, data: RR_1H_arr },
    RR_TODAY: { ts: timestamps, data: RR_TODAY_arr },
    HEAT_INDEX: { ts: timestamps, data: HEAT_INDEX_arr },
    HUMIDEX: { ts: timestamps, data: HUMIDEX_arr }
  };
}

export async function handler(event, context) {
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  let currentData = null;
  let historySeries = null;
  let historySource = 'smartmixin';

  // 1. Fetch Current from SmartMixin
  try {
    const res = await fetch(`${CURRENT_URL}&_=${Date.now()}`, { headers: CURRENT_HEADERS });
    if (res.ok) {
      currentData = await res.json();
    }
  } catch (e) {
    console.error('SmartMixin current fetch error:', e);
  }

  // 2. Fetch History from SmartMixin
  const fetchWindow = async (hours) => {
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
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json) && hasPoints(json[0]) ? json[0] : null;
  };

  try {
    const windows = (await Promise.all(
      WINDOW_HOURS.map(h => fetchWindow(h).catch(() => null))
    )).filter(Boolean);

    if (windows.length > 0) {
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
      if (out.T) {
        historySeries = out;
      }
    }
  } catch (e) {
    console.error('SmartMixin history fetch error:', e);
  }

  // 3. MetNet Fallback
  const isSmartMixinOk = historySeries && historySeries.T;
  if (!isSmartMixinOk) {
    console.log('SmartMixin history missing/incomplete. Trying MetNet...');
    try {
      const metnetRes = await fetch('https://www.metnet.hu/online-allomasok?sub=showosdata&ostid=1155', {
        headers: { 'User-Agent': userAgent }
      });
      if (metnetRes.ok) {
        const html = await metnetRes.text();
        const metnetData = parseMetNetHtml(html);

        // Check freshness (last point < 4h)
        let isMetNetFresh = false;
        if (metnetData && metnetData.T && metnetData.T.ts.length > 0) {
          const lastTs = metnetData.T.ts[metnetData.T.ts.length - 1];
          const ageSec = Math.floor(Date.now() / 1000) - lastTs;
          if (ageSec < 4 * 3600) {
            isMetNetFresh = true;
          }
        }

        if (isMetNetFresh) {
          console.log('MetNet backup data loaded.');
          historySeries = {};
          for (const k of METRICS) {
            const series = metnetData[k];
            if (series) {
              historySeries[k] = trimSeries(series.ts, series.data, DISPLAY_HOURS);
            }
          }
          historySource = 'metnet';

          // If currentData is down, reconstruct it from the latest MetNet row
          if (!currentData || !currentData.last_measure) {
            const lastIdx = metnetData.T.ts.length - 1;
            const T = metnetData.T.data[lastIdx];
            const U = metnetData.U.data[lastIdx];
            const FF = metnetData.FF.data[lastIdx];
            const DD = metnetData.DD.data[lastIdx];
            const SLP = metnetData.SLP.data[lastIdx];
            const RR_1H = metnetData.RR_1H.data[lastIdx];
            const RR_TODAY = metnetData.RR_TODAY.data[lastIdx];
            const DP = metnetData.DP.data[lastIdx];
            const HEAT_INDEX = metnetData.HEAT_INDEX.data[lastIdx];
            const HUMIDEX = metnetData.HUMIDEX.data[lastIdx];
            
            // Calculate min/max from last 24h
            const tMin = Math.min(...metnetData.T.data.slice(-144).filter(v => v !== null));
            const tMax = Math.max(...metnetData.T.data.slice(-144).filter(v => v !== null));

            const R = 287.05;
            const pPa = (SLP || 1013.25) * 100;
            const TK = (T || 0) + 273.15;
            const AIR_DENSITY = pPa / (R * TK);

            currentData = {
              last_measure: {
                T, U, FF, DD, SLP, RR_1H,
                HEAT_INDEX, HUMIDEX, DP,
                T_MIN: tMin, T_MAX: tMax,
                RR_TODAY, AIR_DENSITY,
                T_TREND: 0, SLP_TREND: 0
              },
              last_measure_at: metnetData.T.ts[lastIdx],
              sun_info: null
            };
          }
        }
      }
    } catch (e) {
      console.error('MetNet fallback error:', e);
    }
  }

  // 4. Open-Meteo Fallback
  if (!historySeries || !historySeries.T) {
    console.log('MetNet down/stale. Trying Open-Meteo fallback...');
    try {
      const openMeteoUrl = 'https://api.open-meteo.com/v1/forecast?latitude=47.3971&longitude=16.5460&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,pressure_msl,precipitation,apparent_temperature&past_days=2&forecast_days=1&timezone=Europe%2FBerlin';
      const openMeteoRes = await fetch(openMeteoUrl);
      if (openMeteoRes.ok) {
        const json = await openMeteoRes.json();
        const hourly = json.hourly;
        if (hourly && Array.isArray(hourly.time)) {
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

          historySeries = {};
          for (const k of METRICS) {
            const arr = rawData[k];
            if (arr) {
              historySeries[k] = trimSeries(rawTimestamps, arr, DISPLAY_HOURS);
            }
          }
          historySource = 'open-meteo';

          // If currentData is down, fetch current weather from Open-Meteo
          if (!currentData || !currentData.last_measure) {
            const currentUrl = 'https://api.open-meteo.com/v1/forecast?latitude=47.3971&longitude=16.5460&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,pressure_msl&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Europe%2FBerlin';
            const curRes = await fetch(currentUrl);
            if (curRes.ok) {
              const curJson = await curRes.json();
              const c = curJson.current || {};
              const d = curJson.daily || {};
              
              const T = c.temperature_2m;
              const U = c.relative_humidity_2m;
              const FF = c.wind_speed_10m;
              const DD = c.wind_direction_10m;
              const SLP = c.pressure_msl;
              const RR_1H = c.precipitation;
              const RR_TODAY = d.precipitation_sum ? d.precipitation_sum[0] : 0;
              const tMin = d.temperature_2m_min ? d.temperature_2m_min[0] : null;
              const tMax = d.temperature_2m_max ? d.temperature_2m_max[0] : null;

              const e = 6.112 * Math.pow(10, (7.5 * T) / (237.7 + T)) * (U / 100);
              const HUMIDEX = T + (5 / 9) * (e - 10);
              const DP = T - (100 - U) / 5; // standard DP approximation
              
              const R = 287.05;
              const pPa = (SLP || 1013.25) * 100;
              const TK = (T || 0) + 273.15;
              const AIR_DENSITY = pPa / (R * TK);

              currentData = {
                last_measure: {
                  T, U, FF, DD, SLP, RR_1H,
                  HEAT_INDEX: c.apparent_temperature,
                  HUMIDEX, DP,
                  T_MIN: tMin, T_MAX: tMax,
                  RR_TODAY, AIR_DENSITY,
                  T_TREND: 0, SLP_TREND: 0
                },
                last_measure_at: Math.floor(Date.now() / 1000),
                sun_info: null
              };
            }
          }
        }
      }
    } catch (e) {
      console.error('Open-Meteo fallback error:', e);
    }
  }

  // Standardize response
  const result = {
    current: currentData,
    history: historySeries,
    source: historySource
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300', // Cache on Netlify CDN for 5 minutes
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(result)
  };
}
