import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Kőszeg
const LAT = 47.3971;
const LON = 16.546;
const CLOUD_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
  `&current=cloud_cover&timezone=Europe%2FBudapest`;

// Holdfázis a mai dátumból (0 = újhold, 0.5 = telihold).
const SYNODIC = 29.530588853;
function getMoonPhase(date = new Date()) {
  const ref = Date.UTC(2000, 0, 6, 18, 14, 0);
  let p = (((date.getTime() - ref) / 86400000) % SYNODIC) / SYNODIC;
  if (p < 0) p += 1;
  const illumination = (1 - Math.cos(2 * Math.PI * p)) / 2; // 0..1
  return { phase: p, illumination, waxing: p < 0.5 };
}

// Egy pufók felhő-sziluett, lágy gradienssel és árnyékkal.
function CloudShape({ className = '', style }) {
  return (
    <svg viewBox="0 0 100 64" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cdd9e3" />
        </linearGradient>
      </defs>
      <g fill="url(#cloudGrad)">
        <ellipse cx="52" cy="44" rx="38" ry="15" />
        <circle cx="30" cy="38" r="15" />
        <circle cx="52" cy="28" r="19" />
        <circle cx="72" cy="37" r="15" />
      </g>
    </svg>
  );
}

export default function HeroSky({ isNight = false }) {
  const [cover, setCover] = useState(null); // 0..100 vagy null (töltés)

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(CLOUD_URL);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (alive) setCover(data?.current?.cloud_cover ?? null);
      } catch (err) {
        console.error('Felhőzöttség lekérés hiba:', err);
        // hiba esetén marad a derült megjelenés
      }
    })();
    return () => { alive = false; };
  }, []);

  const moon = getMoonPhase();

  // Felhőzöttség → felhők száma + átlátszatlanság + a nap/hold fénye
  const c = cover == null ? 0 : cover;
  const nClouds = cover == null ? 0 : c < 12 ? 0 : c < 38 ? 1 : c < 68 ? 2 : 3;
  const cloudOpacity = 0.6 + Math.min(0.35, (c / 100) * 0.4);
  const glowOpacity = Math.max(0.25, 0.85 * (1 - c / 130));
  const orbDim = 1 - Math.min(0.45, (c / 100) * 0.5); // erős felhőnél tompább korong

  // Felhő-rétegek paraméterei (eltérő méret/pozíció/sebesség → parallax-érzet)
  const cloudDefs = [
    { w: 60, top: '46%', left: '-18%', dur: 26, delay: 0, drift: 26, op: 1 },
    { w: 46, top: '14%', left: '20%', dur: 34, delay: 1.2, drift: 20, op: 0.9 },
    { w: 38, top: '60%', left: '34%', dur: 22, delay: 0.5, drift: 16, op: 0.8 },
  ];

  return (
    <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
      {/* Fény-glow a korong mögött (felhőzöttséggel halványul) */}
      <div
        className="absolute inset-2 rounded-full blur-xl transition-opacity duration-700"
        style={{
          opacity: glowOpacity,
          background: isNight
            ? 'radial-gradient(circle, rgba(191,219,254,0.7), transparent 70%)'
            : 'radial-gradient(circle, rgba(253,224,71,0.8), transparent 70%)',
        }}
      />

      {/* NAP vagy HOLD */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: orbDim }}>
        {isNight ? (
          // Valódi holdfázis: pala-korong + sodródó terminátor-árnyék → sarló/telihold
          <div
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden"
            style={{ boxShadow: '0 0 18px 4px rgba(191,219,254,0.35)' }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: 'radial-gradient(circle at 38% 34%, #ffffff 0%, #e9eef5 55%, #c7d2e0 100%)' }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: '#1e2a44',
                transform: `translateX(${(moon.waxing ? -1 : 1) * moon.illumination * 100}%)`,
                // Lágy fény-árnyék határ (terminátor) — a valódi hold széle sem éles.
                // Az overflow-hidden levágja a blurt a karimánál, így a korong pereme tiszta marad.
                filter: 'blur(2.5px)',
              }}
            />
          </div>
        ) : (
          // Nap: lassan forgó sugarak + meleg korong
          <svg viewBox="0 0 100 100" className="w-[88%] h-[88%]">
            <defs>
              <radialGradient id="sunCore" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="#fff7d6" />
                <stop offset="55%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#f59e0b" />
              </radialGradient>
            </defs>
            <g style={{ transformOrigin: '50px 50px', animation: 'spin 48s linear infinite' }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <rect
                  key={i}
                  x="48.5" y="2" width="3" height="14" rx="1.5"
                  fill="#fde047"
                  transform={`rotate(${i * 30} 50 50)`}
                  opacity="0.9"
                />
              ))}
            </g>
            <circle cx="50" cy="50" r="26" fill="url(#sunCore)" />
          </svg>
        )}
      </div>

      {/* SODRÓDÓ FELHŐK (felhőzöttség alapján) */}
      {cloudDefs.slice(0, nClouds).map((cd, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ top: cd.top, left: cd.left, width: `${cd.w}%`, opacity: cloudOpacity * cd.op }}
          initial={{ x: 0, y: 0 }}
          animate={{ x: [0, cd.drift, 0], y: [0, -2, 0] }}
          transition={{ duration: cd.dur, delay: cd.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <CloudShape style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))' }} className="w-full h-auto" />
        </motion.div>
      ))}
    </div>
  );
}
