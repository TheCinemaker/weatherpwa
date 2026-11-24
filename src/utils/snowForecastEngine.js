// Többmodellű hóelőrejelző determinisztikus meteorológiai motor (Kőszeg, 47.389°N, 16.541°E)
// Kizárólag valódi, Open-Meteo / HungaroMet (MeteoAlarm) adatokból dolgozik.
// Fontos mértékegység-szabály:
//   - snowfallCm: friss havazás (cm / óra, ill. összeg cm)
//   - snowDepthM / snowDepthCm: a talajon lévő teljes hóvastagság (Open-Meteo: méter -> *100 cm)
//   A kettőt soha nem keverjük és nem adjuk össze.

export const KOSZEG_COORDS = {
  name: 'Kőszeg',
  country: 'Magyarország',
  latitude: 47.389,
  longitude: 16.541,
  elevationM: 277,
  timezone: 'Europe/Budapest',
};

export const FORECAST_HORIZONS = [24, 48, 72];

export const MODEL_DEFINITIONS = [
  {
    id: 'icon_d2',
    apiModel: 'icon_d2',
    name: 'DWD ICON-D2',
    shortName: 'ICON-D2',
    provider: 'Deutscher Wetterdienst (DWD)',
    resolution: '2,2 km',
    updateIntervalHours: 3,
    typicalHorizonHours: 48,
    isComposite: false,
    supportsFreezingLevel: true,
    metaUrl: 'https://api.open-meteo.com/data/dwd_icon_d2/static/meta.json',
    notes: 'Nagy felbontású alpokaljai regionális modell (~48 órás előrejelzési horizont).',
  },
  {
    id: 'icon_eu',
    apiModel: 'icon_eu',
    name: 'DWD ICON-EU',
    shortName: 'ICON-EU',
    provider: 'Deutscher Wetterdienst (DWD)',
    resolution: '7 km',
    updateIntervalHours: 3,
    typicalHorizonHours: 96,
    isComposite: false,
    supportsFreezingLevel: true,
    metaUrl: 'https://api.open-meteo.com/data/dwd_icon_eu/static/meta.json',
    notes: 'Európai regionális DWD modell teljes 72+ órás lefedettséggel.',
  },
  {
    id: 'ecmwf_ifs',
    apiModel: 'ecmwf_ifs',
    name: 'ECMWF IFS',
    shortName: 'ECMWF',
    provider: 'ECMWF',
    resolution: '9 km',
    updateIntervalHours: 6,
    typicalHorizonHours: 96,
    isComposite: false,
    supportsFreezingLevel: false,
    metaUrl: 'https://api.open-meteo.com/data/ecmwf_ifs/static/meta.json',
    notes: 'Globális központi modell (a hóhatár-magasság paraméter ennél a modellnél nem elérhető az API-ban).',
  },
  {
    id: 'gfs_global',
    apiModel: 'gfs_global',
    name: 'NOAA GFS',
    shortName: 'GFS',
    provider: 'NOAA NCEP',
    resolution: '25 km (0,25°)',
    updateIntervalHours: 6,
    typicalHorizonHours: 96,
    isComposite: false,
    supportsFreezingLevel: true,
    metaUrl: 'https://api.open-meteo.com/data/ncep_gfs025/static/meta.json',
    notes: 'Amerikai globális előrejelző modell óránkénti felbontással.',
  },
  {
    id: 'best_match',
    apiModel: 'best_match',
    name: 'Open-Meteo Best Match',
    shortName: 'Best Match',
    provider: 'Open-Meteo (kompozit)',
    resolution: 'Kompozit',
    updateIntervalHours: 3,
    typicalHorizonHours: 96,
    isComposite: true,
    supportsFreezingLevel: true,
    metaUrl: null,
    notes: 'Az Open-Meteo által automatikusan kombinált modellsorozat (összesített, nem egyetlen futás).',
  },
];

// Dokumentált konszenzus-küszöbök (cm-ben kifejezett ablakösszegekre):
// - Elhanyagolható hó: minden teljes lefedettségű modell < 0,5 cm -> "Jó egyezés (száraz / csapadékmentes)"
// - Jó egyezés: max-min <= 3,0 cm ÉS szórás <= 1,5 cm ÉS (max <= 2,0 cm vagy relatív eltérés <= 0,35),
//   továbbá nem áll elő erős ellentmondás (pl. egyik modell 0 cm, másik > 3,0 cm).
// - Közepes egyezés: max-min <= 8,0 cm ÉS szórás <= 3,5 cm ÉS (relatív eltérés <= 0,75 vagy max-min <= 5,0 cm),
//   és száraz vs. havas ellentmondásnál a legmagasabb érték <= 6,0 cm.
// - Gyenge egyezés: a fenti küszöbök felett vagy erős ellentmondásnál.
export const CONSENSUS_THRESHOLDS = {
  MIN_MODELS_FOR_CONSENSUS: 2,
  NEGLIGIBLE_SNOW_CM: 0.5,
  GOOD_MAX_SPREAD_CM: 3.0,
  GOOD_MAX_STDDEV_CM: 1.5,
  GOOD_MAX_REL_SPREAD: 0.35,
  GOOD_SMALL_MAX_CM: 2.0,
  CONTRADICTION_GOOD_MAX_CM: 3.0,
  MODERATE_MAX_SPREAD_CM: 8.0,
  MODERATE_MAX_STDDEV_CM: 3.5,
  MODERATE_MAX_REL_SPREAD: 0.75,
  MODERATE_ABS_OVERRIDE_SPREAD_CM: 5.0,
  CONTRADICTION_MODERATE_MAX_CM: 6.0,
};

// Ha egy futás ennyivel régebbi a várható frissítési ciklusánál, elavultnak jelöljük.
export const STALE_BUFFER_HOURS = 6;

export const PHASE_LABELS = {
  none: 'Csapadékmentes',
  dry_snow: 'Száraz havazás',
  wet_snow: 'Tapadó / vizes hó',
  sleet: 'Havas eső',
  freezing_rain: 'Ónos eső',
  rain: 'Eső',
};

const round1 = (v) => (v == null || Number.isNaN(v) ? null : Math.round(v * 10) / 10);
const round2 = (v) => (v == null || Number.isNaN(v) ? null : Math.round(v * 100) / 100);

function numOrNull(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/**
 * Nedves hőmérséklet (Wet-Bulb Temperature) számítása Stull (2011) empirikus formulájával.
 * @param {number|null} tempC Levegő hőmérséklet (°C)
 * @param {number|null} rhPercent Relatív páratartalom (%)
 * @returns {number|null} Nedves hőmérséklet (°C, 1 tizedesre kerekítve)
 */
export function computeWetBulbC(tempC, rhPercent) {
  if (typeof tempC !== 'number' || !Number.isFinite(tempC)) return null;
  if (typeof rhPercent !== 'number' || !Number.isFinite(rhPercent)) return null;
  const rh = Math.min(100, Math.max(5, rhPercent));
  const tw =
    tempC * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(tempC + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035;
  return round1(tw);
}

/**
 * Többparaméteres csapadék-halmazállapot besorolás (nem egyetlen merev °C küszöb!).
 * Figyelembe veszi: hőmérséklet, harmatpont, nedves hőmérséklet, hóhatár,
 * csapadékintenzitás, valamint a modell által jelzett hó/eső megoszlást.
 */
export function classifyPrecipitationPhase({
  tempC = null,
  dewPointC = null,
  wetBulbC = null,
  freezingLevelM = null,
  elevationM = KOSZEG_COORDS.elevationM,
  snowfallCm = 0,
  rainMm = 0,
  showersMm = 0,
  precipMm = 0,
  weatherCode = null,
} = {}) {
  const sf = numOrNull(snowfallCm) ?? 0;
  const rn = numOrNull(rainMm) ?? 0;
  const sh = numOrNull(showersMm) ?? 0;
  const pr = numOrNull(precipMm) ?? 0;
  const liquidOnly = rn + sh;

  if (pr < 0.05 && sf < 0.05 && liquidOnly < 0.05) {
    return { code: 'none', label: PHASE_LABELS.none };
  }

  // Ónos eső: explicit WMO kód (56, 57, 66, 67) vagy fagypont alatti folyékony csapadék
  const isFreezingWmo = weatherCode === 56 || weatherCode === 57 || weatherCode === 66 || weatherCode === 67;
  if (
    isFreezingWmo ||
    (liquidOnly >= 0.1 && sf < 0.05 && tempC != null && tempC <= 0.0 && (wetBulbC == null || wetBulbC <= 0.2))
  ) {
    return { code: 'freezing_rain', label: PHASE_LABELS.freezing_rain };
  }

  // Vegyes modell-kimenet (egyszerre hó és számottevő eső/zápor)
  if (sf >= 0.05 && liquidOnly >= 0.2) {
    return { code: 'sleet', label: PHASE_LABELS.sleet };
  }

  // Intenzív csapadék diabathikus hűtő hatása (~0,4 °C)
  const intenseCoolingBonus = pr >= 2.0 ? -0.4 : 0;
  const effectiveTw = wetBulbC != null ? wetBulbC + intenseCoolingBonus : null;

  // Hó-domináns óra
  if (sf >= 0.05) {
    // Ha már magasan van az olvadási szint vagy túl magas a nedves hőmérséklet, inkább havas eső
    if (
      (tempC != null && tempC >= 2.8 && (effectiveTw == null || effectiveTw >= 1.2)) ||
      (freezingLevelM != null && freezingLevelM > elevationM + 650 && (tempC == null || tempC > 1.5))
    ) {
      return { code: 'sleet', label: PHASE_LABELS.sleet };
    }

    // Száraz porhó: levegő és nedves hőmérséklet is fagypont alatt, hóhatár alacsony
    const dryByTemp = tempC != null && tempC <= -0.5;
    const dryByTw = effectiveTw == null ? (dewPointC == null || dewPointC <= -0.8) : effectiveTw <= -0.5;
    const lowFreezing = freezingLevelM == null || freezingLevelM <= elevationM + 200;
    if (dryByTemp && dryByTw && lowFreezing) {
      return { code: 'dry_snow', label: PHASE_LABELS.dry_snow };
    }

    return { code: 'wet_snow', label: PHASE_LABELS.wet_snow };
  }

  // Folyékony csapadék-domináns óra: ellenőrizzük, hogy alacsony nedves hőmérséklet / hóhatár miatt nem havas eső-e
  if (
    effectiveTw != null &&
    effectiveTw <= 0.6 &&
    tempC != null &&
    tempC <= 2.2 &&
    (freezingLevelM == null || freezingLevelM <= elevationM + 350)
  ) {
    return { code: 'sleet', label: PHASE_LABELS.sleet };
  }

  return { code: 'rain', label: PHASE_LABELS.rain };
}

/**
 * Hamis pontosság elkerülése: kis értékeknél 0,1 cm, 0,5-10 cm között fél cm,
 * 10 cm felett egész cm pontosságra kerekít.
 */
export function roundSnowDisplay(cm) {
  if (typeof cm !== 'number' || !Number.isFinite(cm)) return null;
  if (cm < 0.05) return 0;
  if (cm < 0.5) return Math.round(cm * 10) / 10;
  if (cm < 10) return Math.round(cm * 2) / 2;
  return Math.round(cm);
}

export function formatSnowCm(cm) {
  const rounded = roundSnowDisplay(cm);
  if (rounded == null) return '–';
  if (rounded === 0) return '0 cm';
  return `${rounded.toLocaleString('hu-HU')} cm`;
}

/**
 * Budapest helyi ISO időstring ("YYYY-MM-DDTHH:mm") -> UTC epoch ms.
 * Téli (CET +01:00) és nyári (CEST +02:00) időszámításban is pontos az Intl.DateTimeFormat használatával.
 */
export function parseBudapestLocalIsoToEpochMs(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return null;
  // Ha már tartalmaz időzóna-eltolást vagy Z-t
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(isoStr)) {
    const t = Date.parse(isoStr);
    return Number.isFinite(t) ? t : null;
  }
  const m = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, yStr, moStr, dStr, hStr, miStr] = m;
  const y = Number(yStr);
  const mo = Number(moStr);
  const d = Number(dStr);
  const h = Number(hStr);
  const mi = Number(miStr);

  // Kezdeti becslés UTC-ként, majd kétszeres iterációval pontos eltolás (DST-váltáskor is pontos)
  const targetUtcAsWall = Date.UTC(y, mo - 1, d, h, mi, 0);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: KOSZEG_COORDS.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const getWallMsInTz = (utcMs) => {
    const parts = {};
    for (const p of fmt.formatToParts(new Date(utcMs))) {
      if (p.type !== 'literal') parts[p.type] = Number(p.value);
    }
    const hh = parts.hour === 24 ? 0 : parts.hour;
    return Date.UTC(parts.year, parts.month - 1, parts.day, hh, parts.minute, 0);
  };

  let guess = targetUtcAsWall - 3600 * 1000;
  for (let i = 0; i < 2; i++) {
    const wallAtGuess = getWallMsInTz(guess);
    guess += targetUtcAsWall - wallAtGuess;
  }
  return guess;
}

export function getBudapestHourStartMs(nowEpochMs = Date.now()) {
  return Math.floor(nowEpochMs / 3600000) * 3600000;
}

export function formatBudapestDateTime(epochMs) {
  if (typeof epochMs !== 'number' || !Number.isFinite(epochMs)) return '–';
  return new Intl.DateTimeFormat('hu-HU', {
    timeZone: KOSZEG_COORDS.timezone,
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(epochMs));
}

export function formatBudapestTimeShort(epochMs) {
  if (typeof epochMs !== 'number' || !Number.isFinite(epochMs)) return '–';
  return new Intl.DateTimeFormat('hu-HU', {
    timeZone: KOSZEG_COORDS.timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(epochMs));
}

export function formatBudapestClockOnly(epochMs) {
  if (typeof epochMs !== 'number' || !Number.isFinite(epochMs)) return '–';
  return new Intl.DateTimeFormat('hu-HU', {
    timeZone: KOSZEG_COORDS.timezone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(epochMs));
}

function getBudapestDaypartHu(epochMs) {
  if (typeof epochMs !== 'number' || !Number.isFinite(epochMs)) return '';
  const fmt = new Intl.DateTimeFormat('hu-HU', {
    timeZone: KOSZEG_COORDS.timezone,
    weekday: 'long',
    hour: 'numeric',
    hour12: false,
  });
  const parts = {};
  for (const p of fmt.formatToParts(new Date(epochMs))) {
    if (p.type !== 'literal') parts[p.type] = p.value;
  }
  const hour = Number(parts.hour);
  let period;
  if (hour >= 0 && hour < 5) period = 'hajnalban';
  else if (hour >= 5 && hour < 9) period = 'reggel';
  else if (hour >= 9 && hour < 12) period = 'délelőtt';
  else if (hour >= 12 && hour < 18) period = 'délután';
  else if (hour >= 18 && hour < 22) period = 'este';
  else period = 'éjszaka';
  return `${parts.weekday} ${period}`;
}

/**
 * Open-Meteo API JSON + meta.json normalizálása egy modellre.
 * Soha nem pótolja vagy nyújtja meg a hiányzó záró adatpontokat (pl. ICON-D2 ~48 órás határa).
 */
export function normalizeOpenMeteoModel(modelDef, rawJson, metaJson = null, nowEpochMs = Date.now()) {
  const hourlyRaw = rawJson?.hourly;
  if (!hourlyRaw || !Array.isArray(hourlyRaw.time) || hourlyRaw.time.length === 0) {
    return {
      ...modelDef,
      status: 'no_coverage',
      error: 'A modell nem adott óránkénti idősort erre a koordinátára.',
      metadata: null,
      hourly: [],
      daily: [],
      windows: {},
    };
  }

  const refStartMs = getBudapestHourStartMs(nowEpochMs);
  const times = hourlyRaw.time;
  const hourly = [];

  for (let i = 0; i < times.length; i++) {
    const tempC = numOrNull(hourlyRaw.temperature_2m?.[i]);
    const precipMm = numOrNull(hourlyRaw.precipitation?.[i]);
    const snowfallCm = numOrNull(hourlyRaw.snowfall?.[i]);

    // A modell tényleges horizontján túli null rekordokat nem vesszük fel
    if (tempC == null && precipMm == null && snowfallCm == null) {
      continue;
    }

    const epochMs = parseBudapestLocalIsoToEpochMs(times[i]);
    if (epochMs == null) continue;
    // Csak a jelenlegi órától előre (+0h .. +96h)
    if (epochMs < refStartMs - 30 * 60 * 1000) continue;

    const snowDepthM = numOrNull(hourlyRaw.snow_depth?.[i]);
    const snowDepthCm = snowDepthM != null ? round1(snowDepthM * 100) : null;
    const rh = numOrNull(hourlyRaw.relative_humidity_2m?.[i]);
    const dewPointC = numOrNull(hourlyRaw.dew_point_2m?.[i]);
    const wetBulbC = computeWetBulbC(tempC, rh);
    const rainMm = numOrNull(hourlyRaw.rain?.[i]);
    const showersMm = numOrNull(hourlyRaw.showers?.[i]);
    const freezingLevelM = modelDef.supportsFreezingLevel
      ? numOrNull(hourlyRaw.freezing_level_height?.[i])
      : null;
    const weatherCode = numOrNull(hourlyRaw.weather_code?.[i]);

    const phase = classifyPrecipitationPhase({
      tempC,
      dewPointC,
      wetBulbC,
      freezingLevelM,
      elevationM: rawJson?.elevation ?? KOSZEG_COORDS.elevationM,
      snowfallCm: snowfallCm ?? 0,
      rainMm: rainMm ?? 0,
      showersMm: showersMm ?? 0,
      precipMm: precipMm ?? 0,
      weatherCode,
    });

    hourly.push({
      time: times[i],
      epochMs,
      offsetHours: Math.round((epochMs - refStartMs) / 3600000),
      tempC,
      apparentTempC: numOrNull(hourlyRaw.apparent_temperature?.[i]),
      rh,
      dewPointC,
      wetBulbC,
      precipitationMm: precipMm,
      rainMm,
      showersMm,
      snowfallCm,
      snowDepthM,
      snowDepthCm,
      precipProb: numOrNull(hourlyRaw.precipitation_probability?.[i]),
      windSpeedKmh: numOrNull(hourlyRaw.wind_speed_10m?.[i]),
      windDirDeg: numOrNull(hourlyRaw.wind_direction_10m?.[i]),
      windGustsKmh: numOrNull(hourlyRaw.wind_gusts_10m?.[i]),
      weatherCode,
      freezingLevelM,
      phase,
    });
  }

  if (hourly.length === 0) {
    return {
      ...modelDef,
      status: 'no_coverage',
      error: 'A modell a kért időszakra nem tartalmaz érvényes adatpontot.',
      metadata: null,
      hourly: [],
      daily: [],
      windows: {},
    };
  }

  const lastEpochMs = hourly[hourly.length - 1].epochMs;
  const validHorizonHours = Math.max(0, Math.round((lastEpochMs - refStartMs) / 3600000) + 1);

  const runInitSec = numOrNull(metaJson?.last_run_initialisation_time);
  const runAvailSec = numOrNull(metaJson?.last_run_availability_time);
  const runInitMs = runInitSec != null ? runInitSec * 1000 : null;
  const runAvailMs = runAvailSec != null ? runAvailSec * 1000 : null;
  const refUpdateMs = runAvailMs ?? runInitMs;
  const ageHours = refUpdateMs != null ? round1((nowEpochMs - refUpdateMs) / 3600000) : null;
  const staleLimitHours = modelDef.updateIntervalHours + STALE_BUFFER_HOURS;
  const isStale = !modelDef.isComposite && ageHours != null && ageHours > staleLimitHours;

  const dailyRaw = rawJson?.daily;
  const daily = [];
  if (dailyRaw && Array.isArray(dailyRaw.time)) {
    for (let i = 0; i < dailyRaw.time.length; i++) {
      const tMin = numOrNull(dailyRaw.temperature_2m_min?.[i]);
      const tMax = numOrNull(dailyRaw.temperature_2m_max?.[i]);
      const sfSum = numOrNull(dailyRaw.snowfall_sum?.[i]);
      const pSum = numOrNull(dailyRaw.precipitation_sum?.[i]);
      if (tMin == null && tMax == null && sfSum == null && pSum == null) continue;
      daily.push({
        date: dailyRaw.time[i],
        tempMinC: tMin,
        tempMaxC: tMax,
        snowfallSumCm: sfSum,
        precipitationSumMm: pSum,
        precipitationHours: numOrNull(dailyRaw.precipitation_hours?.[i]),
        windSpeedMaxKmh: numOrNull(dailyRaw.wind_speed_10m_max?.[i]),
        windGustsMaxKmh: numOrNull(dailyRaw.wind_gusts_10m_max?.[i]),
      });
    }
  }

  const normalized = {
    id: modelDef.id,
    apiModel: modelDef.apiModel,
    name: modelDef.name,
    shortName: modelDef.shortName,
    provider: modelDef.provider,
    resolution: modelDef.resolution,
    isComposite: modelDef.isComposite,
    supportsFreezingLevel: modelDef.supportsFreezingLevel,
    notes: modelDef.notes,
    status: 'ok',
    error: null,
    metadata: {
      source: 'Open-Meteo',
      apiModel: modelDef.apiModel,
      gridElevationM: numOrNull(rawJson?.elevation),
      gridLat: numOrNull(rawJson?.latitude),
      gridLon: numOrNull(rawJson?.longitude),
      validHorizonHours,
      hourlyPoints: hourly.length,
      temporalResolutionMin: metaJson?.temporal_resolution_seconds
        ? Math.round(metaJson.temporal_resolution_seconds / 60)
        : 60,
      runInitIso: runInitMs ? new Date(runInitMs).toISOString() : null,
      runInitEpochMs: runInitMs,
      runAvailIso: runAvailMs ? new Date(runAvailMs).toISOString() : null,
      runAvailEpochMs: runAvailMs,
      ageHours,
      isStale,
      staleLimitHours,
      hasSnowfallData: hourly.some((h) => h.snowfallCm != null),
      hasSnowDepthData: hourly.some((h) => h.snowDepthM != null),
    },
    hourly,
    daily,
    windows: {},
  };

  for (const horizon of FORECAST_HORIZONS) {
    normalized.windows[String(horizon)] = summarizeModelWindow(normalized, horizon, refStartMs);
  }

  return normalized;
}

function findDepthAtTargetHour(hourly, refStartMs, targetOffsetHours) {
  const targetMs = refStartMs + targetOffsetHours * 3600000;
  let best = null;
  let bestDist = Infinity;
  for (const pt of hourly) {
    if (pt.snowDepthCm == null) continue;
    const dist = Math.abs(pt.epochMs - targetMs);
    if (dist <= 90 * 60 * 1000 && dist < bestDist) {
      best = pt.snowDepthCm;
      bestDist = dist;
    }
  }
  return best;
}

/**
 * Egy modell előrejelzésének összegzése egy adott előrejelzési ablakra (24 / 48 / 72 óra).
 */
export function summarizeModelWindow(model, horizonHours, customRefStartMs = null) {
  if (model.status !== 'ok' || !model.hourly?.length) {
    return null;
  }

  const refStartMs = customRefStartMs ?? model.hourly[0].epochMs;
  const endLimitMs = refStartMs + horizonHours * 3600000;
  const slice = model.hourly.filter((h) => h.epochMs >= refStartMs - 1800000 && h.epochMs < endLimitMs);

  const validHorizonHours = model.metadata?.validHorizonHours ?? slice.length;
  const partialCoverage = validHorizonHours < horizonHours - 3;

  const hasSnowfall = slice.some((h) => h.snowfallCm != null);
  let freshSnowRaw = 0;
  let totalPrecipRaw = 0;
  let totalRainRaw = 0;
  let snowHoursCount = 0;
  let snowStart = null;
  let snowEnd = null;
  let snowPeak = null;

  const snowTemps = [];
  const snowWetBulbs = [];
  const allTemps = [];
  const phaseFlags = {
    hasDrySnow: false,
    hasWetSnow: false,
    hasSleet: false,
    hasRain: false,
    hasFreezingRain: false,
  };

  for (const h of slice) {
    if (h.tempC != null) allTemps.push(h.tempC);
    const sf = h.snowfallCm ?? 0;
    const pr = h.precipitationMm ?? 0;
    const rn = (h.rainMm ?? 0) + (h.showersMm ?? 0);

    freshSnowRaw += sf;
    totalPrecipRaw += pr;
    totalRainRaw += rn;

    if (h.phase?.code === 'dry_snow') phaseFlags.hasDrySnow = true;
    if (h.phase?.code === 'wet_snow') phaseFlags.hasWetSnow = true;
    if (h.phase?.code === 'sleet') phaseFlags.hasSleet = true;
    if (h.phase?.code === 'rain') phaseFlags.hasRain = true;
    if (h.phase?.code === 'freezing_rain') phaseFlags.hasFreezingRain = true;

    const isSnowHour = sf >= 0.05 || h.phase?.code === 'dry_snow' || h.phase?.code === 'wet_snow';
    if (isSnowHour) {
      snowHoursCount += 1;
      if (!snowStart) {
        snowStart = { time: h.time, epochMs: h.epochMs, offsetHours: h.offsetHours };
      }
      snowEnd = { time: h.time, epochMs: h.epochMs, offsetHours: h.offsetHours };
      if (!snowPeak || sf > snowPeak.cmPerHour) {
        snowPeak = {
          time: h.time,
          epochMs: h.epochMs,
          offsetHours: h.offsetHours,
          cmPerHour: round2(sf),
        };
      }
      if (h.tempC != null) snowTemps.push(h.tempC);
      if (h.wetBulbC != null) snowWetBulbs.push(h.wetBulbC);
    }
  }

  const depthPts = slice.filter((h) => h.snowDepthCm != null);
  const currentDepthCm = depthPts.length ? depthPts[0].snowDepthCm : null;
  const endDepthCm = depthPts.length ? depthPts[depthPts.length - 1].snowDepthCm : null;
  const peakDepthCm = depthPts.length ? Math.max(...depthPts.map((d) => d.snowDepthCm)) : null;

  const snowDepth = {
    currentCm: currentDepthCm,
    endCm: endDepthCm,
    peakCm: peakDepthCm,
    deltaCm: currentDepthCm != null && endDepthCm != null ? round1(endDepthCm - currentDepthCm) : null,
    at24hCm: findDepthAtTargetHour(model.hourly, refStartMs, 24),
    at48hCm: findDepthAtTargetHour(model.hourly, refStartMs, 48),
    at72hCm: findDepthAtTargetHour(model.hourly, refStartMs, 72),
  };

  // Havazás utáni órák maximális hőmérséklete (olvadási kockázat becsléséhez)
  let postSnowMaxTempC = null;
  if (snowEnd) {
    const afterTemps = slice
      .filter((h) => h.epochMs > snowEnd.epochMs && h.tempC != null)
      .map((h) => h.tempC);
    if (afterTemps.length) postSnowMaxTempC = Math.max(...afterTemps);
  }

  const avg = (arr) => (arr.length ? round1(arr.reduce((a, b) => a + b, 0) / arr.length) : null);
  const minOrNull = (arr) => (arr.length ? round1(Math.min(...arr)) : null);
  const maxOrNull = (arr) => (arr.length ? round1(Math.max(...arr)) : null);

  const summaryBase = {
    horizonHours,
    coveredHours: slice.length,
    partialCoverage,
    hasSnowfall,
    freshSnowCm: hasSnowfall ? round1(freshSnowRaw) : null,
    freshSnowDisplayCm: hasSnowfall ? roundSnowDisplay(freshSnowRaw) : null,
    totalPrecipMm: round1(totalPrecipRaw),
    totalRainMm: round1(totalRainRaw),
    snowHoursCount,
    snowStart,
    snowEnd,
    snowPeak,
    tempRangeC: { min: minOrNull(allTemps), max: maxOrNull(allTemps) },
    tempDuringSnow: {
      min: minOrNull(snowTemps),
      max: maxOrNull(snowTemps),
      avg: avg(snowTemps),
    },
    wetBulbDuringSnow: {
      min: minOrNull(snowWetBulbs),
      max: maxOrNull(snowWetBulbs),
      avg: avg(snowWetBulbs),
    },
    postSnowMaxTempC,
    phaseFlags,
    snowDepth,
  };

  summaryBase.retention = assessSnowRetention(summaryBase);
  return summaryBase;
}

/**
 * Megmaradási valószínűség/minősítés meghatározása meteorológiai paraméterekből.
 * Figyelembe veszi a levegőhőmérsékletet, nedves hőmérsékletet, kevert esőt és a
 * modell hóvastagság-változását (snow_depth), amely magában foglalja a talaj olvasztó hatását is.
 */
export function assessSnowRetention(summary) {
  if (!summary || (summary.freshSnowCm ?? 0) < 0.2) {
    if ((summary?.snowDepth?.currentCm ?? 0) > 0.5) {
      return {
        level: 'existing',
        label: 'Meglévő hóréteg',
        reason: 'Friss jelentős havazás nem látszik ebben az ablakban, a meglévő hóréteg alakulása a hőmérséklettől függ.',
      };
    }
    return {
      level: 'none',
      label: 'Nincs érdemi havazás',
      reason: 'Ebben az időszakban nem várható számottevő hóréteg kialakulása.',
    };
  }

  const avgT = summary.tempDuringSnow?.avg;
  const maxT = summary.tempDuringSnow?.max;
  const avgTw = summary.wetBulbDuringSnow?.avg;
  const fresh = summary.freshSnowCm ?? 0;
  const deltaDepth = summary.snowDepth?.deltaCm;
  const postMax = summary.postSnowMaxTempC;
  const hasMixedLiquid = summary.phaseFlags?.hasSleet || summary.phaseFlags?.hasRain;

  const modelRetentionRatio =
    deltaDepth != null && fresh > 0.5 ? deltaDepth / fresh : null;

  if (
    (avgT != null && avgT <= -1.0 && (avgTw == null || avgTw <= -1.2)) &&
    !hasMixedLiquid &&
    (postMax == null || postMax <= 1.5) &&
    (modelRetentionRatio == null || modelRetentionRatio >= 0.45)
  ) {
    return {
      level: 'high',
      label: 'Jó megmaradás',
      reason: 'Fagypont alatti hőmérséklet és szárazabb légréteg mellett a hulló hó jó eséllyel megmarad a felszínen.',
    };
  }

  if (
    (avgT != null && avgT >= 1.8) ||
    (avgTw != null && avgTw >= 0.8) ||
    (modelRetentionRatio != null && modelRetentionRatio < 0.15 && fresh >= 1.0 && (postMax == null || postMax >= 2.0))
  ) {
    return {
      level: 'low',
      label: 'Gyenge megmaradás (olvadás)',
      reason: 'Fagypont feletti hőmérséklet vagy meleg talajréteg miatt a hó jelentős része olvadhat, főleg alacsonyabb térszínen.',
    };
  }

  if (
    hasMixedLiquid ||
    (maxT != null && maxT > 0.5) ||
    (postMax != null && postMax > 3.0)
  ) {
    return {
      level: 'uncertain',
      label: 'Bizonytalan / részleges megmaradás',
      reason: 'A 0 °C körüli hőmérséklet és/vagy vegyes csapadék (havas eső, eső) miatt a tényleges hótakaró megmaradása erősen magasság- és intenzitásfüggő.',
    };
  }

  return {
    level: 'moderate',
    label: 'Mérsékelt / tapadó megmaradás',
    reason: 'Fagypont közeli viszonyok mellett tapadó, vizes hóréteg alakulhat ki, az intenzívebb gócokban látványosabb gyarapodással.',
  };
}

function calcMedian(sortedNums) {
  if (!sortedNums.length) return null;
  const mid = Math.floor(sortedNums.length / 2);
  if (sortedNums.length % 2 === 0) {
    return (sortedNums[mid - 1] + sortedNums[mid]) / 2;
  }
  return sortedNums[mid];
}

function calcStats(values) {
  if (!values.length) {
    return { min: null, max: null, median: null, mean: null, stdDev: null, spread: null };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / sorted.length;
  const median = calcMedian(sorted);
  const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / sorted.length;
  const stdDev = Math.sqrt(variance);
  return {
    min: round1(min),
    max: round1(max),
    median: round1(median),
    mean: round1(mean),
    stdDev: round2(stdDev),
    spread: round1(max - min),
  };
}

/**
 * Modellek közötti konszenzus, szórás, egyezési kategória és középérték-idősor számítása.
 * Figyelem: 72 órás ablakban a csak ~48 órás horizontú ICON-D2 külön jelölve kimarad a
 * 72 órás összesítő statisztikából, hogy ne torzítsa lefelé a 3 napos mediánt.
 */
export function computeWindowConsensus(models, horizonHours) {
  const okModels = models.filter((m) => m.status === 'ok' && m.windows?.[String(horizonHours)]);
  const failedModels = models
    .filter((m) => m.status !== 'ok')
    .map((m) => ({ id: m.id, name: m.shortName, status: m.status, error: m.error }));

  const fullModels = okModels.filter((m) => !m.windows[String(horizonHours)].partialCoverage);
  const partialModels = okModels
    .filter((m) => m.windows[String(horizonHours)].partialCoverage)
    .map((m) => ({
      id: m.id,
      name: m.shortName,
      validHorizonHours: m.metadata?.validHorizonHours ?? 48,
      freshSnowCm: m.windows[String(horizonHours)].freshSnowCm,
    }));

  const evalModels = fullModels.length >= CONSENSUS_THRESHOLDS.MIN_MODELS_FOR_CONSENSUS
    ? fullModels
    : okModels;

  const snowValues = evalModels
    .map((m) => m.windows[String(horizonHours)].freshSnowCm)
    .filter((v) => v != null);

  const snowStats = calcStats(snowValues);
  const displayStats = {
    minCm: roundSnowDisplay(snowStats.min),
    maxCm: roundSnowDisplay(snowStats.max),
    medianCm: roundSnowDisplay(snowStats.median),
    meanCm: roundSnowDisplay(snowStats.mean),
  };

  // Hány modell jelez érdemi (>= 0.5 cm) havazást (NO fabricated percentages!)
  const snowingModels = evalModels.filter(
    (m) => (m.windows[String(horizonHours)].freshSnowCm ?? 0) >= CONSENSUS_THRESHOLDS.NEGLIGIBLE_SNOW_CM
  );

  // Hóvastagság összevetés 0 / 24 / 48 / 72 órás metszetekben
  const collectDepthStats = (field) => {
    const vals = okModels
      .map((m) => m.windows[String(horizonHours)]?.snowDepth?.[field])
      .filter((v) => v != null);
    return calcStats(vals);
  };
  const dNow = collectDepthStats('currentCm');
  const d24 = collectDepthStats('at24hCm');
  const d48 = collectDepthStats('at48hCm');
  const d72 = collectDepthStats('at72hCm');

  const depthSpreads = [d24.spread, d48.spread, d72.spread].filter((v) => v != null);
  const maxDepthSpreadCm = depthSpreads.length ? Math.max(...depthSpreads) : 0;

  // Időzítések mediánja a havazást jelző modellek alapján
  const starts = snowingModels
    .map((m) => m.windows[String(horizonHours)].snowStart?.epochMs)
    .filter((v) => v != null)
    .sort((a, b) => a - b);
  const peaks = snowingModels
    .map((m) => m.windows[String(horizonHours)].snowPeak?.epochMs)
    .filter((v) => v != null)
    .sort((a, b) => a - b);
  const ends = snowingModels
    .map((m) => m.windows[String(horizonHours)].snowEnd?.epochMs)
    .filter((v) => v != null)
    .sort((a, b) => a - b);

  // Konszenzus kategória meghatározása dokumentált küszöbökkel
  let agreement;
  if (evalModels.length < CONSENSUS_THRESHOLDS.MIN_MODELS_FOR_CONSENSUS || snowValues.length < 2) {
    agreement = {
      level: 'insufficient',
      label: 'Nem értékelhető',
      reason: 'Kevesebb mint 2 teljes lefedettségű modell érhető el ebben az időtávban.',
    };
  } else if (snowStats.max < CONSENSUS_THRESHOLDS.NEGLIGIBLE_SNOW_CM) {
    agreement = {
      level: 'good',
      label: 'Jó egyezés',
      reason: 'A modellek egyetértenek abban, hogy ebben az időszakban nem alakul ki érdemi hótakaró (< 0,5 cm).',
    };
  } else {
    const hasDryVsSnowContradiction =
      snowStats.min < CONSENSUS_THRESHOLDS.NEGLIGIBLE_SNOW_CM && snowStats.max >= 1.5;
    const relSpread = snowStats.median > 0 ? snowStats.spread / snowStats.median : Infinity;

    const isGood =
      snowStats.spread <= CONSENSUS_THRESHOLDS.GOOD_MAX_SPREAD_CM &&
      snowStats.stdDev <= CONSENSUS_THRESHOLDS.GOOD_MAX_STDDEV_CM &&
      (snowStats.max <= CONSENSUS_THRESHOLDS.GOOD_SMALL_MAX_CM ||
        relSpread <= CONSENSUS_THRESHOLDS.GOOD_MAX_REL_SPREAD) &&
      (!hasDryVsSnowContradiction || snowStats.max <= CONSENSUS_THRESHOLDS.CONTRADICTION_GOOD_MAX_CM);

    const isModerate =
      snowStats.spread <= CONSENSUS_THRESHOLDS.MODERATE_MAX_SPREAD_CM &&
      snowStats.stdDev <= CONSENSUS_THRESHOLDS.MODERATE_MAX_STDDEV_CM &&
      (relSpread <= CONSENSUS_THRESHOLDS.MODERATE_MAX_REL_SPREAD ||
        snowStats.spread <= CONSENSUS_THRESHOLDS.MODERATE_ABS_OVERRIDE_SPREAD_CM) &&
      (!hasDryVsSnowContradiction || snowStats.max <= CONSENSUS_THRESHOLDS.CONTRADICTION_MODERATE_MAX_CM);

    if (isGood) {
      agreement = {
        level: 'good',
        label: 'Jó egyezés',
        reason: `A modellek közötti különbség kicsi (szórás: ${snowStats.stdDev} cm, tartomány: ${formatSnowCm(snowStats.min)} – ${formatSnowCm(snowStats.max)}).`,
      };
    } else if (isModerate) {
      agreement = {
        level: 'moderate',
        label: 'Közepes egyezés',
        reason: hasDryVsSnowContradiction
          ? 'A modellek között van eltérés a havazás valódi mértékében, több bizonytalansági sávval.'
          : `Kisebb–közepes különbség van a modellek mennyiségi becsléseiben (${formatSnowCm(snowStats.min)} – ${formatSnowCm(snowStats.max)}).`,
      };
    } else {
      agreement = {
        level: 'weak',
        label: 'Gyenge egyezés',
        reason: hasDryVsSnowContradiction
          ? `Éles ellentmondás a modellek között: van, amelyik alig vár havat, míg más akár ${formatSnowCm(snowStats.max)}-t számol.`
          : `Jelentős eltérés a modellek között (${formatSnowCm(snowStats.min)} – ${formatSnowCm(snowStats.max)}, szórás: ${snowStats.stdDev} cm).`,
      };
    }
  }

  // Konszenzus óránkénti medián sor építése a grafikonhoz
  const consensusHourly = buildConsensusHourlySeries(evalModels, horizonHours);

  // Összesített csapadékfázis-kockázat az elérhető modellek közül
  const sleetCount = evalModels.filter((m) => m.windows[String(horizonHours)].phaseFlags.hasSleet).length;
  const rainCount = evalModels.filter((m) => m.windows[String(horizonHours)].phaseFlags.hasRain).length;
  const freezingRainCount = evalModels.filter(
    (m) => m.windows[String(horizonHours)].phaseFlags.hasFreezingRain
  ).length;

  return {
    horizonHours,
    availableModelCount: evalModels.length,
    totalModelsRequested: models.length,
    snowingModelCount: snowingModels.length,
    excludedPartialModels: partialModels,
    failedModels,
    freshSnow: snowStats,
    freshSnowDisplay: displayStats,
    snowDepth: {
      currentMedianCm: dNow.median,
      at24hMedianCm: d24.median,
      at24hMinCm: d24.min,
      at24hMaxCm: d24.max,
      at48hMedianCm: d48.median,
      at48hMinCm: d48.min,
      at48hMaxCm: d48.max,
      at72hMedianCm: d72.median,
      at72hMinCm: d72.min,
      at72hMaxCm: d72.max,
      maxSpreadCm: round1(maxDepthSpreadCm),
      hasSignificantDivergence: maxDepthSpreadCm >= 4.0,
    },
    timing: {
      earliestStartMs: starts.length ? starts[0] : null,
      medianStartMs: starts.length ? Math.round(calcMedian(starts)) : null,
      latestStartMs: starts.length ? starts[starts.length - 1] : null,
      medianPeakMs: peaks.length ? Math.round(calcMedian(peaks)) : null,
      medianEndMs: ends.length ? Math.round(calcMedian(ends)) : null,
    },
    phaseSummary: {
      sleetModels: sleetCount,
      rainModels: rainCount,
      freezingRainModels: freezingRainCount,
    },
    agreement,
    consensusHourly,
  };
}

function buildConsensusHourlySeries(evalModels, horizonHours) {
  if (!evalModels.length) return [];
  const baseModel = evalModels.reduce((best, m) =>
    (m.hourly?.length || 0) > (best.hourly?.length || 0) ? m : best
  );
  const refStartMs = baseModel.hourly[0].epochMs;
  const endLimitMs = refStartMs + horizonHours * 3600000;

  const byEpochPerModel = evalModels.map((m) => {
    const map = new Map();
    for (const h of m.hourly) map.set(h.epochMs, h);
    return map;
  });

  const result = [];
  for (const basePt of baseModel.hourly) {
    if (basePt.epochMs >= endLimitMs) break;
    const pts = byEpochPerModel.map((m) => m.get(basePt.epochMs)).filter(Boolean);
    if (!pts.length) continue;

    const medField = (fn, roundFn = round1) => {
      const arr = pts.map(fn).filter((v) => v != null).sort((a, b) => a - b);
      if (!arr.length) return null;
      return roundFn(calcMedian(arr));
    };

    const tempC = medField((p) => p.tempC);
    const rh = medField((p) => p.rh, Math.round);
    const dewPointC = medField((p) => p.dewPointC);
    const wetBulbC = computeWetBulbC(tempC, rh);
    const snowfallCm = medField((p) => p.snowfallCm, round2);
    const precipitationMm = medField((p) => p.precipitationMm, round2);
    const rainMm = medField((p) => p.rainMm, round2);
    const showersMm = medField((p) => p.showersMm, round2);
    const snowDepthM = medField((p) => p.snowDepthM, (v) => Math.round(v * 1000) / 1000);
    const snowDepthCm = snowDepthM != null ? round1(snowDepthM * 100) : null;
    const freezingLevelM = medField((p) => p.freezingLevelM, Math.round);

    const phase = classifyPrecipitationPhase({
      tempC,
      dewPointC,
      wetBulbC,
      freezingLevelM,
      snowfallCm: snowfallCm ?? 0,
      rainMm: rainMm ?? 0,
      showersMm: showersMm ?? 0,
      precipMm: precipitationMm ?? 0,
    });

    result.push({
      time: basePt.time,
      epochMs: basePt.epochMs,
      offsetHours: Math.round((basePt.epochMs - refStartMs) / 3600000),
      tempC,
      rh,
      dewPointC,
      wetBulbC,
      precipitationMm,
      rainMm,
      showersMm,
      snowfallCm,
      snowDepthM,
      snowDepthCm,
      windSpeedKmh: medField((p) => p.windSpeedKmh, Math.round),
      windGustsKmh: medField((p) => p.windGustsKmh, Math.round),
      windDirDeg: basePt.windDirDeg,
      freezingLevelM,
      phase,
      contributingModels: pts.length,
    });
  }
  return result;
}

/**
 * Determinisztikus, 100%-ban adatvezérelt magyar meteorológiai összefoglaló.
 */
export function generateSnowAssessment({ consensus, models, horizonHours, officialWarnings }) {
  if (!consensus || consensus.availableModelCount === 0) {
    return {
      headline: `A következő ${horizonHours} órára jelenleg nincs elég érvényes modelladat.`,
      summaryParagraphs: [
        'Egyetlen numerikus időjárási modell sem szolgáltatott használható adatot Kőszegre. Kérjük, próbáld meg újra frissíteni az előrejelzést.',
      ],
      caveats: ['Valamennyi lekérdezett modellforrás hibát vagy időtúllépést jelzett.'],
    };
  }

  const med = consensus.freshSnow?.median ?? 0;
  const minD = consensus.freshSnowDisplay?.minCm ?? 0;
  const maxD = consensus.freshSnowDisplay?.maxCm ?? 0;

  let headline;
  if (consensus.snowingModelCount === 0 || (consensus.freshSnow.max ?? 0) < 0.5) {
    headline = `A következő ${horizonHours} órában nem várható számottevő havazás Kőszegen.`;
  } else if (minD === maxD) {
    headline = `A következő ${horizonHours} órában várhatóan körülbelül ${formatSnowCm(med)} friss hó hullhat.`;
  } else {
    headline = `A következő ${horizonHours} órában ${minD.toLocaleString('hu-HU')}–${maxD.toLocaleString('hu-HU')} cm friss hó várható (modellmedián: ${formatSnowCm(med)}).`;
  }

  const paragraphs = [];
  if (consensus.snowingModelCount > 0 && consensus.timing.medianStartMs) {
    const startPart = getBudapestDaypartHu(consensus.timing.medianStartMs);
    const startClock = formatBudapestClockOnly(consensus.timing.medianStartMs);
    const peakStr = consensus.timing.medianPeakMs
      ? `${getBudapestDaypartHu(consensus.timing.medianPeakMs)} (${formatBudapestClockOnly(consensus.timing.medianPeakMs)} körül)`
      : null;
    const endStr = consensus.timing.medianEndMs
      ? `${getBudapestDaypartHu(consensus.timing.medianEndMs)} (${formatBudapestClockOnly(consensus.timing.medianEndMs)} táján)`
      : null;

    let timingLine = `A havazást jelző modellek (${consensus.snowingModelCount} / ${consensus.availableModelCount} modell) alapján a csapadék ${startPart} (${startClock} körül) kezdődhet.`;
    if (peakStr && endStr && Math.abs((consensus.timing.medianEndMs ?? 0) - (consensus.timing.medianPeakMs ?? 0)) < 3600000) {
      timingLine += ` A fő csapadékgóc ${peakStr} vonulhat át.`;
    } else {
      if (peakStr) timingLine += ` A legintenzívebb havazás ${peakStr} érkezhet.`;
      if (endStr) timingLine += ` A hóesés várhatóan ${endStr} cseng le.`;
    }
    paragraphs.push(timingLine);
  } else {
    const anyPrecip = models.some(
      (m) => m.status === 'ok' && (m.windows?.[String(horizonHours)]?.totalPrecipMm ?? 0) >= 1.0
    );
    if (anyPrecip) {
      paragraphs.push(
        'Csapadék ugyan előfordulhat az ablakban, de a modellek többsége szerint eső vagy elenyésző mennyiségű vegyes csapadék formájában, összefüggő hótakaró nélkül.'
      );
    } else {
      paragraphs.push(
        'A vizsgált modellek alapján száraz vagy csapadékszegény periódus körvonalazódik az Alpokalján ebben az időszakban.'
      );
    }
  }

  // Hőmérséklet, halmazállapot és hó-megmaradás értékelése a konszenzus ablakban
  if (consensus.snowingModelCount > 0) {
    const snowWindowTemps = models
      .filter((m) => m.status === 'ok' && !m.windows?.[String(horizonHours)]?.partialCoverage)
      .map((m) => m.windows?.[String(horizonHours)]?.tempDuringSnow?.avg)
      .filter((v) => v != null);
    const avgSnowTemp = snowWindowTemps.length
      ? round1(snowWindowTemps.reduce((a, b) => a + b, 0) / snowWindowTemps.length)
      : null;

    const mixedMention = [];
    if (consensus.phaseSummary.sleetModels > 0) mixedMention.push('havas eső');
    if (consensus.phaseSummary.rainModels > 0) mixedMention.push('esőbe váltás');
    if (consensus.phaseSummary.freezingRainModels > 0) mixedMention.push('ónos eső');

    let phaseText = '';
    if (avgSnowTemp != null) {
      if (avgSnowTemp <= -1.0) {
        phaseText = `A havazás idején fagypont alatti hőmérséklet valószínű (átlagosan ${avgSnowTemp.toLocaleString('hu-HU')} °C), így a hó megmaradása kedvező.`;
      } else if (avgSnowTemp <= 1.2) {
        phaseText = `A havazás alatt fagypont körüli hőmérséklet alakulhat (átlagosan ${avgSnowTemp.toLocaleString('hu-HU')} °C), ezért vizes, tapadó hó és bizonytalanabb városi megmaradás várható (a Kőszegi-hegységben több maradhat meg).`;
      } else {
        phaseText = `A havazás során enyhébb, fagypont feletti hőmérséklet látszik (átlagosan +${avgSnowTemp.toLocaleString('hu-HU')} °C), ami jelentős olvadást okozhat a talajon.`;
      }
    }
    if (mixedMention.length > 0) {
      phaseText += ` Egyes modellek átmeneti ${mixedMention.join(' / ')} kockázatát is jelzik.`;
    }
    if (phaseText) paragraphs.push(phaseText.trim());
  }

  const caveats = [];
  if (consensus.agreement.level === 'weak' || consensus.agreement.level === 'insufficient') {
    caveats.push(consensus.agreement.reason);
  }
  if (consensus.snowDepth.hasSignificantDivergence) {
    caveats.push(
      `A modellek által jelzett talajon lévő hóvastagságban nagy a szórás (akár ${consensus.snowDepth.maxSpreadCm.toLocaleString('hu-HU')} cm különbség).`
    );
  }
  if (consensus.excludedPartialModels?.length > 0) {
    const names = consensus.excludedPartialModels.map((p) => `${p.name} (${p.validHorizonHours} óra)`).join(', ');
    caveats.push(
      `A ${horizonHours} órás konszenzusszámításból a rövidebb időtávú modell (${names}) kimaradt, de önállóan megtekinthető.`
    );
  }
  if (consensus.failedModels?.length > 0) {
    const fNames = consensus.failedModels.map((f) => f.name).join(', ');
    caveats.push(`Nem elérhető modell ebben a lekérésben: ${fNames}.`);
  }
  const staleModels = models.filter((m) => m.status === 'ok' && m.metadata?.isStale);
  if (staleModels.length > 0) {
    caveats.push(
      `Figyelem: régebbi modellfutási adatok érzékelhetők (${staleModels.map((m) => m.shortName).join(', ')}).`
    );
  }
  if (officialWarnings?.localWarnings?.length > 0) {
    caveats.push(
      `Hivatalos Vas vármegyei figyelmeztetés van érvényben (${officialWarnings.localWarnings.map((w) => w.eventHu || w.event).join(', ')}).`
    );
  }

  return {
    headline,
    summaryParagraphs: paragraphs,
    caveats,
  };
}

/**
 * EUMETNET MeteoAlarm Hungary (HungaroMet CAP Atom feed) feldolgozó.
 * Különválasztja a Kőszeg / Vas vármegye (Nyugat-Dunántúl, HU22 / HU004 / HU018)
 * helyi figyelmeztetéseit az ország más régióinak riasztásaitól.
 */
export function parseMeteoAlarmHungaryXml(xmlText, nowEpochMs = Date.now()) {
  if (!xmlText || typeof xmlText !== 'string') {
    return {
      source: 'HungaroMet / EUMETNET MeteoAlarm',
      available: false,
      localWarnings: [],
      nationalSnowWarnings: [],
    };
  }

  const getTag = (block, tag) => {
    const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const m = block.match(re);
    return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : null;
  };

  const entryMatches = [...xmlText.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)];
  const localWarnings = [];
  const nationalSnowWarnings = [];
  const seenIds = new Set();

  for (const m of entryMatches) {
    const entry = m[1];
    const id = getTag(entry, 'cap:identifier') || getTag(entry, 'id') || '';
    const areaDesc = getTag(entry, 'cap:areaDesc') || '';
    const event = getTag(entry, 'cap:event') || getTag(entry, 'title') || '';
    const severity = getTag(entry, 'cap:severity') || '';
    const onset = getTag(entry, 'cap:onset') || getTag(entry, 'cap:effective');
    const expires = getTag(entry, 'cap:expires');
    const sent = getTag(entry, 'cap:sent') || getTag(entry, 'updated');

    // Lejárt riasztás kihagyása
    if (expires) {
      const expMs = Date.parse(expires);
      if (Number.isFinite(expMs) && expMs < nowEpochMs) continue;
    }

    const geocodes = [...entry.matchAll(/<cap:geocode>[\s\S]*?<valueName>([^<]+)<\/valueName>[\s\S]*?<value>([^<]+)<\/value>[\s\S]*?<\/cap:geocode>/gi)]
      .map((g) => `${g[1]}:${g[2]}`);
    const emmaLink = entry.match(/geocode=(EMMA_ID:[^"&]+)/i)?.[1] || '';
    const allGeo = [...geocodes, emmaLink].join(' ');

    const dedupKey = `${id}|${areaDesc}`;
    if (seenIds.has(dedupKey)) continue;
    seenIds.add(dedupKey);

    let level = 'yellow';
    let levelHu = '1. fokú (citromsárga)';
    if (/red|extreme/i.test(`${event} ${severity}`)) {
      level = 'red';
      levelHu = '3. fokú (piros)';
    } else if (/orange|severe/i.test(`${event} ${severity}`)) {
      level = 'orange';
      levelHu = '2. fokú (narancs)';
    }

    const isSnowIce = /snow|ice|blizzard|frost|cold|freezing|hó|ónos|zúzmara|fagy/i.test(event);
    const parsedItem = {
      id,
      areaDesc,
      event,
      eventHu: translateMeteoAlarmEvent(event),
      severity,
      level,
      levelHu,
      isSnowIce,
      onset,
      expires,
      sent,
      geocodes,
    };

    const isLocalVas =
      /NUTS2:HU22|NUTS3:HU222|EMMA_ID:HU004|EMMA_ID:HU018/i.test(allGeo) ||
      /Western Transdanubia|Vas\b|Nyugat-Dunántúl|Kőszeg/i.test(areaDesc);

    if (isLocalVas) {
      localWarnings.push(parsedItem);
    } else if (isSnowIce) {
      nationalSnowWarnings.push(parsedItem);
    }
  }

  return {
    source: 'HungaroMet / EUMETNET MeteoAlarm',
    available: true,
    localWarnings,
    nationalSnowWarnings,
  };
}

function translateMeteoAlarmEvent(eventStr) {
  if (!eventStr) return 'Meteorológiai figyelmeztetés';
  const low = eventStr.toLowerCase();
  if (low.includes('snow-ice')) return 'Havazás / ónos eső / síkosság figyelmeztetés';
  if (low.includes('snow')) return 'Havazás figyelmeztetés';
  if (low.includes('rain')) return 'Esőzés figyelmeztetés';
  if (low.includes('wind')) return 'Széllökés figyelmeztetés';
  if (low.includes('thunder')) return 'Zivatar figyelmeztetés';
  if (low.includes('fog')) return 'Sűrű köd figyelmeztetés';
  if (low.includes('low-temperature') || low.includes('extreme low')) return 'Extrém hideg figyelmeztetés';
  return eventStr;
}
