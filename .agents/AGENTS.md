# Projekt-specifikus Fejlesztési Szabályok

## Verziókezelés szabályai
- **Kötelező verzióemelés**: Bármilyen távoli repóba (push) való feltöltés előtt **mindig** kötelező megemelni a verziószámot a projekt összes releváns fájljában.
- **Érintett fájlok**:
  - `package.json` (`version` mező)
  - `package-lock.json` (automatikus frissítés `npm install` által)
  - `src/App.jsx` (a láblécben megjelenő `Version` kiírás)
  - `public/manifest.json` (`version` mező)
  - `public/sw.js` (a tetején lévő verzió komment, valamint a `CACHE_NAME` gyorsítótár-kulcs verziószáma, pl. `koszeg-weather-cache-v2.2.5`)
  - `PROJECT_INFO.md` (a verzió státusza a legutóbbi fejleményeknél)
