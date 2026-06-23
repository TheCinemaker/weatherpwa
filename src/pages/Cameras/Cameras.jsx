import React, { useState } from 'react';
import { Camera, RefreshCw, AlertCircle, Clock, MapPin, X } from 'lucide-react';
import { FadeUp } from '../../components/AppleMotion';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_CAMERAS = [
  { 
    id: 'hepi', 
    name: 'Kőszeg Hegyoldal (Hepi)', 
    status: 'aktív', 
    description: 'Herter Heca Zoltán webkamerája Kőszeg közelében, kilátással a völgyre és a városra.', 
    cover_url: '/api/webcam/hepi', 
    fallback_cover: 'https://cam.idokep.hu/hepi/thumbnail.jpg',
    type: 'live',
    coords: '47.3851;16.5466'
  },
  { 
    id: 'microweb9730', 
    name: 'Kőszeg Belváros (Microweb)', 
    status: 'aktív', 
    description: 'Microweb Internet - Remicro Kft. webkamerája Kőszeg közelében, a városközpont irányába.', 
    cover_url: '/api/webcam/microweb9730', 
    fallback_cover: 'https://cam.idokep.hu/microweb9730/thumbnail.jpg',
    type: 'live',
    coords: '47.38;16.5451'
  },
  { 
    id: 'ha1kyy', 
    name: 'Kendig-csúcs (Nyugat)', 
    status: 'aktív', 
    description: 'Erdészeti Zrt. és Kőszegi Rádióklub webkamerája Kendig-csúcs közelében, nyugati panoráma.', 
    cover_url: '/api/webcam/ha1kyy', 
    fallback_cover: 'https://cam.idokep.hu/ha1kyy/thumbnail.jpg',
    type: 'weather',
    coords: '47.364;16.4834'
  },
  { 
    id: 'ha1kyy3', 
    name: 'Kendig-csúcs (Dél)', 
    status: 'aktív', 
    description: 'Városi Rádióklub Kőszeg webkamerája Kendig-csúcs közelében, déli kilátással.', 
    cover_url: '/api/webcam/ha1kyy3', 
    fallback_cover: 'https://cam.idokep.hu/ha1kyy3/thumbnail.jpg',
    type: 'live',
    coords: '47.3626;16.4648'
  },
  { 
    id: 'eszenyi1', 
    name: 'Kendig-csúcs (Északkelet)', 
    status: 'aktív', 
    description: 'Kőszegi Rádióklub és Erdészeti Zrt. webkamerája Kendig-csúcs ÉK közelében.', 
    cover_url: '/api/webcam/eszenyi1', 
    fallback_cover: 'https://cam.idokep.hu/eszenyi1/thumbnail.jpg',
    type: 'weather',
    coords: '47.3684;16.48'
  }
];

function CameraCard({ cam, onSelect }) {
  const [loading, setLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString('hu-HU'));
  const [imgUrl, setImgUrl] = useState(cam.cover_url);
  const [errorCount, setErrorCount] = useState(0);

  const handleRefresh = () => {
    setLoading(true);
    // Append a unique timestamp parameter to bust client/CDN caching
    const nextUrl = `${cam.cover_url}?_t=${Date.now()}`;
    
    const img = new Image();
    img.src = nextUrl;
    img.onload = () => {
      setImgUrl(nextUrl);
      setLoading(false);
      setErrorCount(0);
      setTimestamp(new Date().toLocaleTimeString('hu-HU'));
    };
    img.onerror = () => {
      // If proxy fails, try fallback cover (direct thumbnail)
      if (errorCount === 0) {
        const fallbackUrl = `${cam.fallback_cover}?_t=${Date.now()}`;
        const fallbackImg = new Image();
        fallbackImg.src = fallbackUrl;
        fallbackImg.onload = () => {
          setImgUrl(fallbackUrl);
          setLoading(false);
          setErrorCount(1);
          setTimestamp(new Date().toLocaleTimeString('hu-HU'));
        };
        fallbackImg.onerror = () => {
          setLoading(false);
          setErrorCount(2);
        };
      } else {
        setLoading(false);
        setErrorCount(2);
      }
    };
  };

  const handleImageError = () => {
    // If the image fails to load via proxy, attempt loading from the direct fallback thumbnail URL
    if (errorCount === 0) {
      setImgUrl(cam.fallback_cover);
      setErrorCount(1);
    } else {
      setErrorCount(2);
    }
  };

  return (
    <div className="glass-card rounded-apple-card overflow-hidden active:scale-[0.99] transition-all group flex flex-col">
      <div 
        onClick={() => errorCount < 2 && onSelect(cam, imgUrl)}
        className={`relative h-[200px] bg-night-900 overflow-hidden flex items-center justify-center ${errorCount < 2 ? 'cursor-pointer' : ''}`}
      >
        {errorCount < 2 ? (
          <img 
            src={imgUrl} 
            alt={cam.name} 
            className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" 
            onError={handleImageError}
          />
        ) : (
          <div className="absolute inset-0 bg-night-950 flex items-center justify-center">
            <Camera className="w-10 h-10 text-night-500" />
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-8 h-8 text-cyan2-300 animate-spin" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/90">Kép frissítése...</span>
          </div>
        )}

        {errorCount === 2 && (
          <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center text-white">
            <span className="px-3 py-1 rounded-full bg-red-500/20 backdrop-blur-md text-[9px] font-extrabold uppercase tracking-widest border border-red-500/30 mb-2">Offline</span>
            <p className="text-[11px] font-bold text-white/75 max-w-[220px]">A kamerakép jelenleg nem elérhető.</p>
          </div>
        )}

        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
          <span className="text-[8px] font-extrabold uppercase tracking-widest bg-black/40 backdrop-blur-md px-2 py-1 rounded-apple-inner text-white/95 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> {timestamp}
          </span>
          <span className="text-[8px] font-extrabold uppercase tracking-widest bg-black/40 backdrop-blur-md px-2 py-1 rounded-apple-inner text-emerald-400">Online</span>
        </div>
      </div>

      <div className="p-5 space-y-3 flex-1 flex flex-col">
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-extrabold text-white leading-tight">{cam.name}</h3>
            {cam.coords && (
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cam.coords.replace(';', ','))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-bold text-cyan2-300 bg-cyan2-500/10 px-2 py-0.5 rounded-apple-inner border border-cyan2-500/25 hover:bg-cyan2-500/20 transition-colors shrink-0 flex items-center gap-1"
              >
                <MapPin className="w-2.5 h-2.5" /> Térkép
              </a>
            )}
          </div>
          <p className="text-xs text-night-200/55 leading-relaxed font-semibold">{cam.description}</p>
          {cam.coords && (
            <p className="text-[10px] text-cyan2-400/40 font-bold flex items-center gap-1">
              Pozíció: {cam.coords.replace(';', ', ')}
            </p>
          )}
        </div>
        <div className="h-px bg-white/10" />
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-cyan2-200/80">{cam.type === 'live' ? 'Városi Kamera' : 'Meteorológiai'}</span>
          <button onClick={handleRefresh} className="btn-grad px-3.5 py-1.5 text-[10px]">
            <RefreshCw className="w-3 h-3" /><span>Kép Lekérése</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Cameras() {
  const [activeCam, setActiveCam] = useState(null);
  const [activeImgUrl, setActiveImgUrl] = useState(null);

  const handleSelect = (cam, url) => {
    setActiveCam(cam);
    setActiveImgUrl(url);
  };

  const handleClose = () => {
    setActiveCam(null);
    setActiveImgUrl(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      <FadeUp>
        <div className="text-center space-y-2 mb-7">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Kőszegi Élő <span className="text-gradient">Kamerák</span></h2>
          <p className="text-xs text-night-200/55 font-bold max-w-md mx-auto leading-relaxed">
            Nézz körül Kőszeg történelmi belvárosában és a környező csúcsokon közvetlenül a kamerákon keresztül!
          </p>
        </div>
      </FadeUp>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
        {INITIAL_CAMERAS.map((cam) => (
          <FadeUp key={cam.id} delay={0.05}>
            <CameraCard cam={cam} onSelect={handleSelect} />
          </FadeUp>
        ))}
      </div>

      <FadeUp delay={0.2}>
        <div className="mt-7 p-5 rounded-apple-card bg-cyan2-400/10 border border-cyan2-400/25 max-w-2xl mx-auto flex gap-3 text-left">
          <AlertCircle className="w-5 h-5 text-cyan2-300 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-extrabold text-white">Figyelmeztetés a közvetítésekről:</h4>
            <p className="text-[11px] text-night-200/65 leading-relaxed font-semibold">
              A kameraképek az Időkép szervereiről kerülnek lekérésre a Netlify-alapú szerveroldali proxy segítségével, elkerülve a böngészők CORS-korlátozásait. A „Kép Lekérése" gombbal manuálisan lekérhető az aktuális legfrissebb felvétel. A képére kattintva megnyithatod a teljes méretű nézetet!
            </p>
          </div>
        </div>
      </FadeUp>

      {/* Modal for full camera view */}
      <AnimatePresence>
        {activeCam && (
          <div 
            onClick={handleClose}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl w-full glass-card rounded-apple-outer overflow-hidden flex flex-col shadow-2xl border border-white/10 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={handleClose}
                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 flex items-center justify-center hover:bg-black/80 hover:scale-105 active:scale-95 transition-all"
                aria-label="Bezárás"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Large Image Container */}
              <div className="relative aspect-video w-full bg-night-950 overflow-hidden flex items-center justify-center">
                <img 
                  src={activeImgUrl} 
                  alt={activeCam.name} 
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Footer details */}
              <div className="p-6 space-y-3 bg-night-900/60">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-white leading-tight">{activeCam.name}</h3>
                    <p className="text-[10px] text-cyan2-300 mt-1 font-bold uppercase tracking-wider">
                      {activeCam.type === 'live' ? 'Városi Kamera' : 'Meteorológiai Webkamera'}
                    </p>
                  </div>
                  {activeCam.coords && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeCam.coords.replace(';', ','))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-grad px-4 py-2 text-xs shrink-0 flex items-center gap-1.5"
                    >
                      <MapPin className="w-4 h-4" /> Térkép megnyitása
                    </a>
                  )}
                </div>
                <div className="h-px bg-white/5" />
                <p className="text-xs text-night-200/70 leading-relaxed font-semibold">
                  {activeCam.description}
                </p>
                {activeCam.coords && (
                  <p className="text-[10px] text-cyan2-400/40 font-bold">
                    Pozíció: {activeCam.coords.replace(';', ', ')}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
