/**
 * Netlify Scheduled Function: auto-evaluate
 *
 * Runs automatically every night to evaluate yesterday's Tippelde predictions.
 * Can also be triggered manually via GET/POST.
 */

import { createClient } from '@supabase/supabase-js';

const STATION_ID = 72461;
const API_BASE = 'https://api2.smartmixin.io';
const HISTORY_URL = `${API_BASE}/api/measures/`;
const CONTACT_EMAIL = 'mailto:koszegapp@gmail.com';

// Timezone-safe date ranges for Europe/Budapest
function getBudapestUnixRange(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  
  // We construct the date in UTC representing the Budapest local date
  const dateStartUTC = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  
  // We use Intl to determine how that UTC time is offset in Europe/Budapest
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Budapest',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(dateStartUTC);
  const mapped = {};
  parts.forEach(p => mapped[p.type] = p.value);
  const budapestDate = new Date(`${mapped.year}-${mapped.month}-${mapped.day}T${mapped.hour}:${mapped.minute}:${mapped.second}Z`);
  
  // The offset difference in milliseconds
  const diffMs = dateStartUTC.getTime() - budapestDate.getTime();
  
  const startLocal = new Date(dateStartUTC.getTime() + diffMs);
  const endLocal = new Date(Date.UTC(y, m - 1, d, 23, 59, 59).getTime() + diffMs);
  
  return {
    startUnix: Math.floor(startLocal.getTime() / 1000),
    endUnix: Math.floor(endLocal.getTime() / 1000)
  };
}

export async function handler(event, context) {
  console.log('[auto-evaluate] Auto-evaluation function triggered.');

  // --- Calculate Yesterday's Date in Budapest Timezone ---
  const now = new Date();
  const todayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Budapest',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = todayFormatter.formatToParts(now);
  const mappedParts = {};
  parts.forEach(p => mappedParts[p.type] = p.value);

  const year = parseInt(mappedParts.year, 10);
  const month = parseInt(mappedParts.month, 10);
  const day = parseInt(mappedParts.day, 10);

  // Subtract 1 day in UTC to get yesterday
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 1);

  const yStr = date.getUTCFullYear();
  const mStr = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dStr = String(date.getUTCDate()).padStart(2, '0');

  // Let's support an override via query parameter (?date=YYYY-MM-DD) for manual runs
  let evalDate = `${yStr}-${mStr}-${dStr}`;
  if (event.queryStringParameters && event.queryStringParameters.date) {
    const customDate = event.queryStringParameters.date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(customDate)) {
      evalDate = customDate;
      console.log(`[auto-evaluate] Date override provided: ${evalDate}`);
    }
  }

  console.log(`[auto-evaluate] Evaluating predictions for target date: ${evalDate}`);

  // --- Supabase Client Server-side (service role key preferred to bypass RLS writes) ---
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[auto-evaluate] Supabase credentials missing.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Supabase credentials missing in server environment.' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // --- Fetch Unprocessed Predictions ---
  const { data: predictions, error: fetchErr } = await supabase
    .from('tippelde_predictions')
    .select('*')
    .eq('target_date', evalDate)
    .eq('processed', false);

  if (fetchErr) {
    console.error('[auto-evaluate] Failed to fetch predictions from Supabase:', fetchErr);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch predictions from Supabase: ' + fetchErr.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  if (!predictions || predictions.length === 0) {
    console.log(`[auto-evaluate] No unprocessed predictions found for target date: ${evalDate}`);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'No unprocessed predictions found for date: ' + evalDate, count: 0 }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  console.log(`[auto-evaluate] Found ${predictions.length} unprocessed predictions to score.`);

  // --- Retrieve Actual Max Temperature for Target Date ---
  let actualTemp = null;
  const { startUnix, endUnix } = getBudapestUnixRange(evalDate);
  console.log(`[auto-evaluate] Querying SmartMixin history from Unix ${startUnix} to ${endUnix}`);

  try {
    const body = {
      series: [{
        station: STATION_ID,
        metrics: ['T'],
        scale: 'max',
        start: startUnix,
        end: endUnix,
        sharp: true
      }]
    };
    const res = await fetch(HISTORY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-SmartMixin-Context': 'UI'
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json[0] && json[0].results && Array.isArray(json[0].results.T)) {
        const temps = json[0].results.T.filter(v => v !== null && v !== undefined);
        if (temps.length > 0) {
          actualTemp = Math.max(...temps);
          console.log(`[auto-evaluate] Successfully fetched from SmartMixin. Max Temperature: ${actualTemp} °C`);
        }
      }
    } else {
      console.warn(`[auto-evaluate] SmartMixin API history responded with HTTP error: ${res.status}`);
    }
  } catch (err) {
    console.error('[auto-evaluate] Failed to query SmartMixin API:', err);
  }

  // --- Fallback: Open-Meteo Archive API ---
  if (actualTemp === null) {
    console.warn('[auto-evaluate] SmartMixin API failed/empty. Trying Open-Meteo Archive fallback...');
    try {
      const openMeteoUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=47.3887&longitude=16.5411&start_date=${evalDate}&end_date=${evalDate}&daily=temperature_2m_max&timezone=Europe%2FBerlin`;
      const openMeteoRes = await fetch(openMeteoUrl);
      if (openMeteoRes.ok) {
        const openMeteoJson = await openMeteoRes.json();
        if (openMeteoJson && openMeteoJson.daily && Array.isArray(openMeteoJson.daily.temperature_2m_max) && openMeteoJson.daily.temperature_2m_max[0] !== null) {
          actualTemp = openMeteoJson.daily.temperature_2m_max[0];
          console.log(`[auto-evaluate] Fallback succeeded. Open-Meteo Max Temperature: ${actualTemp} °C`);
        }
      } else {
        console.error(`[auto-evaluate] Open-Meteo responded with HTTP error: ${openMeteoRes.status}`);
      }
    } catch (err) {
      console.error('[auto-evaluate] Failed to query Open-Meteo fallback API:', err);
    }
  }

  if (actualTemp === null) {
    console.error('[auto-evaluate] All temperature sources failed. Cannot perform auto-evaluation.');
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Could not retrieve actual temperature data for: ' + evalDate }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  // --- Grade Predictions ---
  const playerIds = predictions.map(p => p.player_id);
  const { data: currentScores, error: scoreErr } = await supabase
    .from('tippelde_scores')
    .select('*')
    .in('player_id', playerIds);

  if (scoreErr) {
    console.error('[auto-evaluate] Failed to fetch current scores from Supabase:', scoreErr);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch current scores: ' + scoreErr.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  const scoreMap = new Map(currentScores?.map(s => [s.player_id, s]) || []);

  const scoreUpserts = [];
  const predictionUpdates = [];

  for (const pred of predictions) {
    const diff = Math.abs(pred.prediction - actualTemp);
    let awardedPoints = 1; // Részvételi pont
    if (diff === 0) awardedPoints = 15;
    else if (diff <= 0.2) awardedPoints = 10;
    else if (diff <= 0.5) awardedPoints = 8;
    else if (diff <= 1.0) awardedPoints = 5;
    else if (diff <= 2.0) awardedPoints = 2;

    const current = scoreMap.get(pred.player_id) || { player_id: pred.player_id, name: pred.name, points: 0, predictions_count: 0 };
    scoreUpserts.push({
      player_id: pred.player_id,
      name: pred.name,
      points: current.points + awardedPoints,
      predictions_count: current.predictions_count + 1,
      updated_at: new Date().toISOString()
    });

    predictionUpdates.push({
      id: pred.id,
      points_earned: awardedPoints,
      processed: true
    });
  }

  // --- Write updates to Database ---
  console.log(`[auto-evaluate] Writing ${scoreUpserts.length} score updates and ${predictionUpdates.length} prediction flags.`);
  
  const { error: upsertErr } = await supabase
    .from('tippelde_scores')
    .upsert(scoreUpserts);

  if (upsertErr) {
    console.error('[auto-evaluate] Failed to upsert scores:', upsertErr);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save evaluated scores: ' + upsertErr.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  const { error: updateErr } = await supabase
    .from('tippelde_predictions')
    .upsert(predictionUpdates);

  if (updateErr) {
    console.error('[auto-evaluate] Failed to update predictions:', updateErr);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update prediction records: ' + updateErr.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  console.log(`[auto-evaluate] Successfully finished auto-evaluation for ${evalDate}.`);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Sikeres kiértékelés a következő dátumra: ${evalDate}`,
      actual_temp: actualTemp,
      predictions_count: predictions.length
    }),
    headers: { 'Content-Type': 'application/json' }
  };
}
