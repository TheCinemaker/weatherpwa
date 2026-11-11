// Open-Meteo WMO weathercode (+ szélsebesség, nappal/éjszaka) → videó-kategória.
// Minden alap-kategóriának van nappali és éjszakai változata is, így a hero
// videó napszak-hiteles marad borult/esős/havas időben is, nem csak derültben.
// A kategóriakulcsok megegyeznek a public/videos/<kulcs>.mp4 fájlnevekkel.
export const WEATHER_VIDEO_BASE_CATEGORIES = [
  'clear', 'partly-cloudy', 'overcast', 'fog',
  'drizzle', 'rain', 'heavy-rain', 'thunderstorm', 'snow', 'windy',
];

export const WEATHER_VIDEO_CATEGORIES = WEATHER_VIDEO_BASE_CATEGORIES.flatMap(
  (c) => [`${c}-day`, `${c}-night`]
);

const WINDY_THRESHOLD_KMH = 35;

function getBaseCategory({ weathercode, windSpeedKmh = 0 } = {}) {
  if (weathercode == null) return 'clear';

  if (weathercode >= 95) return 'thunderstorm';
  if (weathercode >= 85 && weathercode <= 86) return 'snow';
  if (weathercode >= 71 && weathercode <= 77) return 'snow';
  if (weathercode >= 80 && weathercode <= 82) return 'heavy-rain';
  if (weathercode >= 65 && weathercode <= 67) return 'heavy-rain';
  if (weathercode >= 61 && weathercode <= 64) return 'rain';
  if (weathercode >= 51 && weathercode <= 57) return 'drizzle';
  if (weathercode === 45 || weathercode === 48) return 'fog';

  if (windSpeedKmh >= WINDY_THRESHOLD_KMH) return 'windy';

  if (weathercode === 0) return 'clear';
  if (weathercode <= 2) return 'partly-cloudy';
  return 'overcast';
}

export function getWeatherVideoCategory({ weathercode, windSpeedKmh = 0, isNight = false } = {}) {
  const base = getBaseCategory({ weathercode, windSpeedKmh });
  return `${base}-${isNight ? 'night' : 'day'}`;
}
