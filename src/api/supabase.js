import { createClient } from '@supabase/supabase-js';

// Load environmental parameters, fallback to blank strings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Mock local database fallback seed data for city moments
const MOCK_MOMENTS = [
  {
    id: 'mock-1',
    photo_url: 'https://images.unsplash.com/photo-1548777123-e216912df7d8?w=800',
    caption: 'Hatalmas havazás a Kőszegi-hegységben! ❄️',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000 * 20).toISOString(),
    lat: 47.3971,
    lng: 16.546
  },
  {
    id: 'mock-2',
    photo_url: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800',
    caption: 'Látványos peremfelhő és villámlások a hegyek felett tegnap este. ⛈️',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    expires_at: new Date(Date.now() + 3600000 * 22).toISOString(),
    lat: 47.3971,
    lng: 16.546
  },
  {
    id: 'mock-3',
    photo_url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800',
    caption: 'Csodálatos napkelte az Írott-kő kilátóból! 🌅 Magasság: 884 méter.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    expires_at: new Date(Date.now() + 3600000 * 20).toISOString(),
    lat: 47.3971,
    lng: 16.546
  }
];

// Helper to fetch moments (using Supabase if configured, otherwise returning mock data)
export async function getMoments() {
  if (!supabase) {
    console.warn('Supabase is not configured yet. Returning mock seed moments data.');
    return MOCK_MOMENTS;
  }
  
  try {
    const { data, error } = await supabase
      .from('city_moments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(40);
      
    if (error) throw error;
    return data && data.length > 0 ? data : MOCK_MOMENTS;
  } catch (err) {
    console.error('Failed to load moments from Supabase, serving offline fallback data:', err);
    return MOCK_MOMENTS;
  }
}

const DEFAULT_FORECAST = {
  title: 'Helyzetjelentés: Lassú felmelegedés és záporok esélye',
  content: 'A mai napon a kőszegi hegyek felől érkező hűvösebb légtömegek hatása fokozatosan gyengül. Lassú felmelegedésre számíthatunk, de a délutáni órákban a megnövekvő fátyolfelhőzetből lokális záporok alakulhatnak ki. A csapadék mennyisége várhatóan 1-3 mm között mozog majd.',
  image_url: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800',
  title_3day: '3 napos elemzés: Hétvégi lehűlés és csapadék',
  content_3day: 'A következő három napban jelentős változás áll be térségünk időjárásában. Egy érkező hidegfront hatására a hőmérséklet visszaesik, és több hullámban várható eső, zápor, zivatar. Szombaton még kitarthat a meleg, de vasárnaptól markáns lehűlésre és megerősödő északnyugati szélre kell számítani.',
  image_url_3day: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800',
  card1_icon: 'sun',
  card1_desc: 'Derült, napos',
  card1_temp_min: 16,
  card1_temp_min_2: null,
  card1_temp_max: 31,
  card1_temp_max_2: null,
  card2_icon: 'cloud-sun',
  card2_desc: 'Gomolyfelhők, száraz',
  card2_temp_min: 17,
  card2_temp_min_2: null,
  card2_temp_max: 33,
  card2_temp_max_2: null,
  card3_icon: 'cloud-rain',
  card3_desc: 'Záporok, zivatarok',
  card3_temp_min: 15,
  card3_temp_min_2: null,
  card3_temp_max: 24,
  card3_temp_max_2: null,
  updated_at: new Date().toISOString(),
  announcement_text: '',
  announcement_active: false
};

export async function getForecast() {
  if (!supabase) {
    return DEFAULT_FORECAST;
  }
  try {
    const { data, error } = await supabase
      .from('local_forecast')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
      
    if (error) throw error;
    if (!data) return DEFAULT_FORECAST;
    
    // Safely merge with DEFAULT_FORECAST to handle missing columns or null values
    const merged = { ...DEFAULT_FORECAST };
    Object.keys(DEFAULT_FORECAST).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        merged[key] = data[key];
      }
    });
    return merged;
  } catch (err) {
    console.error('Failed to load forecast from Supabase, serving offline fallback data:', err);
    return DEFAULT_FORECAST;
  }
}

// A szerkeszthető előrejelzés-oszlopok engedélyezett listája.
const FORECAST_COLUMNS = [
  'title', 'content', 'image_url',
  'title_3day', 'content_3day', 'image_url_3day',
  'card1_icon', 'card1_desc', 'card1_temp_min', 'card1_temp_min_2', 'card1_temp_max', 'card1_temp_max_2',
  'card2_icon', 'card2_desc', 'card2_temp_min', 'card2_temp_min_2', 'card2_temp_max', 'card2_temp_max_2',
  'card3_icon', 'card3_desc', 'card3_temp_min', 'card3_temp_min_2', 'card3_temp_max', 'card3_temp_max_2',
  'announcement_text', 'announcement_active'
];

// Csak a ténylegesen megadott mezőket írjuk felül. Így a Dashboard (ami csak a
// címet/tartalmat/figyelmeztetést szerkeszti) nem törli ki a 3 napos és kártya
// adatokat, és fordítva sem.
export async function saveForecast(fields = {}) {
  if (!supabase) {
    throw new Error('Supabase nincs konfigurálva.');
  }
  if (fields == null || typeof fields !== 'object') {
    throw new Error('saveForecast: objektumot kell átadni a mezőkkel.');
  }

  const payload = { id: 1, updated_at: new Date().toISOString() };
  for (const key of FORECAST_COLUMNS) {
    if (fields[key] !== undefined) payload[key] = fields[key];
  }

  const { data, error } = await supabase
    .from('local_forecast')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMoment(id) {
  if (!supabase) {
    throw new Error('Supabase nincs konfigurálva.');
  }
  const { error } = await supabase
    .from('city_moments')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
}

export async function incrementPageViews() {
  if (!supabase) return 0;
  try {
    const { data, error } = await supabase.rpc('increment_page_view', { p_name: 'main' });
    if (!error) return data;
    
    console.warn('RPC function failed, falling back to select/upsert:', error);
    const { data: selectData, error: selectError } = await supabase
      .from('page_views')
      .select('views_count')
      .eq('page_name', 'main')
      .maybeSingle();
      
    if (selectError) throw selectError;
    const currentCount = selectData?.views_count ? parseInt(selectData.views_count, 10) : 0;
    const newCount = currentCount + 1;
    
    const { error: upsertError } = await supabase
      .from('page_views')
      .upsert({ page_name: 'main', views_count: newCount });
      
    if (upsertError) throw upsertError;
    return newCount;
  } catch (err) {
    console.error('Failed to increment page views:', err);
    return 0;
  }
}

export async function getPageViews() {
  if (!supabase) return 0;
  try {
    const { data, error } = await supabase
      .from('page_views')
      .select('views_count')
      .eq('page_name', 'main')
      .maybeSingle();
      
    if (error) throw error;
    return data?.views_count ? parseInt(data.views_count, 10) : 0;
  } catch (err) {
    console.error('Failed to get page views:', err);
    return 0;
  }
}

// --- Hírmorzsák ---
export async function getNewsBlurbs(limit = 8) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('news_blurbs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to load news blurbs:', err);
    return [];
  }
}

export async function addNewsBlurb(content, image_url = null) {
  if (!supabase) throw new Error('Supabase nincs konfigurálva.');
  const { data, error } = await supabase
    .from('news_blurbs')
    .insert({ content, image_url })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateNewsBlurb(id, content, image_url = null) {
  if (!supabase) throw new Error('Supabase nincs konfigurálva.');
  const { data, error } = await supabase
    .from('news_blurbs')
    .update({ content, image_url })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNewsBlurb(id) {
  if (!supabase) throw new Error('Supabase nincs konfigurálva.');
  const { error } = await supabase
    .from('news_blurbs')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

export async function getSponsors() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to load sponsors:', err);
    return [];
  }
}

export async function saveSponsor({ id, name, logo_url, description, website_url, flyer_url = null, contact = null, expires_at, active = true }) {
  if (!supabase) {
    throw new Error('Supabase nincs konfigurálva.');
  }
  const payload = { name, logo_url, description, website_url, flyer_url, contact, expires_at, active };
  if (id) payload.id = id;

  const { data, error } = await supabase
    .from('sponsors')
    .upsert(payload)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function deleteSponsor(id) {
  if (!supabase) {
    throw new Error('Supabase nincs konfigurálva.');
  }
  const { error } = await supabase
    .from('sponsors')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
}

export async function uploadSponsorLogo(file) {
  if (!supabase) {
    throw new Error('Supabase nincs konfigurálva.');
  }
  const filename = `logo_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage
    .from('sponsors')
    .upload(filename, file, { contentType: file.type || 'image/jpeg' });
    
  if (error) throw error;
  
  const { data } = supabase.storage.from('sponsors').getPublicUrl(filename);
  return data?.publicUrl;
}

export async function uploadForecastImage(file) {
  if (!supabase) {
    throw new Error('Supabase nincs konfigurálva.');
  }
  const filename = `forecast_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage
    .from('sponsors')
    .upload(filename, file, { contentType: file.type || 'image/jpeg' });
    
  if (error) throw error;
  
  const { data } = supabase.storage.from('sponsors').getPublicUrl(filename);
  return data?.publicUrl;
}

export async function getPushSubscriberCount() {
  if (!supabase) return 0;
  try {
    const { count, error } = await supabase
      .from('push_subscriptions')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count ?? 0;
  } catch (err) {
    console.error('Failed to get push subscriber count:', err);
    return 0;
  }
}

// --- Játékok & Dicsőségfal ---

export function getOrCreatePlayerId() {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('weather_player_id');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : 'p-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('weather_player_id', id);
  }
  return id;
}

export async function submitQuizResult(name, score, time_seconds) {
  if (!supabase) throw new Error('Supabase nincs konfigurálva.');
  const player_id = getOrCreatePlayerId();
  const { data, error } = await supabase
    .from('quiz_leaderboard')
    .insert({ player_id, name, score, time_seconds })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getQuizLeaderboard(limit = 10) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('quiz_leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .order('time_seconds', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to get quiz leaderboard:', err);
    return [];
  }
}

export async function checkQuizAlreadyPlayed() {
  if (!supabase) return false;
  try {
    const player_id = getOrCreatePlayerId();
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('quiz_leaderboard')
      .select('id')
      .eq('player_id', player_id)
      .eq('created_date', today)
      .maybeSingle();
    if (error) throw error;
    return data !== null;
  } catch (err) {
    console.error('Failed to check if quiz played:', err);
    return false;
  }
}

export async function checkTippeldeNameTaken(name, player_id) {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase
      .from('tippelde_scores')
      .select('player_id')
      .eq('name', name)
      .neq('player_id', player_id)
      .maybeSingle();
    if (error) throw error;
    return data !== null;
  } catch (err) {
    console.error('Failed to check name taken:', err);
    return false;
  }
}

export async function submitPrediction(name, prediction, target_date) {
  if (!supabase) throw new Error('Supabase nincs konfigurálva.');
  const player_id = getOrCreatePlayerId();
  const { data, error } = await supabase
    .from('tippelde_predictions')
    .upsert(
      { player_id, name, prediction, target_date, processed: false, points_earned: 0 },
      { onConflict: 'player_id,target_date' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function checkTippeldeAlreadyTipped(target_date) {
  if (!supabase) return null;
  try {
    const player_id = getOrCreatePlayerId();
    const { data, error } = await supabase
      .from('tippelde_predictions')
      .select('id, prediction')
      .eq('player_id', player_id)
      .eq('target_date', target_date)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to check if tipped:', err);
    return null;
  }
}

export async function getTippeldeLeaderboard(range = 'all', limit = 10) {
  if (!supabase) return [];
  try {
    const table = range === 'weekly' ? 'tippelde_weekly_scores' : 'tippelde_scores';
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('points', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error(`Failed to get tippelde leaderboard (${range}):`, err);
    return [];
  }
}

export async function getActiveTippeldePredictions() {
  if (!supabase) return [];
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const d = String(tomorrow.getDate()).padStart(2, '0');
    const targetDateStr = `${y}-${m}-${d}`;

    const { data, error } = await supabase
      .from('tippelde_predictions')
      .select('name, prediction, target_date, player_id')
      .eq('target_date', targetDateStr)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to get active predictions:', err);
    return [];
  }
}

export async function evaluatePredictions(target_date, actual_temp) {
  if (!supabase) throw new Error('Supabase nincs konfigurálva.');
  
  // 1. Lekérjük az adott naphoz tartozó, még nem feldolgozott tippeket
  const { data: predictions, error: fetchErr } = await supabase
    .from('tippelde_predictions')
    .select('*')
    .eq('target_date', target_date)
    .eq('processed', false);
    
  if (fetchErr) throw fetchErr;
  if (!predictions || predictions.length === 0) return { count: 0 };

  // 2. Lekérjük az érintett játékosok jelenlegi pontjait
  const playerIds = predictions.map(p => p.player_id);
  const { data: currentScores, error: scoreErr } = await supabase
    .from('tippelde_scores')
    .select('*')
    .in('player_id', playerIds);
    
  if (scoreErr) throw scoreErr;

  const scoreMap = new Map(currentScores?.map(s => [s.player_id, s]) || []);

  const scoreUpserts = [];
  const predictionUpdates = [];

  for (const pred of predictions) {
    const diff = Math.abs(pred.prediction - actual_temp);
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

  // 3. Elmentjük az új összesített pontszámokat
  const { error: upsertErr } = await supabase
    .from('tippelde_scores')
    .upsert(scoreUpserts);
    
  if (upsertErr) throw upsertErr;

  // 4. Megjelöljük a tippeket feldolgozottnak és elmentjük a kapott pontokat
  const { error: updateErr } = await supabase
    .from('tippelde_predictions')
    .upsert(predictionUpdates);
    
  if (updateErr) throw updateErr;

  return { count: predictions.length };
}


