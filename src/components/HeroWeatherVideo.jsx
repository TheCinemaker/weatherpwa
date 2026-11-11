import React, { useState, useEffect } from 'react';

// Fájlnevek a Flow prompt-gyűjtemény konvenciója szerint (lásd public/videos/README.txt).
// 16:9-es klipek (2026-11-es csere) — minden kategóriának van nappali és
// éjszakai változata is, lásd src/utils/weatherVideoCategory.js.
export const HERO_VIDEO_MAP = {
  'clear-day':          '/videos/01-derult-nappal.mp4',
  'clear-night':        '/videos/02-derult-ejszaka.mp4',
  'partly-cloudy-day':  '/videos/03-valtozoan-felhos-nappal.mp4',
  'partly-cloudy-night':'/videos/04-valtozoan-felhos-ejszaka.mp4',
  'overcast-day':       '/videos/05-borult-nappal.mp4',
  'overcast-night':     '/videos/06-borult-ejszaka.mp4',
  'fog-day':            '/videos/07-kodos-nappal.mp4',
  'fog-night':          '/videos/08-kodos-ejszaka.mp4',
  'drizzle-day':        '/videos/09-szemerkelo-eso-nappal.mp4',
  'drizzle-night':      '/videos/10-szemerkelo-eso-ejszaka.mp4',
  'rain-day':           '/videos/11-eso-nappal.mp4',
  'rain-night':         '/videos/12-eso-ejszaka.mp4',
  'heavy-rain-day':     '/videos/13-felhoszakadas-nappal.mp4',
  'heavy-rain-night':   '/videos/14-felhoszakadas-ejszaka.mp4',
  'thunderstorm-day':   '/videos/15-zivatar-nappal.mp4',
  'thunderstorm-night': '/videos/16-zivatar-ejszaka.mp4',
  'snow-day':           '/videos/17-havazas-nappal.mp4',
  'snow-night':         '/videos/18-havazas-ejszaka.mp4',
  'windy-day':          '/videos/19-szeles-nappal.mp4',
  'windy-night':        '/videos/20-szeles-ejszaka.mp4',
};

// Ha egy adott kategóriához még nincs meg a végleges videófájl a public/videos/ mappában,
// a napszakban és hangulatban legközelebbi meglévő klipre esik vissza (mielőtt az SVG-re váltana).
const HERO_VIDEO_FALLBACK = {
  'partly-cloudy-day':  '/videos/05-borult-nappal.mp4',
  'overcast-night':     '/videos/04-valtozoan-felhos-ejszaka.mp4',
  'rain-night':         '/videos/10-szemerkelo-eso-ejszaka.mp4',
  'heavy-rain-day':     '/videos/11-eso-nappal.mp4',
  'heavy-rain-night':   '/videos/16-zivatar-ejszaka.mp4',
  'thunderstorm-day':   '/videos/11-eso-nappal.mp4',
  'snow-day':           '/videos/07-kodos-nappal.mp4',
  'snow-night':         '/videos/08-kodos-ejszaka.mp4',
};

/**
 * Egyszerű, végtelenített (loop) időjárás-videó — nincs scroll-mechanika,
 * csak egy hangulati klip a hero-kártyában. Ha az elsődleges fájl még hiányzik,
 * előbb a legközelebbi meglévő videóra próbál váltani, majd a HeroSky SVG-re.
 */
export default function HeroWeatherVideo({ category, className = '', style, onError, ariaHidden }) {
  const primarySrc = HERO_VIDEO_MAP[category] || HERO_VIDEO_MAP['clear-day'];
  const fallbackSrc = HERO_VIDEO_FALLBACK[category] || null;
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    setUseFallback(false);
  }, [category]);

  const src = useFallback && fallbackSrc ? fallbackSrc : primarySrc;

  const handleError = (e) => {
    if (!useFallback && fallbackSrc && fallbackSrc !== primarySrc) {
      setUseFallback(true);
      return;
    }
    if (onError) onError(e);
  };

  return (
    <video
      key={src}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      onError={handleError}
      className={className}
      style={style}
      aria-hidden={ariaHidden}
    />
  );
}
