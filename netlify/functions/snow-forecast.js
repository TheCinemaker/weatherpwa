import {
  KOSZEG_COORDS,
  MODEL_DEFINITIONS,
  FORECAST_HORIZONS,
  normalizeOpenMeteoModel,
  computeWindowConsensus,
  generateSnowAssessment,
  parseMeteoAlarmHungaryXml,
} from '../../src/utils/snowForecastEngine.js';

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 perc (rövid életű szerveroldali memória-cache)
const FETCH_TIMEOUT_MS = 8500;

const BASE_HOURLY_PARAMS = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation',
  'snowfall',
  'snow_depth',
  'precipitation_probability',
  'rain',
  'showers',
  'relative_humidity_2m',
  'dew_point_2m',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'weather_code',
];

const DAILY_PARAMS = [
  'temperature_2m_min',
  'temperature_2m_max',
  'snowfall_sum',
  'precipitation_sum',
  'precipitation_hours',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
];

const METEOALARM_HUNGARY_URL = 'https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-hungary';

let cachedEntry = null;

export function clearSnowForecastCache() {
  cachedEntry = null;
}

function buildOpenMeteoUrl(modelDef) {
  const hourlyFields = modelDef.supportsFreezingLevel
    ? [...BASE_HOURLY_PARAMS, 'freezing_level_height']
    : BASE_HOURLY_PARAMS;

  const params = new URLSearchParams({
    latitude: String(KOSZEG_COORDS.latitude),
    longitude: String(KOSZEG_COORDS.longitude),
    timezone: KOSZEG_COORDS.timezone,
    forecast_days: '4',
    models: modelDef.apiModel,
    hourly: hourlyFields.join(','),
    daily: DAILY_PARAMS.join(','),
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

async function fetchWithTimeout(fetchImpl, url, timeoutMs, asText = false) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`Időtúllépés (${timeoutMs} ms)`)), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      signal: controller.signal,
      headers: {
        Accept: asText
          ? 'application/atom+xml, application/xml, text/xml, */*'
          : 'application/json, */*',
      },
    });
    if (!res.ok) {
      const bodySnippet = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}${bodySnippet ? `: ${bodySnippet.slice(0, 120)}` : ''}`);
    }
    return asText ? await res.text() : await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Teljes többmodellű hóelőrejelzés összeállítása (tesztelhető befecskendezett fetch-csel).
 */
export async function buildSnowForecastPayload({
  fetchImpl = fetch,
  nowMs = Date.now(),
  skipCache = false,
} = {}) {
  if (!skipCache && cachedEntry && nowMs - cachedEntry.timestamp < CACHE_TTL_MS) {
    const cacheAgeSec = Math.max(0, Math.round((nowMs - cachedEntry.timestamp) / 1000));
    return {
      statusCode: 200,
      payload: {
        ...cachedEntry.payload,
        cached: true,
        cacheAgeSec,
      },
    };
  }

  // Párhuzamos lekérdezés: 5 modell előrejelzés + 4 modell meta.json + MeteoAlarm HungaroMet feed
  const modelPromises = MODEL_DEFINITIONS.map(async (modelDef) => {
    const forecastUrl = buildOpenMeteoUrl(modelDef);
    const metaPromise = modelDef.metaUrl
      ? fetchWithTimeout(fetchImpl, modelDef.metaUrl, FETCH_TIMEOUT_MS, false).catch(() => null)
      : Promise.resolve(null);

    try {
      const [rawJson, metaJson] = await Promise.all([
        fetchWithTimeout(fetchImpl, forecastUrl, FETCH_TIMEOUT_MS, false),
        metaPromise,
      ]);

      if (rawJson?.error) {
        return {
          ...modelDef,
          status: 'error',
          error: rawJson.reason || 'Open-Meteo modellhiba',
          metadata: null,
          hourly: [],
          daily: [],
          windows: {},
        };
      }

      return normalizeOpenMeteoModel(modelDef, rawJson, metaJson, nowMs);
    } catch (err) {
      return {
        ...modelDef,
        status: 'error',
        error: err?.message || 'Ismeretlen lekérdezési hiba',
        metadata: null,
        hourly: [],
        daily: [],
        windows: {},
      };
    }
  });

  const warningPromise = fetchWithTimeout(fetchImpl, METEOALARM_HUNGARY_URL, FETCH_TIMEOUT_MS, true)
    .then((xml) => parseMeteoAlarmHungaryXml(xml, nowMs))
    .catch((err) => ({
      source: 'HungaroMet / EUMETNET MeteoAlarm',
      available: false,
      error: err?.message || 'Figyelmeztetések lekérése sikertelen',
      localWarnings: [],
      nationalSnowWarnings: [],
    }));

  const [models, officialWarnings] = await Promise.all([
    Promise.all(modelPromises),
    warningPromise,
  ]);

  const okCount = models.filter((m) => m.status === 'ok').length;

  const consensus = {};
  const assessment = {};
  for (const h of FORECAST_HORIZONS) {
    const key = String(h);
    consensus[key] = computeWindowConsensus(models, h);
    assessment[key] = generateSnowAssessment({
      consensus: consensus[key],
      models,
      horizonHours: h,
      officialWarnings,
    });
  }

  const staleModels = models.filter((m) => m.status === 'ok' && m.metadata?.isStale).map((m) => m.id);

  const payload = {
    location: KOSZEG_COORDS,
    fetchedAt: new Date(nowMs).toISOString(),
    fetchedAtEpochMs: nowMs,
    cached: false,
    cacheAgeSec: 0,
    models,
    consensus,
    assessment,
    officialWarnings,
    dataQuality: {
      availableModels: okCount,
      totalModels: models.length,
      failedModels: models.filter((m) => m.status !== 'ok').map((m) => m.id),
      staleModels,
      hasOfficialWarningsSource: !!officialWarnings.available,
    },
  };

  if (okCount === 0) {
    return {
      statusCode: 503,
      payload: {
        ...payload,
        error: 'Egyetlen numerikus időjárási modell sem válaszolt időben.',
      },
    };
  }

  // Csak akkor cache-eljük, ha volt sikeres adat és nem volt minden modell hibás
  if (!skipCache) {
    cachedEntry = { timestamp: nowMs, payload };
  }

  return { statusCode: 200, payload };
}

export async function handler(event) {
  const params = event?.queryStringParameters || {};
  const skipCache = params.refresh === '1' || params.refresh === 'true';

  try {
    const { statusCode, payload } = await buildSnowForecastPayload({
      skipCache,
    });

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': skipCache
          ? 'no-store'
          : statusCode === 200
            ? 'public, max-age=180'
            : 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(payload),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: err?.message || 'Váratlan szerverhiba a hóelőrejelzés összeállításakor.',
        fetchedAt: new Date().toISOString(),
      }),
    };
  }
}

