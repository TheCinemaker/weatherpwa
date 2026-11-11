// Meteocons (Fill stílus, animált SVG) — a pillanatnyi időjárás-állapot nagy,
// animált ikonja a hero-kártyán. Csak a tényleges "égbolt-állapot" ikonokhoz
// használjuk; a mérési/UI ikonok (hőmérő, szél, stb.) Phosphor Icons-ból jönnek.
import clearDay from '@meteocons/svg/fill/clear-day.svg?url';
import clearNight from '@meteocons/svg/fill/clear-night.svg?url';
import partlyCloudyDay from '@meteocons/svg/fill/partly-cloudy-day.svg?url';
import partlyCloudyNight from '@meteocons/svg/fill/partly-cloudy-night.svg?url';
import overcastDay from '@meteocons/svg/fill/overcast-day.svg?url';
import overcastNight from '@meteocons/svg/fill/overcast-night.svg?url';
import fogDay from '@meteocons/svg/fill/fog-day.svg?url';
import fogNight from '@meteocons/svg/fill/fog-night.svg?url';
import drizzle from '@meteocons/svg/fill/drizzle.svg?url';
import rain from '@meteocons/svg/fill/rain.svg?url';
import extremeRain from '@meteocons/svg/fill/extreme-rain.svg?url';
import thunderstormsDay from '@meteocons/svg/fill/thunderstorms-day.svg?url';
import thunderstormsNight from '@meteocons/svg/fill/thunderstorms-night.svg?url';
import snow from '@meteocons/svg/fill/snow.svg?url';
import wind from '@meteocons/svg/fill/wind.svg?url';

export const CONDITION_ICONS = {
  'clear-day': clearDay,
  'clear-night': clearNight,
  'partly-cloudy-day': partlyCloudyDay,
  'partly-cloudy-night': partlyCloudyNight,
  'overcast-day': overcastDay,
  'overcast-night': overcastNight,
  'fog-day': fogDay,
  'fog-night': fogNight,
  drizzle,
  rain,
  'heavy-rain': extremeRain,
  'thunderstorm-day': thunderstormsDay,
  'thunderstorm-night': thunderstormsNight,
  snow,
  windy: wind,
};
