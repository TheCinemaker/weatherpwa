import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MODEL_DEFINITIONS,
  CONSENSUS_THRESHOLDS,
  computeWetBulbC,
  classifyPrecipitationPhase,
  roundSnowDisplay,
  parseBudapestLocalIsoToEpochMs,
  normalizeOpenMeteoModel,
  summarizeModelWindow,
  assessSnowRetention,
  computeWindowConsensus,
  generateSnowAssessment,
  parseMeteoAlarmHungaryXml,
} from '../src/utils/snowForecastEngine.js';
import {
  buildSnowForecastPayload,
  clearSnowForecastCache,
  handler as snowHandler,
} from '../netlify/functions/snow-forecast.js';

// Teszt segéd: Budapest helyi órasor előállítása egy megadott UTC epoch kezdettől
function makeHourlyTimestamps(startMs, count) {
  const fmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Budapest',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const arr = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(startMs + i * 3600000);
    // "YYYY-MM-DD HH:mm" -> "YYYY-MM-DDTHH:mm"
    const s = fmt.format(d).replace(' ', 'T');
    arr.push(s);
  }
  return arr;
}

function buildMockOpenMeteoJson({
  startMs,
  totalHours = 96,
  validHours = 96,
  snowStartHour = 6,
  snowDurationHours = 8,
  snowPerHourCm = 1.0,
  rainPerHourMm = 0,
  tempC = -2.0,
  rh = 85,
  snowDepthStartM = 0.0,
  snowDepthGainPerSnowHourM = 0.008,
  freezingLevelM = 200,
  nullSnowfall = false,
  supportsFreezingLevel = true,
} = {}) {
  const time = makeHourlyTimestamps(startMs, totalHours);
  const fill = (fn) =>
    time.map((_, i) => (i < validHours ? fn(i) : null));

  let depthM = snowDepthStartM;
  const snowDepthArr = time.map((_, i) => {
    if (i >= validHours) return null;
    if (i >= snowStartHour && i < snowStartHour + snowDurationHours) {
      depthM += snowDepthGainPerSnowHourM;
    }
    return Number(depthM.toFixed(4));
  });

  const isSnowWindow = (i) => i >= snowStartHour && i < snowStartHour + snowDurationHours;

  const hourly = {
    time,
    temperature_2m: fill(() => tempC),
    apparent_temperature: fill(() => tempC - 2),
    relative_humidity_2m: fill(() => rh),
    dew_point_2m: fill(() => tempC - 1.5),
    snowfall: fill((i) => (nullSnowfall ? null : isSnowWindow(i) ? snowPerHourCm : 0)),
    snow_depth: snowDepthArr,
    rain: fill((i) => (isSnowWindow(i) ? rainPerHourMm : 0)),
    showers: fill(() => 0),
    precipitation: fill((i) =>
      isSnowWindow(i) ? Number((snowPerHourCm * 0.9 + rainPerHourMm).toFixed(2)) : 0
    ),
    precipitation_probability: fill((i) => (isSnowWindow(i) ? 80 : 10)),
    wind_speed_10m: fill(() => 14),
    wind_direction_10m: fill(() => 315),
    wind_gusts_10m: fill(() => 28),
    weather_code: fill((i) => (isSnowWindow(i) ? (snowPerHourCm > 0 ? 73 : 63) : 3)),
  };

  if (supportsFreezingLevel) {
    hourly.freezing_level_height = fill(() => freezingLevelM);
  }

  return {
    latitude: 47.389,
    longitude: 16.541,
    elevation: 277,
    timezone: 'Europe/Budapest',
    hourly,
    daily: {
      time: ['2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27'],
      temperature_2m_min: [tempC - 2, tempC - 2, tempC - 1, tempC],
      temperature_2m_max: [tempC + 2, tempC + 2, tempC + 3, tempC + 3],
      snowfall_sum: [snowPerHourCm * snowDurationHours, 0, 0, 0],
      precipitation_sum: [snowPerHourCm * snowDurationHours, 0, 0, 0],
      precipitation_hours: [snowDurationHours, 0, 0, 0],
      wind_speed_10m_max: [20, 15, 12, 12],
      wind_gusts_10m_max: [35, 25, 20, 20],
    },
  };
}

function createMockFetch({
  nowMs,
  modelConfigs = {},
  metaOverrides = {},
  failModels = {},
  meteoAlarmXml = '<feed xmlns="http://www.w3.org/2005/Atom"></feed>',
} = {}) {
  const hourStart = Math.floor(nowMs / 3600000) * 3600000;
  return async (url) => {
    if (url.includes('meteoalarm.org')) {
      return new Response(meteoAlarmXml, { status: 200, headers: { 'Content-Type': 'application/xml' } });
    }
    if (url.includes('/static/meta.json')) {
      const stale = Object.entries(metaOverrides).find(([key]) => url.includes(key))?.[1];
      const runSec = stale?.runInitSec ?? Math.floor((nowMs - 2 * 3600000) / 1000);
      const availSec = stale?.runAvailSec ?? Math.floor((nowMs - 3600000) / 1000);
      return new Response(
        JSON.stringify({
          last_run_initialisation_time: runSec,
          last_run_availability_time: availSec,
          temporal_resolution_seconds: 3600,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const parsed = new URL(url);
    const modelId = parsed.searchParams.get('models');

    if (failModels[modelId] === 'timeout') {
      const err = new Error('Simulated timeout');
      err.name = 'AbortError';
      throw err;
    }
    if (failModels[modelId] === 'http500') {
      return new Response(JSON.stringify({ error: true, reason: 'Upstream 500' }), { status: 500 });
    }

    const cfg = modelConfigs[modelId] || {};
    const json = buildMockOpenMeteoJson({
      startMs: hourStart,
      validHours: modelId === 'icon_d2' ? 48 : 96,
      supportsFreezingLevel: modelId !== 'ecmwf_ifs',
      ...cfg,
    });
    return new Response(JSON.stringify(json), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

// =========================================================================
// 1. Időzóna és téli/nyári időszámítás (CET / CEST) tesztek
// =========================================================================
test('parseBudapestLocalIsoToEpochMs helyesen kezeli a téli (CET) és nyári (CEST) időszámítást', () => {
  // Téli idő (+01:00): 2026-01-15T12:00 Budapest = 11:00Z
  const winterMs = parseBudapestLocalIsoToEpochMs('2026-01-15T12:00');
  assert.equal(new Date(winterMs).toISOString(), '2026-01-15T11:00:00.000Z');

  // Nyári idő (+02:00): 2026-07-15T12:00 Budapest = 10:00Z
  const summerMs = parseBudapestLocalIsoToEpochMs('2026-07-15T12:00');
  assert.equal(new Date(summerMs).toISOString(), '2026-07-15T10:00:00.000Z');

  // Óraátállítás napja (2026-03-29 03:30 már CEST +02:00 = 01:30Z)
  const dstSpringMs = parseBudapestLocalIsoToEpochMs('2026-03-29T03:30');
  assert.equal(new Date(dstSpringMs).toISOString(), '2026-03-29T01:30:00.000Z');
});

// =========================================================================
// 2. Halmazállapot-osztályozás és szigorú mértékegység-szétválasztás
// =========================================================================
test('Halmazállapot besorolás: fagy alatti száraz hó, fagypont feletti vizes hó, havas eső, eső', () => {
  const twCold = computeWetBulbC(-4.0, 80);
  assert.ok(twCold < -4.0);
  assert.equal(
    classifyPrecipitationPhase({
      tempC: -4.0,
      dewPointC: -6.8,
      wetBulbC: twCold,
      freezingLevelM: 0,
      snowfallCm: 1.5,
      rainMm: 0,
      precipMm: 1.5,
    }).code,
    'dry_snow'
  );

  // Fagypont feletti vizes hó (+1.3 °C, szárazabb levegő -> alacsonyabb nedves hőm.)
  const twWet = computeWetBulbC(1.3, 68);
  assert.equal(
    classifyPrecipitationPhase({
      tempC: 1.3,
      dewPointC: -3.5,
      wetBulbC: twWet,
      freezingLevelM: 420,
      snowfallCm: 1.0,
      rainMm: 0,
      precipMm: 1.2,
    }).code,
    'wet_snow'
  );

  // Havas eső (egyszerre hó és eső, vagy olvadó határréteg)
  assert.equal(
    classifyPrecipitationPhase({
      tempC: 1.8,
      dewPointC: 0.9,
      wetBulbC: 1.1,
      freezingLevelM: 550,
      snowfallCm: 0.4,
      rainMm: 0.8,
      precipMm: 1.3,
    }).code,
    'sleet'
  );

  // Tiszta eső (0 hó)
  assert.equal(
    classifyPrecipitationPhase({
      tempC: 6.5,
      dewPointC: 5.0,
      wetBulbC: 5.6,
      freezingLevelM: 1200,
      snowfallCm: 0,
      rainMm: 2.5,
      precipMm: 2.5,
    }).code,
    'rain'
  );
});

test('Snowfall (cm) és snow_depth (m -> cm) szigorúan elkülönül', () => {
  const nowMs = Date.UTC(2026, 10, 24, 12, 0, 0);
  const def = MODEL_DEFINITIONS[1]; // icon_eu
  const raw = buildMockOpenMeteoJson({
    startMs: nowMs,
    snowStartHour: 2,
    snowDurationHours: 5,
    snowPerHourCm: 2.0, // 10 cm friss hó
    snowDepthStartM: 0.05, // 5 cm induló hóvastagság
    snowDepthGainPerSnowHourM: 0.012, // +6 cm növekedés -> 11 cm végén
  });
  const norm = normalizeOpenMeteoModel(def, raw, null, nowMs);
  const win = norm.windows['24'];

  // Friss hó == 10 cm (NEM keveredik össze a 11 cm hóvastagsággal!)
  assert.equal(win.freshSnowCm, 10);
  assert.equal(win.snowDepth.currentCm, 5);
  assert.equal(win.snowDepth.peakCm, 11);
  assert.equal(win.snowDepth.deltaCm, 6);
});

// =========================================================================
// 3. Megmaradási logika (fagypont alatti vs. fagypont feletti)
// =========================================================================
test('Hó megmaradás: fagypont alatt high, fagypont felett low/uncertain', () => {
  const nowMs = Date.UTC(2026, 10, 24, 12, 0, 0);
  const def = MODEL_DEFINITIONS[1];

  const coldNorm = normalizeOpenMeteoModel(
    def,
    buildMockOpenMeteoJson({ startMs: nowMs, tempC: -4.0, snowPerHourCm: 1.5, snowDepthGainPerSnowHourM: 0.014 }),
    null,
    nowMs
  );
  assert.equal(coldNorm.windows['48'].retention.level, 'high');

  const warmNorm = normalizeOpenMeteoModel(
    def,
    buildMockOpenMeteoJson({ startMs: nowMs, tempC: 2.3, rh: 92, snowPerHourCm: 1.0, snowDepthGainPerSnowHourM: 0.001 }),
    null,
    nowMs
  );
  assert.equal(warmNorm.windows['48'].retention.level, 'low');
});

// =========================================================================
// 4. Konszenzus küszöbök tesztelése
// =========================================================================
test('Konszenzus küszöbök: Jó, Közepes, Gyenge egyezés és 0 cm száraz egyezés', () => {
  const makeFakeModel = (id, freshSnowCm, partialCoverage = false) => ({
    id,
    shortName: id,
    status: 'ok',
    metadata: { validHorizonHours: partialCoverage ? 48 : 96 },
    hourly: [{ epochMs: 1795521600000, tempC: -2, rh: 80, snowfallCm: 0, precipitationMm: 0, snowDepthM: 0 }],
    windows: {
      '48': {
        partialCoverage,
        freshSnowCm,
        totalPrecipMm: freshSnowCm,
        phaseFlags: { hasDrySnow: freshSnowCm > 0, hasWetSnow: false, hasSleet: false, hasRain: false, hasFreezingRain: false },
        snowDepth: { currentCm: 0, at24hCm: freshSnowCm * 0.6, at48hCm: freshSnowCm * 0.8, at72hCm: null },
        snowStart: freshSnowCm > 0 ? { epochMs: 1795543200000 } : null,
        snowPeak: freshSnowCm > 0 ? { epochMs: 1795550400000, cmPerHour: 1 } : null,
        snowEnd: freshSnowCm > 0 ? { epochMs: 1795561200000 } : null,
      },
    },
  });

  // Jó egyezés (8, 9, 10, 9.5 cm -> spread 2.0 <= 3.0)
  const good = computeWindowConsensus(
    [makeFakeModel('a', 8), makeFakeModel('b', 9), makeFakeModel('c', 10), makeFakeModel('d', 9.5)],
    48
  );
  assert.equal(good.agreement.level, 'good');
  assert.equal(good.freshSnow.median, 9.3);

  // Közepes egyezés (6, 9, 11, 12 cm -> spread 6.0 <= 8.0)
  const mod = computeWindowConsensus(
    [makeFakeModel('a', 6), makeFakeModel('b', 9), makeFakeModel('c', 11), makeFakeModel('d', 12)],
    48
  );
  assert.equal(mod.agreement.level, 'moderate');

  // Gyenge egyezés (0, 2, 12, 18 cm -> éles ellentmondás és nagy szórás)
  const weak = computeWindowConsensus(
    [makeFakeModel('a', 0), makeFakeModel('b', 2), makeFakeModel('c', 12), makeFakeModel('d', 18)],
    48
  );
  assert.equal(weak.agreement.level, 'weak');

  // Száraz egyezés (mindenki 0 cm)
  const dry = computeWindowConsensus(
    [makeFakeModel('a', 0), makeFakeModel('b', 0), makeFakeModel('c', 0)],
    48
  );
  assert.equal(dry.agreement.level, 'good');
  assert.equal(dry.snowingModelCount, 0);
  assert.ok(CONSENSUS_THRESHOLDS.GOOD_MAX_SPREAD_CM === 3.0);
});

// =========================================================================
// 5. Backend integrációs tesztek (mocked fetch + minden hibaág)
// =========================================================================
test('Minden modell elérhető + ICON-D2 72 órás horizont kizárás (nem hamisít 72h adatot)', async () => {
  clearSnowForecastCache();
  const nowMs = Date.UTC(2026, 10, 24, 12, 0, 0);
  const fetchMock = createMockFetch({
    nowMs,
    modelConfigs: {
      icon_d2: { snowPerHourCm: 1.5, snowDurationHours: 6 }, // 9 cm (csak 48h érvényes)
      icon_eu: { snowPerHourCm: 1.2, snowDurationHours: 8 }, // 9.6 cm
      ecmwf_ifs: { snowPerHourCm: 1.0, snowDurationHours: 8 }, // 8 cm
      gfs_global: { snowPerHourCm: 1.1, snowDurationHours: 8 }, // 8.8 cm
      best_match: { snowPerHourCm: 1.2, snowDurationHours: 8 }, // 9.6 cm
    },
  });

  const { statusCode, payload } = await buildSnowForecastPayload({
    fetchImpl: fetchMock,
    nowMs,
    skipCache: true,
  });

  assert.equal(statusCode, 200);
  assert.equal(payload.dataQuality.availableModels, 5);
  // 48h ablakban az ICON-D2 benne van; a Best Match összetett termék, nem szavaz (4 önálló modell)
  assert.equal(payload.consensus['48'].availableModelCount, 4);
  assert.equal(payload.consensus['48'].excludedPartialModels.length, 0);
  // 72h ablakban az ICON-D2 partialCoverage=true -> ki van zárva a 72h konszenzusból!
  assert.equal(payload.consensus['72'].availableModelCount, 3);
  assert.equal(payload.consensus['72'].excludedPartialModels.length, 1);
  assert.equal(payload.consensus['72'].excludedPartialModels[0].id, 'icon_d2');
  // ECMWF freezingLevelM marad null (nem kitalált)
  const ecmwf = payload.models.find((m) => m.id === 'ecmwf_ifs');
  assert.equal(ecmwf.hourly[0].freezingLevelM, null);
});

test('Egy modell nem elérhető (HTTP 500) + API timeout kezelése nem töri el a többi modellt', async () => {
  clearSnowForecastCache();
  const nowMs = Date.UTC(2026, 10, 24, 12, 0, 0);
  const fetchMock = createMockFetch({
    nowMs,
    failModels: {
      gfs_global: 'http500',
      icon_d2: 'timeout',
    },
  });

  const { statusCode, payload } = await buildSnowForecastPayload({
    fetchImpl: fetchMock,
    nowMs,
    skipCache: true,
  });

  assert.equal(statusCode, 200);
  assert.equal(payload.dataQuality.availableModels, 3);
  const gfs = payload.models.find((m) => m.id === 'gfs_global');
  const d2 = payload.models.find((m) => m.id === 'icon_d2');
  assert.equal(gfs.status, 'error');
  assert.equal(d2.status, 'error');
  assert.ok(payload.consensus['48'].failedModels.length === 2);
});

test('Több modell nem elérhető (csak 1 válaszol) -> insufficient egyezés, HTTP 200', async () => {
  clearSnowForecastCache();
  const nowMs = Date.UTC(2026, 10, 24, 12, 0, 0);
  const fetchMock = createMockFetch({
    nowMs,
    failModels: {
      icon_d2: 'http500',
      icon_eu: 'timeout',
      gfs_global: 'http500',
      best_match: 'timeout',
    },
  });

  const { statusCode, payload } = await buildSnowForecastPayload({
    fetchImpl: fetchMock,
    nowMs,
    skipCache: true,
  });

  assert.equal(statusCode, 200);
  assert.equal(payload.dataQuality.availableModels, 1);
  assert.equal(payload.consensus['48'].agreement.level, 'insufficient');
});

test('Minden modell hibázik -> HTTP 503 strukturált hibaüzenet', async () => {
  clearSnowForecastCache();
  const nowMs = Date.UTC(2026, 10, 24, 12, 0, 0);
  const fetchMock = createMockFetch({
    nowMs,
    failModels: {
      icon_d2: 'http500',
      icon_eu: 'http500',
      ecmwf_ifs: 'http500',
      gfs_global: 'http500',
      best_match: 'timeout',
    },
  });

  const { statusCode, payload } = await buildSnowForecastPayload({
    fetchImpl: fetchMock,
    nowMs,
    skipCache: true,
  });

  assert.equal(statusCode, 503);
  assert.ok(payload.error);
});

test('Hiányzó hóadat (null snowfall) nem okoz NaN-t és nem talál ki értéket', async () => {
  clearSnowForecastCache();
  const nowMs = Date.UTC(2026, 10, 24, 12, 0, 0);
  const fetchMock = createMockFetch({
    nowMs,
    modelConfigs: {
      ecmwf_ifs: { nullSnowfall: true, rainPerHourMm: 0 },
    },
  });

  const { payload } = await buildSnowForecastPayload({ fetchImpl: fetchMock, nowMs, skipCache: true });
  const ecmwf = payload.models.find((m) => m.id === 'ecmwf_ifs');
  assert.equal(ecmwf.windows['48'].hasSnowfall, false);
  assert.equal(ecmwf.windows['48'].freshSnowCm, null);
});

test('Nulla hó, csak eső esetén nem jelez havazást', async () => {
  clearSnowForecastCache();
  const nowMs = Date.UTC(2026, 10, 24, 12, 0, 0);
  const fetchMock = createMockFetch({
    nowMs,
    modelConfigs: {
      icon_d2: { snowPerHourCm: 0, rainPerHourMm: 2.5, tempC: 5.5 },
      icon_eu: { snowPerHourCm: 0, rainPerHourMm: 2.0, tempC: 5.0 },
      ecmwf_ifs: { snowPerHourCm: 0, rainPerHourMm: 1.8, tempC: 5.2 },
      gfs_global: { snowPerHourCm: 0, rainPerHourMm: 3.0, tempC: 6.0 },
      best_match: { snowPerHourCm: 0, rainPerHourMm: 2.2, tempC: 5.3 },
    },
  });

  const { payload } = await buildSnowForecastPayload({ fetchImpl: fetchMock, nowMs, skipCache: true });
  assert.equal(payload.consensus['48'].freshSnow.median, 0);
  assert.equal(payload.consensus['48'].snowingModelCount, 0);
  assert.match(payload.assessment['48'].headline, /nem várható számottevő havazás/i);
});

test('Elavult modelladat detektálása és jelzése', async () => {
  clearSnowForecastCache();
  const nowMs = Date.UTC(2026, 10, 24, 12, 0, 0);
  const oldSec = Math.floor((nowMs - 20 * 3600000) / 1000); // 20 órája futott (limit 3+6 = 9h)
  const fetchMock = createMockFetch({
    nowMs,
    metaOverrides: {
      dwd_icon_eu: { runInitSec: oldSec, runAvailSec: oldSec },
    },
  });

  const { payload } = await buildSnowForecastPayload({ fetchImpl: fetchMock, nowMs, skipCache: true });
  const iconEu = payload.models.find((m) => m.id === 'icon_eu');
  assert.equal(iconEu.metadata.isStale, true);
  assert.ok(payload.dataQuality.staleModels.includes('icon_eu'));
  assert.ok(payload.assessment['48'].caveats.some((c) => c.includes('ICON-EU')));
});

test('roundSnowDisplay elkerüli a hamis tizedes pontosságot', () => {
  assert.equal(roundSnowDisplay(0.02), 0);
  assert.equal(roundSnowDisplay(0.34), 0.3);
  assert.equal(roundSnowDisplay(4.74), 4.5);
  assert.equal(roundSnowDisplay(12.4), 12);
});

// =========================================================================
// 6. Hivatalos MeteoAlarm HungaroMet XML szétválasztás teszt
// =========================================================================
test('parseMeteoAlarmHungaryXml szétválasztja Vas vármegyét az ország többi részétől és kiszűri a lejártat', () => {
  const nowMs = Date.UTC(2026, 10, 24, 12, 0, 0);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <feed xmlns="http://www.w3.org/2005/Atom" xmlns:cap="urn:oasis:names:tc:emergency:cap:1.2">
    <entry>
      <cap:geocode><valueName>NUTS2</valueName><value>HU22</value></cap:geocode>
      <cap:areaDesc>Western Transdanubia</cap:areaDesc>
      <cap:event>orange snow warning</cap:event>
      <cap:severity>Severe</cap:severity>
      <cap:onset>2026-11-24T12:00:00+00:00</cap:onset>
      <cap:expires>2026-11-25T18:00:00+00:00</cap:expires>
    </entry>
    <entry>
      <cap:geocode><valueName>NUTS2</valueName><value>HU31</value></cap:geocode>
      <cap:areaDesc>Northern Hungary</cap:areaDesc>
      <cap:event>yellow snow-ice warning</cap:event>
      <cap:severity>Moderate</cap:severity>
      <cap:onset>2026-11-24T12:00:00+00:00</cap:onset>
      <cap:expires>2026-11-25T18:00:00+00:00</cap:expires>
    </entry>
    <entry>
      <cap:geocode><valueName>NUTS2</valueName><value>HU22</value></cap:geocode>
      <cap:areaDesc>Western Transdanubia</cap:areaDesc>
      <cap:event>red snow warning</cap:event>
      <cap:severity>Extreme</cap:severity>
      <cap:onset>2026-11-20T00:00:00+00:00</cap:onset>
      <cap:expires>2026-11-21T00:00:00+00:00</cap:expires>
    </entry>
  </feed>`;

  const res = parseMeteoAlarmHungaryXml(xml, nowMs);
  assert.equal(res.available, true);
  assert.equal(res.localWarnings.length, 1);
  assert.equal(res.localWarnings[0].level, 'orange');
  assert.equal(res.nationalSnowWarnings.length, 1);
  assert.equal(res.nationalSnowWarnings[0].areaDesc, 'Northern Hungary');
  // Exportált modul-egységek elérhetőségének ellenőrzése
  assert.equal(typeof summarizeModelWindow, 'function');
  assert.equal(typeof assessSnowRetention, 'function');
  assert.equal(typeof generateSnowAssessment, 'function');
  assert.equal(typeof snowHandler, 'function');
});



test('Best Match nem szavaz a konszenzusban, de a modellek között látható marad', async () => {
  clearSnowForecastCache();
  const nowMs = Date.UTC(2026, 10, 24, 12, 0, 0);
  const fetchMock = createMockFetch({
    nowMs,
    modelConfigs: {
      icon_d2: { snowPerHourCm: 0, snowDurationHours: 0 },
      icon_eu: { snowPerHourCm: 0, snowDurationHours: 0 },
      ecmwf_ifs: { snowPerHourCm: 0, snowDurationHours: 0 },
      gfs_global: { snowPerHourCm: 0, snowDurationHours: 0 },
      best_match: { snowPerHourCm: 3, snowDurationHours: 10 }, // kilógó érték, nem számíthat bele
    },
  });
  const { payload } = await buildSnowForecastPayload({ fetchImpl: fetchMock, nowMs, skipCache: true });
  assert.ok(payload.models.some((m) => m.id === 'best_match' && m.status === 'ok'));
  assert.equal(payload.consensus['48'].availableModelCount, 4);
  assert.equal(payload.consensus['48'].snowingModelCount, 0);
});

test('Ha nincs legalább 2 teljes lefedettségű önálló modell, a 72 órás konszenzus nem értékelhető', async () => {
  clearSnowForecastCache();
  const nowMs = Date.UTC(2026, 10, 24, 12, 0, 0);
  const fetchMock = createMockFetch({
    nowMs,
    modelConfigs: {
      icon_d2: { snowPerHourCm: 1.5, snowDurationHours: 6 },
      icon_eu: { snowPerHourCm: 1.2, snowDurationHours: 8 },
      ecmwf_ifs: { snowPerHourCm: 1.0, snowDurationHours: 8 },
      gfs_global: { snowPerHourCm: 1.1, snowDurationHours: 8 },
      best_match: { snowPerHourCm: 1.2, snowDurationHours: 8 },
    },
    failModels: { ecmwf_ifs: 'http500', gfs_global: 'http500' },
  });
  const { payload } = await buildSnowForecastPayload({ fetchImpl: fetchMock, nowMs, skipCache: true });
  // 72h: csak az ICON-EU teljes (az ICON-D2 részleges) -> nem értékelhető, részleges nem csúszik be
  assert.equal(payload.consensus['72'].agreement.level, 'insufficient');
  assert.equal(payload.consensus['72'].availableModelCount, 0);
});
