// Meteocons (Fill stílus) holdfázis-ikonok — a getMoonPhase() által adott
// magyar fázisnevekhez illesztve.
import moonNew from '@meteocons/svg/fill/moon-new.svg?url';
import moonWaxingCrescent from '@meteocons/svg/fill/moon-waxing-crescent.svg?url';
import moonFirstQuarter from '@meteocons/svg/fill/moon-first-quarter.svg?url';
import moonWaxingGibbous from '@meteocons/svg/fill/moon-waxing-gibbous.svg?url';
import moonFull from '@meteocons/svg/fill/moon-full.svg?url';
import moonWaningGibbous from '@meteocons/svg/fill/moon-waning-gibbous.svg?url';
import moonLastQuarter from '@meteocons/svg/fill/moon-last-quarter.svg?url';
import moonWaningCrescent from '@meteocons/svg/fill/moon-waning-crescent.svg?url';
import moonriseIcon from '@meteocons/svg/fill/moonrise.svg?url';
import moonsetIcon from '@meteocons/svg/fill/moonset.svg?url';

export const MOON_PHASE_ICONS = {
  'Újhold': moonNew,
  'Növő sarló': moonWaxingCrescent,
  'Első negyed': moonFirstQuarter,
  'Növő hold': moonWaxingGibbous,
  'Telihold': moonFull,
  'Fogyó hold': moonWaningGibbous,
  'Utolsó negyed': moonLastQuarter,
  'Fogyó sarló': moonWaningCrescent,
};

export { moonriseIcon, moonsetIcon };
