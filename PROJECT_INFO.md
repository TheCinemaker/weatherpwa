# Projekt Információk - Kőszeg Weather PWA

Ez a fájl tartalmazza a projekt legfontosabb fejlesztési adatait, elérési útjait és konfigurációs kulcsait.

---

## 🌤️ Projekt Adatok

* **Projekt neve**: Kőszeg Weather PWA (Önálló Időjárás App - "Lacinak")
* **Helyi elérési út (Workspace)**: `/Users/thecinemaker/.gemini/antigravity-ide/scratch/koszeg-weather-pwa`
* **IDE Workspace Link**: [koszeg-weather-pwa megnyitása ebben az IDE-ben](file:///Users/thecinemaker/.gemini/antigravity-ide/scratch/koszeg-weather-pwa)
* **Leírás**: Önálló Progressive Web App (PWA) kifejezetten a kőszegi SmartMixin időjárás állomás adatainak, grafikonjainak és a Supabase-alapú helyi pillanatoknak (Reels/Moments) a megjelenítésére.

---

## 🔗 Külső Szolgáltatások & Címek

* **GitHub Repository**: [GitHub - TheCinemaker/weatherpwa](https://github.com/TheCinemaker/weatherpwa)
* **Supabase Console**: [Supabase Dashboard](https://supabase.com/dashboard)
* **Netlify Console**: [Netlify Dashboard](https://app.netlify.com/teams/thecinemaker/overview)
* **Éles Weboldal**: *Feltöltés és Netlify build után lesz elérhető.*

---

## 🔑 Környezeti Változók & Beégetett Kulcsok (`.env`)

* **Supabase API (Beállítva és élesítve)**:
  * `VITE_SUPABASE_URL` = `https://xgolwkiwsetqnvxnclhq.supabase.co`
  * `VITE_SUPABASE_ANON_KEY` = `sb_publishable_R5PJJeyhIr37SNDznb8VvQ_tVilxfKU` (Ez a kliensoldali publikus kulcs, ami be van állítva a helyi `.env`-ben és a Netlify környezeti változók között is.)

---

## 🛠️ Jelenlegi Állapot & Legutóbbi Fejlesztések

* **Routing Frissítés**: A korábbi `HashRouter` le lett cserélve modern HTML5-alapú `BrowserRouter`-re. A linkekből eltűnt a hashtag (`/#/` helyett sima `/` útvonalak vannak). A Netlify átirányítások be vannak állítva.
* **PWA Caching Javítás**: A Service Worker (`sw.js`) verziója `v2`-re frissült. A korábbi agreszív `Cache-First` stratégia helyett a főoldal/HTML kérések `Network-First` módban futnak (hálózatról frissít, ha elérhető), a Supabase API kérések pedig nincsenek gyorsítótárazva.
* **Admin Funkció**: A dashboardon az „Előrejelzés az Alpokaljára” kártya fejlécének **2 másodperces nyomva tartásával** nyitható meg az adminisztrátori mentési felület.

## 📸 Élő Webkamerák (Proxy)

A rendszer 5 aktív kőszegi és Kendig-csúcsi Időkép webkamerát integrál szerveroldali proxy segítségével, megkerülve a CORS és referrer-korlátozásokat:
* **Kőszeg Hegyoldal (Hepi)**: `47.3851;16.5466` | ID: `hepi`
* **Kőszeg Belváros (Microweb)**: `47.38;16.5451` | ID: `microweb9730`
* **Kendig-csúcs (Nyugat)**: `47.364;16.4834` | ID: `ha1kyy`
* **Kendig-csúcs (Dél)**: `47.3626;16.4648` | ID: `ha1kyy3`
* **Kendig-csúcs (Északkelet)**: `47.3684;16.48` | ID: `eszenyi1`

**API Végpont**: `/api/webcam/:id` (például `/api/webcam/hepi` vagy `/api/webcam/microweb9730`)
A végpont automatikusan lekéri az Időkép kameránkénti aktív tokenjét, és a streamelt képet továbbítja a kliensnek, hiba esetén a statikus thumbnailre vagy 302-es átirányításra váltva.

---

## 🔄 Kapcsolódó Munkaterületek (IDE)

* [VoltDesk megnyitása](file:///Users/thecinemaker/.gemini/antigravity/scratch/villanyszerelo_munkalap/solar-workflow)
* [Saját Oldal (Portfolio) megnyitása](file:///Users/thecinemaker/.gemini/antigravity/scratch/thecinemaker-portfolio)
