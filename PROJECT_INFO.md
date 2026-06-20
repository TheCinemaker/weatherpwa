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

## 🔑 Környezeti Változók & Beégetett Kulcsok (`.env.example`)

* **Supabase API (Beállításra vár)**:
  * `VITE_SUPABASE_URL`: *Supabase projekt URL*
  * `VITE_SUPABASE_ANON_KEY`: *Anon public key*

---

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
