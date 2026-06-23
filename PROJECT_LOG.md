# ⚠️ FONTOS: Olvasd el mielőtt bármit csinálsz!

> [!IMPORTANT]
> **Senki nem csinálhat semmit ezen a projekten, amíg ezt a Fejlesztési Naplót és a [PROJECT_INFO.md](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/PROJECT_INFO.md) fájlt teljes egészében el nem olvasta!**

---

# Fejlesztési Napló - Kőszeg Weather PWA

Ez a fájl tartalmazza a projekt során végrehajtott összes módosítást, verzióemelést és fejlesztési részletet kronológiai sorrendben, hogy a hibák visszakövethetőek legyenek.

---

## 📅 2026. 06. 23.

### 🏷️ Version 2.0.2 (Élesítve / Pusholva)
*   **Szürke betűszínek javítása (színpaletta módosítás)**:
    *   **Fájl**: [tailwind.config.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/tailwind.config.js)
    *   **Változtatás**: A `night` színcsoportban a `200`-as értéket `#94a3b8`-ról `#e2e8f0`-ra írtam át, a `300`-as értéket pedig `#64748b`-ről `#cbd5e1`-re. A `pebble` szín kulcsát szintén `#94a3b8`-ról `#e2e8f0`-ra módosítottam. Ezzel az egész appban lévő szürke másodlagos/harmadlagos szövegek törtfehér színűek lettek.
*   **Mobil fejléc címének nagyítása**:
    *   **Fájl**: [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx) (sor: ~276)
    *   **Változtatás**: A `kőszegiIdőjárásElőrejelzés` felirat betűméretét 3 képponttal növeltem: `text-[10px] sm:text-xs` osztályokról `text-[13px] sm:text-[15px]` osztályokra.
*   **Verziószám bevezetése**:
    *   **Fájl**: [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx) (sor: ~411)
    *   **Változtatás**: Bekerült a globális láblécbe a `Version: 2.0.2` felirat.
    *   **Fájl**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json) (sor: 4)
    *   **Változtatás**: Verzió átírva `"0.0.0"`-ról `"2.0.2"`-re.
    *   **Fájl**: [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (sor: 1-2)
    *   **Változtatás**: `CACHE_NAME` átnevezve `koszeg-weather-cache-v2.0.2`-re, és fejléc kommentként hozzáadva: `// Version: 2.0.2` (hogy a SW fájl bájt-szinten módosuljon a PWA frissítéshez).

---

### 🏷️ Version 2.0.5 (Élesítve / Pusholva)
*   **Betűszínek kontrasztjának finomítása a menükben és láblécben**:
    *   **Fájl**: [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx)
    *   **Változtatás**: Az oldalsávok (desktop sidebar) és a mobil hamburger menü (drawer) inaktív gombjainak színe `text-night-200/70` és `text-night-200/75` helyett tisztább, kontrasztosabb `text-white/80` és `text-white` lett. A lábléc és a szerzői jogi feliratok osztályai `text-night-200/45` helyett `text-white/50` és `text-white/70` lettek.
*   **Részletes mérési modál (popup) szövegek javítása**:
    *   **Fájl**: [src/pages/WeatherDashboard/StatDetailModal.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/StatDetailModal.jsx)
    *   **Változtatás**: A felugró ablakban lévő elavult szürke feliratokat (`text-night-200/55` és `text-night-200/45`) kicseréltem kontrasztosabb törtfehér `text-white/70` és `text-white/50` osztályokra.
*   **Csapadékradar beállítása alapértelmezettnek**:
    *   **Fájl**: [src/pages/Radar/Radar.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/Radar/Radar.jsx)
    *   **Változtatás**: A Windy.com térkép aloldalán a csapadékradar (`radar`) lett az első elem a listában, és a kezdőállapotát (`activeOverlay` state) is átállítottam `radar`-ra a `satellite` helyett. Az oldalon lévő másodlagos szövegek osztályait szintén fehérítettem (`text-white/60` és `text-white/80`).
*   **Grafikonok feliratainak fehérítése**:
    *   **Fájl**: [src/pages/WeatherDashboard/ChartCard.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/ChartCard.jsx)
    *   **Változtatás**: A Chart.js beállításainál (`makeChartOptions`) a tengelyek feliratainak és számértékeinek színét (`color`) `rgba(159, 192, 189, 0.6)` helyett jól látható, tiszta fehérre cseréltem: `rgba(255, 255, 255, 0.85)`. Ez a modális diagramokat is javította.
*   **Verzióemelés `2.0.5`-re**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (új cache: `koszeg-weather-cache-v2.0.5`).

---

### 🏷️ Version 2.0.7 (Élesítve / Pusholva)
*   **SEO Meta adatok és nyelv beállítása**:
    *   **Fájl**: [index.html](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/index.html)
    *   **Változtatás**: Nyelv átállítva magyarra (`<html lang="hu">`). Hozzáadtam a keresőoptimalizáláshoz szükséges alapvető címkéket (cím, leírás, kulcsszavak, szerző, robotok irányítása).
*   **Közösségi média link megosztási (Open Graph & Twitter Cards) támogatás**:
    *   **Fájl**: [index.html](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/index.html)
    *   **Változtatás**: Beillesztettem az összes Open Graph (`og:title`, `og:description`, `og:image`, `og:url`, `og:site_name`) és Twitter kártya tag-et, hogy a megosztott linkek kártyaként jelenjenek meg a Facebookon/Messengeren.
*   **Egyedi közösségi előnézeti kép legenerálása**:
    *   **Fájl**: [public/og-image.png](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/og-image.png) [NEW]
    *   **Változtatás**: Létrehoztam egy stílusos, kőszegi tájképet és időjárás widgetet mintázó, 1200x630 felbontású megosztási képet.
*   **Play Protect biztonsági hiba (PWA letiltás) elhárítása**:
    *   **Fájl**: [public/android-chrome-192x192.png](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/android-chrome-192x192.png) [NEW]
    *   **Változtatás**: PowerShell `System.Drawing` modul segítségével legeneráltam a PWA szabványoknak megfelelő `192x192` felbontású ikont a meglévő 512-esből.
    *   **Fájl**: [public/manifest.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/manifest.json)
    *   **Változtatás**: Frissítettem az `icons` konfigurációt: bekerült a 192x192-es felbontás, és az ikonokhoz hozzárendeltem a szabványos `any` és `maskable` (maszkolható) célokat. Ez megszünteti a Google szerver által korábban generált WebAPK elavultsági (Play Protect) hibáját az újabb Androidokon.
    *   **Fájl**: [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js)
    *   **Változtatás**: Hozzáadtam a `/android-chrome-192x192.png` ikont az `ASSETS_TO_CACHE` listához.
*   **Verzióemelés `2.0.7`-re**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (cache: `koszeg-weather-cache-v2.0.7`).

---

### 🏷️ Version 2.0.8 (Kizárólag lokálisan elmentve / Nincs pusholva)
*   **WeatherHero kártya olvashatóságának javítása (fejléc kártya)**:
    *   **Fájl**: [src/pages/WeatherDashboard/WeatherDashboard.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/WeatherDashboard.jsx) (sor: ~90)
    *   **Változtatás**: A fejlécben lévő nagy színes időjárás kártya bal oldalára rátettem egy finom sötét maszkot (`bg-gradient-to-r from-black/25 to-transparent`), a szövegekhez árnyékot adtam (`drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`), és a másodlagos infók (dátum, koordináták) opacity értékét megnöveltem `white/50`-ről `white/70-85`-re a tökéletes kontraszt érdekében.
*   **Böngészőoldali gyorsítótárazás (stale API cache) kikerülése**:
    *   **Fájl**: [src/pages/WeatherDashboard/useWeatherData.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/useWeatherData.js) (sor: ~49)
    *   **Változtatás**: A `fetchCurrent` API lekérdezést kiegészítettem egy dinamikus időbélyegzővel (`&_=${Date.now()}`) és beállítottam a `cache: 'no-store'` fejlécet, hogy a kliens böngészője soha ne a cache-ből jelenítse meg a méréseket, ha az API éppen nem küld adatot.
*   **Verzióemelés `2.0.8`-ra**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (cache: `koszeg-weather-cache-v2.0.8`).

---

### 🏷️ Version 2.0.9 (Kizárólag lokálisan elmentve / Nincs pusholva)
*   **Apple iOS HIG lekerekítési stílusok bevezetése (szintvonalak és koncentrikus illeszkedések)**:
    *   **Fájl**: [tailwind.config.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/tailwind.config.js)
    *   **Változtatás**: Létrehoztam az Apple dizájn-szabvány szerinti lekerekítési tokeneket az `extend.borderRadius` szekcióban: `apple-outer: '22px'` (fő elrendezési panelek, modális ablakok, kiemelt kártyák), `apple-card: '14px'` (standard dashboard csempék és rácsos kártyák), és `apple-inner: '10px'` (gombok, beviteli mezők, belső apró tárolók).
    *   **Fájl**: [src/index.css](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/index.css)
    *   **Változtatás**: A `.btn-grad` osztály lekerekítését átírtam `rounded-apple-inner` osztályra.
    *   **Fájl**: [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx)
    *   **Változtatás**: Frissítettem a fő elrendezést (oldalsávok, fiókok/drawer menü, aktív menüpontok kiemelése, figyelmeztető banner és fejléc) a megfelelő Apple lekerekítési osztályokra.
    *   **Fájl**: [src/pages/WeatherDashboard/WeatherDashboard.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/WeatherDashboard.jsx)
    *   **Változtatás**: A WeatherHero kártyát, a prognózis dobozt, a statisztikai rácscsempéket, a keresőmezőt és a modális ablakokat a megfelelő `rounded-apple-outer` / `-card` / `-inner` értékekkel láttam el a koncentrikus arányok megőrzése mellett.
    *   **További aloldalak és komponensek egységesítése**:
        *   [src/pages/WeatherDashboard/ChartCard.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/ChartCard.jsx), [src/pages/WeatherDashboard/StatCard.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/StatCard.jsx), [src/pages/WeatherDashboard/StatDetailModal.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/StatDetailModal.jsx), [src/pages/WeatherDashboard/SunBar.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/SunBar.jsx), [src/pages/Sponsors/Sponsors.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/Sponsors/Sponsors.jsx), [src/pages/Radar/Radar.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/Radar/Radar.jsx), [src/pages/Reels/Reels.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/Reels/Reels.jsx), [src/pages/Forecast/Forecast.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/Forecast/Forecast.jsx), [src/pages/Cameras/Cameras.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/Cameras/Cameras.jsx), [src/pages/About/About.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/About/About.jsx), és [src/components/AdminPinModal.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/components/AdminPinModal.jsx). Mindenhol kicseréltem a régi `rounded-2xl`, `rounded-xl`, `rounded-lg` lekerekítéseket a megfelelő új koncentrikus Apple tokenekre.
*   **Verzióemelés `2.0.9`-re**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (cache kulcs: `koszeg-weather-cache-v2.0.9`).

