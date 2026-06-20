// src/api/weather.js

export async function fetchCurrentWeather() {
  const CURRENT_URL = 'https://api2.smartmixin.io/api/stations/72461/?refresh=1';
  try {
    const res = await fetch(CURRENT_URL, {
      headers: {
        'Accept': 'application/json',
        'X-SmartMixin-Context': 'UI'
      }
    });
    if (!res.ok) throw new Error(`Kőszeg API returned status ${res.status}`);
    const data = await res.json();
    const last = data.last_measure || {};

    const temp = typeof last.T === 'number' ? Math.round(last.T) : '--';
    const u = last.U ?? 50;
    const rr = last.RR_1H ?? 0;
    let icon = '01d';
    let description = 'Tiszta idő';

    if (rr > 1.0) {
      icon = '09d';
      description = 'Esős időjárás';
    } else if (rr > 0.1) {
      icon = '10d';
      description = 'Szemerkél az eső';
    } else if (u > 90) {
      icon = '50d';
      description = 'Párás, ködös levegő';
    } else if (u > 80) {
      icon = '04d';
      description = 'Borús, szürke idő';
    } else if (u > 60) {
      icon = '03d';
      description = 'Változóan felhős';
    } else if (u > 40) {
      icon = '02d';
      description = 'Kevés felhő, kellemes idő';
    }

    return {
      temp,
      icon,
      description
    };
  } catch (e) {
    console.error("Failed to fetch Kőszeg weather station data:", e);
    return {
      temp: '--',
      icon: '01d',
      description: 'Nincs adat'
    };
  }
}

export async function fetchForecastWeather() {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=47.3971&longitude=16.546&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Europe%2FBerlin';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Hiba a külső előrejelzés lekérésekor');
    const data = await res.json();
    const daily = data.daily || {};
    
    // Map response to days array
    const days = daily.time.map((date, idx) => {
      const code = daily.weathercode[idx];
      let icon = '01d';
      let description = 'Napos idő';
      
      if (code === 0) { icon = '01d'; description = 'Tiszta égbolt'; }
      else if (code <= 3) { icon = '02d'; description = 'Változóan felhős'; }
      else if (code === 45 || code === 48) { icon = '50d'; description = 'Ködös, párás'; }
      else if (code >= 51 && code <= 55) { icon = '10d'; description = 'Szemerkélő eső'; }
      else if (code >= 61 && code <= 65) { icon = '09d'; description = 'Esős idő'; }
      else if (code >= 71 && code <= 75) { icon = '13d'; description = 'Havazás'; }
      else if (code >= 80 && code <= 82) { icon = '09d'; description = 'Záporok'; }
      else if (code >= 95) { icon = '11d'; description = 'Zivatarok'; }
      
      return {
        date,
        temp_min: daily.temperature_2m_min[idx],
        temp_max: daily.temperature_2m_max[idx],
        precipitation: daily.precipitation_sum[idx],
        icon,
        description
      };
    });
    
    return days;
  } catch (e) {
    console.error("Failed to fetch OpenMeteo forecast:", e);
    return [];
  }
}

export async function fetchUpcomingWeather() {
  return fetchForecastWeather();
}
