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
  updated_at: new Date().toISOString()
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
    return data || DEFAULT_FORECAST;
  } catch (err) {
    console.error('Failed to load forecast from Supabase, serving offline fallback data:', err);
    return DEFAULT_FORECAST;
  }
}

export async function saveForecast(title, content) {
  if (!supabase) {
    throw new Error('Supabase nincs konfigurálva.');
  }
  const { data, error } = await supabase
    .from('local_forecast')
    .upsert({ id: 1, title, content, updated_at: new Date().toISOString() })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

