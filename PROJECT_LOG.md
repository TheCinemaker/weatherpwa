# ⚠️ FONTOS: Olvasd el mielőtt bármit csinálsz!

> [!IMPORTANT]
> **Senki nem csinálhat semmit ezen a projekten, amíg ezt a Fejlesztési Naplót és a [PROJECT_INFO.md](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/PROJECT_INFO.md) fájlt teljes egészében el nem olvasta!**

---

# Fejlesztési Napló - Kőszeg Weather PWA

Ez a fájl tartalmazza a projekt során végrehajtott összes módosítást, verzióemelést és fejlesztési részletet kronológiai sorrendben, hogy a hibák visszakövethetőek legyenek.

---

## 🔗 Hasznos Hivatkozások
*   **SmartMixin API Bázis**: `https://api2.smartmixin.io`
*   **Kőszegi Állomás Mérési URL**: [Stations API](https://api2.smartmixin.io/api/stations/72461/?refresh=1)
*   **Kőszegi Állomás Történeti URL (History)**: `https://api2.smartmixin.io/api/measures/` (Station ID: `72461`)

---

## 📌 TODO / Tervezett fejlesztések
*   **Hero hold — rendes holdképekkel**: jelenleg a hero-ban a holdfázist SVG/CSS terminátor-árnyékkal rajzoljuk ([src/components/HeroSky.jsx](src/components/HeroSky.jsx)), lágyított (blur) fény-árnyék határral. **Cél:** lecserélni **valódi holdfázis-képekre** (fotó/illusztráció szett a fő fázisokhoz, vagy fázis-szögre paraméterezve), hogy élethűbb legyen. (Felmerült: 2026.06.) — A felhőzöttség-alapú nap/hold/felhő logika és az UV-index (Open-Meteo) már elkészült.

---

## 📅 2026. 06. 23.

### 🏷️ Version 2.1.0 (Élesítve / Pusholva) — UV-index + animált égbolt
*   **UV-index kártya (Open-Meteo)**: új [src/components/UvCard.jsx](src/components/UvCard.jsx) — Kőszeg koordinátáira (kulcs nélküli, ingyenes Open-Meteo `uv_index` + `uv_index_max`). WHO szín-kódolt szint + tanács + napi csúcs, „Forrás: Open-Meteo · modellezett" jelöléssel és HungaroMet (met.hu) hivatkozással. A kártya **közvetlenül a hero alatt** jelenik meg.
*   **Animált égbolt a hero-ban**: új [src/components/HeroSky.jsx](src/components/HeroSky.jsx) — nappal SVG nap (forgó sugarak), éjjel **valódi holdfázis** (terminátor-árnyék, lágyított/blurelt fény-árnyék határral), és az Open-Meteo `cloud_cover` alapján **sodródó felhők** (számuk/átlátszatlanságuk a felhőzöttséghez igazodik, framer-motion mozgással). A csapadék/köd továbbra is a helyi SmartMixin szenzorból jön.
*   **Verzióemelés 2.0.14 → 2.1.0**: [package.json](package.json), [public/sw.js](public/sw.js) (`CACHE_NAME` is), [public/manifest.json](public/manifest.json) (`version` mező), és a footer ([src/App.jsx](src/App.jsx)).
*   *Megjegyzés:* a hero hold későbbi finomítása (valódi holdképek) a fenti TODO blokkban szerepel.

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

---

### 🏷️ Version 2.0.10 (Kizárólag lokálisan elmentve / Nincs pusholva)
*   **Saját Web Push értesítési rendszer bevezetése (OneSignal nélkül)**:
    *   **Fájl**: [supabase_migrations/15_create_push_subscriptions.sql](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/supabase_migrations/15_create_push_subscriptions.sql) [ÚJ]
    *   **Változtatás**: Létrehoztam a `push_subscriptions` adatbázistáblát a felhasználói push feliratkozások tárolásához. A tábla tartalmazza a `endpoint`, `p256dh` és `auth` mezőket. RLS szabályok: publikus INSERT (feliratkozás), SELECT (állapot ellenőrzés) és DELETE (leiratkozás) engedélyezve.
    *   **Fájl**: [netlify/functions/send-push-alert.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/netlify/functions/send-push-alert.js) [ÚJ]
    *   **Változtatás**: Új Netlify serverless funkció a push értesítések szétküldéséhez. VAPID kulcsokkal hitelesíti magát. Lekéri az összes aktív feliratkozást a Supabase-ből, majd párhuzamosan küldi a push értesítéseket. Lejárt (HTTP 410/404) endpointokat automatikusan törli.
    *   **Fájl**: [src/components/PushNotificationButton.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/components/PushNotificationButton.jsx) [ÚJ]
    *   **Változtatás**: Új React komponens, amely kezeli a böngészős PushManager feliratkozási életciklust. Kétféle módban használható: `mode="desktop"` (teljes szélességű gomb + leírás az oldalsávban) és `mode="mobile"` (harang ikon a felső sávban). A feliratkozás adatait (endpoint, p256dh, auth) UPSERT-tel tárolja a Supabase-ben. Leiratkozáskor törli a rekordot.
    *   **Fájl**: [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx)
    *   **Változtatás**: A régi, csak böngészőalapú `Notification.requestPermission()` értesítési gombokat (`handleRequestNotif`, `notifPermission` state) eltávolítottam. Mindkét helyen (asztali oldalsáv aljában és mobil fejléc harang ikonja) az új `<PushNotificationButton>` komponenst alkalmazzuk.
    *   **Fájl**: [src/pages/WeatherDashboard/WeatherDashboard.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/WeatherDashboard.jsx)
    *   **Változtatás**: A `handleSaveForecast` függvénybe beépítettem a push küldést: ha `adminAnnActive === true` és az `adminAnnText` nem üres, az adatbázis mentése után meghívja a `/.netlify/functions/send-push-alert` végpontot `POST` kéréssel, a sürgős értesítés szövegével. A push küldés hibája nem-fatális (a forecast ettől még elmentésre kerül).
    *   **Fájl**: [netlify.toml](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/netlify.toml)
    *   **Változtatás**: Új redirect szabály: `/api/send-push-alert` → `/.netlify/functions/send-push-alert` (200).
    *   **Fájl**: [.env](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/.env) és [.env.example](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/.env.example)
    *   **Változtatás**: VAPID kulcspár hozzáadva. Generálva: `npx web-push generate-vapid-keys` (2026-06-23). `VITE_VAPID_PUBLIC_KEY` a kliensnek, `VAPID_PRIVATE_KEY` kizárólag szerver oldali (Netlify env var). A privát kulcsot a Netlify dashboard → Site configuration → Environment variables felületen kell beállítani.
    *   **Csomag**: `web-push` npm csomag hozzáadva (`npm install web-push --save`) — a Netlify Function használja a push szétküldéshez.

> [!IMPORTANT]
> **Élesítéshez szükséges teendők:**
> 1. Futtasd le a `15_create_push_subscriptions.sql` migrációs fájlt a Supabase SQL editorában.
> 2. Add meg a Netlify dashboard → Site configuration → Environment variables felületen:
>    - `VAPID_PUBLIC_KEY` = `BF3uUHcsgrbtfH8KpgmSHr2qsKzgRhdxuFzQIEpvOoE7Y3t-ztjg5lFJ_gYVcESXjBZhM_jEVZjuBjBA_HVnwEY`
>    - `VAPID_PRIVATE_KEY` = `XMdDZbcmXblBRIzkBuepDcyN3xQeC4BxX6jac9-JApQ`
>    - `SUPABASE_URL` = (a Supabase projekt URL-je)
>    - `SUPABASE_SERVICE_ROLE_KEY` = (a Supabase service role key, nem az anon key!)

---

### 🏷️ Version 2.0.11
*   **Push előfizetők platform azonosítása és számlálója**:
    *   **Fájl**: [supabase_migrations/16_add_platform_to_push_subscriptions.sql](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/supabase_migrations/16_add_platform_to_push_subscriptions.sql) [ÚJ]
    *   **Változtatás**: `ALTER TABLE push_subscriptions ADD COLUMN user_agent TEXT, ADD COLUMN platform TEXT` — bővíti a már létrehozott táblát a platformazonosítás mezőivel.
    *   **Fájl**: [supabase_migrations/15_create_push_subscriptions.sql](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/supabase_migrations/15_create_push_subscriptions.sql)
    *   **Változtatás**: A `CREATE TABLE` definíciót frissítettem, hogy a `user_agent` és `platform` mezőket tartalmazza.
    *   **Fájl**: [src/components/PushNotificationButton.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/components/PushNotificationButton.jsx)
    *   **Változtatás**: Hozzáadtam a `detectPlatform()` helper függvényt a platform azonosításához. A Supabase-be mentéskor a `user_agent` és a `platform` mezők is tárolásra kerülnek.
    *   **Fájl**: [src/api/supabase.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/api/supabase.js)
    *   **Változtatás**: Új `getPushSubscriberCount()` export függvény.
    *   **Fájl**: [src/pages/WeatherDashboard/WeatherDashboard.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/WeatherDashboard.jsx)
    *   **Változtatás**: Az admin modal fejlécébe bekerült egy `🔔 Feliratkozott eszközök: N` sáv.
*   **Verzióemelés `2.0.11`-re**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (cache: `koszeg-weather-cache-v2.0.11`).

---

### 🏷️ Version 2.0.12 (Safari és Android Chrome stabilitási frissítés)
*   **Safari és Android Chrome kompatibilitási hibák elhárítása**:
    *   **Fájl**: [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx) és [src/components/PushNotificationButton.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/components/PushNotificationButton.jsx)
    *   **Változtatás**: Beépítettem a `'Notification' in window` biztonsági ellenőrzést az összes lekérdezés és constructor elé. Ezzel elhárítottuk a Safari (nem-PWA módú) betöltési fázisában lévő összeomlást.
    *   **Változtatás**: Kicseréltem a `new Notification` hívásokat a Service Worker `reg.showNotification()` metódusára, amivel elhárítottuk az Android Chrome böngészőkben fellépő "Failed to construct Notification: Illegal constructor" hibát.
*   **Riasztás megtekintése kattintás után (Rich Push URL & Modal)**:
    *   **Fájl**: [src/components/PushAlertModal.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/components/PushAlertModal.jsx) [ÚJ]
    *   **Változtatás**: Létrehoztam egy prémium megjelenésű riasztási ablakot, ami a push értesítésre kattintás után jelenik meg a felhasználóknak.
    *   **Fájl**: [src/pages/WeatherDashboard/WeatherDashboard.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/WeatherDashboard.jsx)
    *   **Változtatás**: A szétküldött push értesítés URL-jében URL-kódoltan átadjuk a riasztás teljes tartalmát (`/?alert=true&title=...&body=...`), amit az app betöltődéskor észlel, kiolvas, és megjelenít a fenti modálban.
*   **Verzióemelés `2.0.12`-re**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (cache: `koszeg-weather-cache-v2.0.12`).

---

### 🏷️ Version 2.0.13 (Fejlesztői bemutatkozás frissítése)
*   **Hirdetés és referenciák frissítése**:
    *   **Fájl**: [src/pages/Sponsors/Sponsors.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/Sponsors/Sponsors.jsx)
    *   **Változtatás**: Átfogalmaztam az SA software fejlesztői hirdetést. Mostantól megnevezi a saját projekteket (VisitKőszeg, KőszegEats, TheTicket, VoltDesk, KőszegWeather), valamint a nemzetközi luxusszállodákban (InterContinental, Kempinski, Bem Kimpton) végzett IT/hálózati (IPTV, internet, WiFi) munkákat.
*   **Verzióemelés `2.0.13`-ra**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (cache: `koszeg-weather-cache-v2.0.13`).

---

### 🏷️ Version 2.0.14 (Fejlesztői értékesítési szöveg finomhangolása)
*   **Hirdetés meggyőzőbbé tétele (lead generálás)**:
    *   **Fájl**: [src/pages/Sponsors/Sponsors.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/Sponsors/Sponsors.jsx)
    *   **Változtatás**: Átfogalmaztam a bemutatkozó/értékesítési szöveget, hogy közvetlen cselekvésre ösztönözze (call-to-action) a szoftver- vagy hálózatfejlesztést tervező látogatókat.
*   **Verzióemelés `2.0.14`-re**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (cache: `koszeg-weather-cache-v2.0.14`).

---

### 🏷️ Version 2.1.0 (UV-index és Animált Égbolt - Laci otthoni fejlesztése)
*   **Dinamikus csillagászati égbolt**:
    *   **Fájl**: [src/components/HeroSky.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/components/HeroSky.jsx) [ÚJ]
    *   **Változtatás**: Létrehozva egy `HeroSky` komponens, ami az Open-Meteo felhőzet adatára építve napot (forgó sugarakkal) vagy valódi holdfázist (mai terminátor-árnyék számítással) rajzol ki, sodródó felhőkkel.
    *   **Fájl**: [src/pages/WeatherDashboard/WeatherDashboard.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/WeatherDashboard.jsx)
    *   **Változtatás**: A korábbi izzó narancs/fehér köröket kicseréltük az új `<HeroSky>` égboltra a WeatherHero-ban.
*   **UV-index widget**:
    *   **Fájl**: [src/components/UvCard.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/components/UvCard.jsx) [ÚJ]
    *   **Változtatás**: Új, esztétikus UV kártya, ami az Open-Meteo modellezett aktuális és napi max UV adatait jeleníti meg, színkódolt szintjelzéssel, biztonsági javaslatokkal és HungaroMet linkkel. Helye: a WeatherHero alatt, a páratartalom felett.
*   **Verzióemelés `2.1.0`-ra**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (cache: `koszeg-weather-cache-v2.1.0`).

---

## 📅 2026. 06. 25.

### 🏷️ Version 2.1.2 (Admin karakterlimitek és villámhírek megtartása)
*   **Villámhírek megőrzése és darabszám-korlátozása (max 3)**:
    *   **Adatbázis**: Létrehoztam a [supabase_migrations/17_limit_news_blurbs_to_three.sql](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/supabase_migrations/17_limit_news_blurbs_to_three.sql) fájlt. Ez kikapcsolja a 24 órás lejárati időt a villámhíreknél (az `expires_at` alapértelmezése `NULL` lett, a meglévőké is törlődik). Ezzel párhuzamosan beállít egy adatbázis-triggert, ami minden új hír beszúrása után automatikusan törli a legrégebbi híreket, hogy mindig **pontosan a 3 legfrissebb** maradjon meg.
*   **Karakterlimitek frissítése az admin panelen**:
    *   **Villámhír szövege**: Eltávolítottam a 400 karakteres korlátozást a [src/pages/WeatherDashboard/WeatherDashboard.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/WeatherDashboard.jsx) oldalon.
    *   **Sürgős értesítés (pl. Viharjelzés)**: Felemeltem a limitet 150-ről **200 karakterre** a [src/pages/WeatherDashboard/WeatherDashboard.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/WeatherDashboard.jsx) és [src/pages/Forecast/Forecast.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/Forecast/Forecast.jsx) oldalakon is.
*   **Verzióemelés `2.1.2`-re**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/manifest.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/manifest.json), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (cache: `koszeg-weather-cache-v2.1.2`).

### 🏷️ Version 2.1.3 (Interaktív UV-index kisokos easter egg rázással)
*   **UV-index kisokos modál és ikon rázás (Easter Egg)**:
    *   **Komponens**: Frissítettem a [src/components/UvCard.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/components/UvCard.jsx) fájlt. Az UV-kártya kattinthatóvá vált, és rákattintva egy gyönyörű, glassmorphic stílusú, részletes fényvédelmi útmutató nyílik meg (babák, gyerekek, felnőttek és idősek szerinti tanácsokkal, tévhitekkel).
    *   **Ikon rázás**: A figyelem felkeltése érdekében az UV nap-ikon 5-10 másodpercenként véletlenszerűen kicsit megmozdul/megrázkódik (`framer-motion` segítségével).
*   **Verzióemelés `2.1.3`-ra**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/manifest.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/manifest.json), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (új cache: `koszeg-weather-cache-v2.1.3`).

### 🏷️ Version 2.1.4 (Interaktív Kvíz, Tippelde és Dicsőségfal integráció)
*   **Időjárás Játékok & Dicsőségfal**:
    *   **Adatbázis**: Létrehoztam a [supabase_migrations/18_create_games_tables.sql](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/supabase_migrations/18_create_games_tables.sql) fájlt a `quiz_leaderboard`, `tippelde_predictions` és `tippelde_scores` táblákhoz és RLS szabályaikhoz.
    *   **Kvíz játék**: Új [src/components/QuizModal.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/components/QuizModal.jsx) komponens. 5 kérdésből álló pool Kőszeg éghajlatáról/érdekességeiről, pontszámmal, időmérővel és dicsőségfal mentéssel.
    *   **Tippelde**: Új [src/components/TippeldeModal.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/components/TippeldeModal.jsx) komponens, ahol a felhasználók holnapi kőszegi maximum hőmérsékletre tippelhetnek.
    *   **Admin Kiértékelés**: A [src/pages/WeatherDashboard/WeatherDashboard.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/WeatherDashboard.jsx) admin modaljába beépítettem a Tippek Kiértékelése panelt Lacinak a napi maximum rögzítésére és a pontok leosztására.
    *   **Easter Egg indítás**:
        *   Kvíz: A fejléc logóra való 5 gyors kattintással indul (klikkenként 72 fokos forgási animációval a logón).
        *   Tippelde: A főoldali nagy hőmérséklet kijelzőre való 5 gyors kattintással indul (klikkenként fel-le pattogó animációval).
    *   **Dicsőségfal**: Új [src/components/LeaderboardModal.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/components/LeaderboardModal.jsx) komponens, elérhető a hamburger menüből (asztali és mobil drawer nézetben is).
*   **Verzióemelés `2.1.4`-re**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/manifest.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/manifest.json), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (új cache: `koszeg-weather-cache-v2.1.4`).

### 🏷️ Version 2.1.5 (Játékok finomhangolása és Easter Egg áthelyezés)
*   **Easter Egg áthelyezés és animáció finomítás**:
    *   **Logo viselkedés visszaállítása**: Eltávolítottam a kvíz indítást és a kattintási forgás animációt a fejléc Logo-ról, így az kizárólag az admin belépést szolgálja (hosszú nyomással).
    *   **Kvíz áthelyezése a Szélsebesség kártyára**: Új kattintásérzékelő a [src/pages/WeatherDashboard/StatCard.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/StatCard.jsx) szélsebesség (`FF`) ikonján. 5 gyors kattintás után a kis szélkerék ikon elforog és egy egyedi globális eseményen keresztül megnyitja a Kvízt, míg a kártya más területeire kattintva továbbra is a történeti grafikon nyílik meg.
    *   **Tippelde indító animáció cseréje**: A [src/pages/WeatherDashboard/WeatherDashboard.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/WeatherDashboard.jsx) oldalon az óriás hőmérséklet kijelző kattintási animációját ugrálásról 72 fokos forgásra módosítottam.
*   **Verzióemelés `2.1.5`-re**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/manifest.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/manifest.json), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (új cache: `koszeg-weather-cache-v2.1.5`).

### 🏷️ Version 2.1.6 (Heti Toplista, Névvédelem és Kvíz bővítés)
*   **Névvédelem és egyedi játékos-azonosító (player_id)**:
    *   **Adatbázis**: Létrehoztam a [supabase_migrations/19_add_player_id_and_weekly_leaderboard.sql](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/supabase_migrations/19_add_player_id_and_weekly_leaderboard.sql) migrációt. Újradefiniáltam a `tippelde_predictions` és `tippelde_scores` táblákat a kliensoldali UUID alapú `player_id` tárolásához. Így egy játékos adatai biztonságosan összekapcsolódnak napi névváltoztatások mellett is, és a napi limitet is eszköz alapon kényszerítjük ki (`UNIQUE (player_id, target_date)`).
    *   **Kliens és API**: A [src/api/supabase.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/api/supabase.js) és [src/components/TippeldeModal.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/components/TippeldeModal.jsx) fájlokban lekérdezzük, hogy egy becenév foglalt-e más játékos (másik `player_id`) által, mielőtt a tippet elfogadjuk, megvédve a meglévő pontokat a "névlopástól".
*   **Heti Toplista és Dicsőségfal Toggle**:
    *   **Nézet**: Létrehoztam egy adatbázis-nézetet (`tippelde_weekly_scores`), amely az elmúlt 7 nap lezárt pontszámait összesíti.
    *   **UI**: A [src/components/LeaderboardModal.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/components/LeaderboardModal.jsx) dicsőségfal modalban egy Heti / Összesített választókapcsolót vezettem be a Tippelde toplistához. Eltávolítottam a játék-indítási tippeket (Súgó doboz) a modal aljáról.
*   **Kvíz kérdések bővítése és véletlenszerűség**:
    *   **Fájl**: [src/components/QuizModal.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/components/QuizModal.jsx)
    *   **Változtatás**: Kibővítettem a kérdéssort **50 kőszegi történelmi, klíma és földrajzi kérdésre**, amelyekből minden indításkor 5 darabot sorsol ki véletlenszerűen a rendszer. Összekötöttem a Kvíz és Tippelde becenévkezelést a `localStorage`-on keresztül.
*   **Verzióemelés `2.1.6`-ra**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/manifest.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/manifest.json), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (új cache: `koszeg-weather-cache-v2.1.6`).

### 🏷️ Version 2.1.7 (Napi Kvíz Korlát, Aktív Tippek és Kliens-Adatbázis szinkronizáció)
*   **Kvíz napi korlátozás**:
    *   **Megvalósítás**: A Kvízt is napi egy alkalomra korlátoztuk per eszköz/játékos. Az adatbázisban egyedi indexet vezetünk be a `(player_id, created_date)` párosra, és kliensoldalon a [src/components/QuizModal.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/components/QuizModal.jsx) modalban ellenőrizzük, hogy játszott-e már ma a felhasználó.
*   **Aktív Tippek és Kliens-Adatbázis Szinkronizáció**:
    *   **Aktív tippek**: Bevezettem egy "Aktív tippek" nézetet a Tippelde ranglistán, ahol a felhasználók láthatják az összes jelenleg beérkezett, még ki nem értékelt tippet a holnapi napra.
    *   **Saját sor zöld kiemelése**: A ranglistákon (Kvíz és Tippelde) a felhasználó saját sorát feltűnő emerald-zöld színnel emeljük ki, a nevéhez pedig egy `(Te)` jelzést fűzünk.
    *   **Szinkronizáció javítása**: A [src/components/TippeldeModal.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/components/TippeldeModal.jsx) modalban a kliensoldali korlátozás ellenőrzését úgy alakítottam át, hogy először mindig a Supabase-t kérdezze le. Így ha a felhasználó törli a tippjét a Supabase-ből tesztelés céljából, a felület nem blokkolja őt a helyi `localStorage` alapján, hanem engedi újra tippelni.
*   **Verzióemelés `2.1.7`-re**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/manifest.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/manifest.json), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (új cache: `koszeg-weather-cache-v2.1.7`).

### 🏷️ Version 2.1.8 (Automatikus Tippelde Kiértékelés)
*   **Automatikus napi pontozás (Netlify Scheduled Function)**:
    *   **Megvalósítás**: Elkészítettem a [netlify/functions/auto-evaluate.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/netlify/functions/auto-evaluate.js) serverless funkciót, ami minden nap hajnali 02:05-kor lefut a Netlify időzítőjével (cron: `5 1 * * *`).
    *   **Adatgyűjtés**: A funkció kiszámítja a tegnapi napot, lekéri a kőszegi SmartMixin állomás 24 órás hőmérséklet-történetét és megkeresi a napi maximumot. Ha az állomás offline, tartalékként lekéri az **Open-Meteo Archive API** kőszegi tegnapi maximumát.
    *   **Kiértékelés**: Összeveti a kapott maximumot a még kiértékelésre váró (`processed = false`) tegnapi tippekkel, kiszámolja a kapott pontokat és frissíti a `tippelde_scores` összesített pontszámait és a tippeket.
*   **Verzióemelés `2.1.8`-ra**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/manifest.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/manifest.json), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (új cache: `koszeg-weather-cache-v2.1.8`), [netlify.toml](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/netlify.toml).

### 🏷️ Version 2.1.9 (Tippelde Akadálymentesítés & Csúszka Finomhangolás)
*   **Akadálymentesítés**:
    *   **Menü gombok**: A Tippelde és a Kvíz indítógombjait beépítettem a fő navigációs oldalsávba (Desktop Sidebar) és a mobil menüfiókba (Mobile Drawer) is a Dicsőségfal alá a könnyebb elérés érdekében.
    *   **Easter Egg megőrzés**: Az Easter Egg indítások (szélkerék pörgetés 5-ször a szélsebesség kártyán, óriás hőmérséklet pörgetés 5-ször) továbbra is teljesen működőképesek maradtak.
*   **Tippelde slider és szövegezés javítása**:
    *   **Finomhangoló gombok**: A Tippelde Modalban lévő range csúszka mellé elhelyeztem egy `-` és egy `+` gombot, amelyekkel `0.1 °C` lépésközzel finomhangolható a tippelt érték, elkerülve a mobil érintőképernyős pontatlanságokat.
    *   **Határérték**: A csúszka maximumát `40.0 °C`-ról `45.0 °C`-ra emeltem az extrém melegek tippeléséhez.
    *   **Promt**: A prompt szövegét egyértelműbb kérdéssé alakítottam: *"Mekkora lesz a legmagasabb hőmérséklet a holnapi napon (dátum)? 🌡️"*.
*   **Kiértékelés időablak pontosítás**:
    *   **Mérési ablak**: A funkció mostantól a hivatalos meteorológiai mérési ciklust követi, azaz az előző napi 18:00 UTC és a cél dátum 18:00 UTC közötti maximumot keresi meg (ami nyáron local 20:00-tól 20:00-ig, télen local 19:00-tól 19:00-ig tart).
    *   **Időzítés**: A cron feladat futását reggel 08:05 utánra módosítottam (`netlify.toml` cron: `5 7 * * *`).
*   **Verzióemelés `2.1.9`-re**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/manifest.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/manifest.json), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (cache: `koszeg-weather-cache-v2.1.9`), [netlify.toml](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/netlify.toml), [netlify/functions/auto-evaluate.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/netlify/functions/auto-evaluate.js).

### 🏷️ Version 2.2.0 (Kétszeres Grafikon Redundancia)
*   **Kétszeres redundáns grafikon adatforrás**:
    *   **MetNet Szerveroldali Backup [ÚJ]**: Létrehoztam a [netlify/functions/fetch-metnet.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/netlify/functions/fetch-metnet.js) serverless funkciót, ami ha a fő SmartMixin API lehal vagy üres adatot ad vissza, észrevétlenül lekaparja a kőszegi állomás adatait a MetNet-ről (`ostid=1155`) a legfrissebb 24 óra adataival.
    *   **Open-Meteo Modell Fallback**: Ha a MetNet lekérés is meghiúsul, vagy a fizikai állomás offline állapota miatt az adatok elavultak (> 4 óra), a rendszer automatikusan és észrevétlenül átvált az Open-Meteo modell-alapú történeti előrejelzésére.
    *   **Integráció**: A [src/pages/WeatherDashboard/useWeatherData.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/useWeatherData.js) lekérdező ciklusába beépítettem a kétlépcsős fallback logikát, így a grafikonok minden körülmények között működőképesek és esztétikusak maradnak.
    *   **Proxy beállítás**: Frissítettem a [netlify.toml](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/netlify.toml) állományt a `/api/fetch-metnet` átirányítási szabállyal.
*   **Verzióemelés `2.2.0`-ra**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/manifest.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/manifest.json), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (cache: `koszeg-weather-cache-v2.2.0`), [netlify.toml](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/netlify.toml).

### 🏷️ Version 2.2.1 (Service Worker Cache Hiba és API Gyorsítás)
*   **Service Worker API cache kikerülése (fagyott grafikon javítás)**:
    *   **Fájl**: [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js)
    *   **Változtatás**: A `/api/` kezdetű kéréseket és a harmadik fél API hívásait (`api.open-meteo.com`, `api.allorigins.win`) kiszedtem a Cache-First (Rule 4) szabály alól. Így elkerüljük, hogy a PWA a végtelen időkig tegnapi (pl. 23:00-s) adatokat adjon vissza a cache-ből a grafikonoknál.
*   **Szerver és kliensoldali API időtúllépések (Timeout-ok)**:
    *   **Fájl**: [netlify/functions/weather-data.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/netlify/functions/weather-data.js) és [src/pages/WeatherDashboard/useWeatherData.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/pages/WeatherDashboard/useWeatherData.js)
    *   **Változtatás**: Minden API híváshoz beépítettem az `AbortSignal.timeout()` használatát (szerveroldalon 3 másodperc, kliensoldalon 4 másodperc). Ezzel kiküszöböltük, hogy a SmartMixin időnkénti 30+ másodperces akadása vagy lefagyása megbénítsa az egész alkalmazást: a kérés gyorsan elvetésre kerül, és azonnal átugrik a következő (MetNet vagy Open-Meteo) adatforrásra.
*   **Verzióemelés `2.2.1`-re**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/manifest.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/manifest.json), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (új cache kulcs: `koszeg-weather-cache-v2.2.1`).

### 🏷️ Version 2.2.2 (Tippelde Aktív Listázás Szűrése)
*   **Aktív Tippek szűrése a holnapi cél dátumra**:
    *   **Fájl**: [src/api/supabase.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/api/supabase.js)
    *   **Változtatás**: A `getActiveTippeldePredictions()` lekérdezést átalakítottam, hogy az összes feldolgozatlan tipp listázása helyett szigorúan csak a mai napon leadott, holnapi cél dátumra vonatkozó tippeket (`target_date = holnap`) kérdezze le. Így a felhasználóknak a ranglistán csak a holnapi napra szóló aktív tippek jelennek meg, a tegnapi (már érvényben lévő, kiértékelésre váró) tippek nem zavarják a felületet.
*   **Verzióemelés `2.2.2`-re**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/manifest.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/manifest.json), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (új cache kulcs: `koszeg-weather-cache-v2.2.2`).

### 🏷️ Version 2.2.3 (Navigáció Egyszerűsítés és Játék Integráció)
*   **Játék menük összevonása a Játékok (korábban Dicsőségfal) modálba**:
    *   **Oldalsáv és mobil menü**: Eltávolítottam a különálló "Napi Tippelde" és "Kőszegi Kvíz" gombokat a navigációs sávokból, így a menü sokkal rövidebb és szellősebb lett, visszaadva a látogatószámláló ("Látogatók: N") láthatóságát PC-n és mobil kijelzőkön is. A korábbi "Dicsőségfal" menüpontot átneveztem **"Játékok"** névre, és a `Gamepad2` ikont rendeltem hozzá.
    *   **Modális integráció**: Frissítettem a [src/components/LeaderboardModal.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/components/LeaderboardModal.jsx) modált, átnevezve "Kőszegi Játékok"-ra. Mindkét lap tetejére (Kvíz Bajnokok és Tippelde) közvetlenül beépítettem egy nagy gombot a játékok azonnali indításához ("Kvíz indítása 🧠" és "Tippelek holnapra 🌡️").
    *   **Eseménykezelés**: A [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx) fájlban visszahívó függvények segítségével összekötöttem a Játékok modál gombjait a megfelelő Kvíz és Tippelde modálok megnyitásával.
*   **Verzióemelés `2.2.3`-ra**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/manifest.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/manifest.json), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (új cache kulcs: `koszeg-weather-cache-v2.2.3`), [src/components/LeaderboardModal.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/components/LeaderboardModal.jsx).

### 🏷️ Version 2.2.4 (Látogatószámláló Láthatóság és Prémium Kapszula Badge)
*   **Magasság túlcsordulás és görgethetőség (overflow) javítása**:
    *   **Oldalsáv és mobil menü**: Hozzáadtam a `overflow-y-auto no-scrollbar` osztályokat a desktop oldalsávhoz és a mobil menühöz. Ezzel a tartalom kisebb képernyőkön vagy ablakméretnél sem csúszik ki, hanem finoman görgethetővé válik görgetősáv megjelenítése nélkül.
    *   **Spaciálás csökkentése**: A logó alsó margóját `mb-8`-ról `mb-6`-ra csökkentettem, a navigációs elemek függőleges paddingjait pedig `py-3` / `py-3.5`-ről `py-2.5`-re vettem vissza. A lábléc feletti margókat és térközöket is csökkentettem, hogy a teljes tartalom jobban elférjen a képernyőn.
*   **Látogatószámláló újratervezése (Prémium Kapszula Kialakítás)**:
    *   **Badge**: A korábbi egyszerű szöveges látogatottsági sort lecseréltem egy modern, prémium dizájnú kapszula badge-re: lekerekített szegéllyel (`rounded-full`), finom háttérrel (`bg-white/[0.04]`), vékony kerettel (`border-white/10`) és egy villogó zöld LED-jelzővel (`bg-emerald-400 animate-pulse`). Ez azonnal szembetűnő és látványos a felhasználónak.
*   **Verzióemelés `2.2.4`-re**:
    *   **Módosított fájlok**: [package.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/package.json), [src/App.jsx](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/App.jsx), [public/manifest.json](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/manifest.json), [public/sw.js](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/public/sw.js) (új cache kulcs: `koszeg-weather-cache-v2.2.4`), [src/index.css](file:///c:/Users/Szilveszter/weatherpwa/weatherpwa/src/index.css).

---

## 📌 Tervezett Fejlesztések (TODO)

*   [x] **MetNet Failover Redundancia (Weather station fallback)**:
    *   **Leírás**: Ha a fő SmartMixin API lehal vagy időtúllépést ad vissza, a rendszer automatikusan és észrevétlenül váltson át a MetNet online állomás adatainak scrapingjére.
    *   **Megvalósítás**: Egy új Netlify function (pl. `fetch-metnet-backup`) lekéri a `https://www.metnet.hu/online-allomasok?sub=showosdata&ostid=1155` oldalt, HTML parsing segítségével kiszedi a legfrissebb mérési adatokat (T, U, FF, DD, SLP, RR_1H), és végigpásztázza a mai napi adatokat a minimum/maximum kiszámítására. A `useWeatherData.js` hibakezelőjébe beépítjük a failover lekérést.
    *   **Státusz**: Kész (v2.2.0).

*   [ ] **PWA Háttérből Visszatérés és Auto-Frissítés (PWA Resume & Auto-Update)**:
    *   **Leírás**: iOS-en háttérbe küldött (fagyasztott), majd újra előtérbe hozott PWA appoknál a mérések (és a kattintásszámláló) elavultak maradnak, mert nem futnak le újra a React mount eseményei. Továbbá a verziófrissítések sem települnek azonnal.
    *   **Megvalósítás**: Iratkozzunk fel a `visibilitychange` eseményre a böngészőben. Amikor a dokumentum állapota újra `visible` lesz, indítsuk el a legfrissebb időjárás adatok kényszerített újratöltését (reload), és hívjuk meg a Service Worker `update()` metódusát (`navigator.serviceWorker.ready.then(reg => reg.update())`), hogy a PWA a háttérből visszatérve ellenőrizze az esetleges új verziókat.
    *   **Státusz**: Tervezve (Todo).


