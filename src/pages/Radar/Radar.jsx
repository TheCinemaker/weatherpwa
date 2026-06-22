import React, { useState, useEffect } from 'react';
import { Map, Cloud, CloudRain, Wind, Thermometer, Loader2, AlertCircle } from 'lucide-react';
import { FadeUp } from '../../components/AppleMotion';

const OVERLAYS = [
  { id: 'satellite', label: 'Műhold / Felhők', icon: Cloud, desc: 'Valós idejű műholdfelvételek és felhőzet az Alpokalján.' },
  { id: 'radar', label: 'Csapadékradar', icon: CloudRain, desc: 'Aktuális csapadékintenzitás és zivatarcellák mozgása.' },
  { id: 'wind', label: 'Széláramlás', icon: Wind, desc: 'Pillanatnyi szélirány és szélerősség vizualizáció.' },
  { id: 'temp', label: 'Hőmérsékleti térkép', icon: Thermometer, desc: 'Hőtérkép a régió aktuális és várható hőmérsékletéről.' },
];

export default function Radar() {
  const [activeOverlay, setActiveOverlay] = useState('satellite');
  const [loading, setLoading] = useState(true);

  // Az oldal betöltésekor állítsuk be a címet és görgessünk a tetejére
  useEffect(() => {
    document.title = 'Kőszeg Időjárás – Radar & Felhők';
    window.scrollTo(0, 0);
  }, []);

  const handleOverlayChange = (overlayId) => {
    if (overlayId !== activeOverlay) {
      setLoading(true);
      setActiveOverlay(overlayId);
    }
  };

  const currentOverlayInfo = OVERLAYS.find(o => o.id === activeOverlay);

  // Windy embed URL generálása Kőszeg koordinátáival (lat=47.389, lon=16.541)
  const windyEmbedUrl = `https://embed.windy.com/embed2.html?lat=47.389&lon=16.541&zoom=10&level=surface&overlay=${activeOverlay}&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1`;

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-6">
      {/* Címsor */}
      <FadeUp>
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Map className="w-6 h-6 text-cyan2-300" />
              <span>Radar &amp; <span className="text-gradient">Felhők</span></span>
            </h1>
            <p className="text-xs text-night-200/55 font-semibold mt-0.5">
              Windy.com interaktív műhold- és csapadékradar Kőszeg térségére hangolva
            </p>
          </div>
        </div>
      </FadeUp>

      {/* Tabs / Választógombok */}
      <FadeUp delay={0.05}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {OVERLAYS.map(({ id, label, icon: Icon }) => {
            const active = activeOverlay === id;
            return (
              <button
                key={id}
                onClick={() => handleOverlayChange(id)}
                className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
                  active
                    ? 'bg-brand-gradient text-white border-cyan2-400/30 shadow-glow'
                    : 'glass-card text-night-200/75 hover:text-white border-white/5 hover:border-white/10 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-cyan2-400'}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </FadeUp>

      {/* Aktív overlay leírása */}
      <FadeUp delay={0.08}>
        <p className="text-xs font-semibold text-night-200/60 pl-1">
          {currentOverlayInfo ? currentOverlayInfo.desc : ''}
        </p>
      </FadeUp>

      {/* Térkép kártya */}
      <FadeUp delay={0.1}>
        <div className="relative glass-card rounded-[2rem] p-3 overflow-hidden aspect-[4/3] md:aspect-[16/9] w-full min-h-[400px] md:min-h-[500px]">
          {/* Betöltés jelző */}
          {loading && (
            <div className="absolute inset-0 z-20 bg-night-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 text-cyan2-400 animate-spin" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-white/90">
                Térkép betöltése...
              </span>
            </div>
          )}

          {/* Iframe */}
          <iframe
            key={activeOverlay}
            src={windyEmbedUrl}
            onLoad={() => setLoading(false)}
            className="w-full h-full rounded-[1.5rem] border-0"
            title={`Windy ${activeOverlay} overlay`}
            allowFullScreen
          />
        </div>
      </FadeUp>

      {/* Segítség / Használati útmutató */}
      <FadeUp delay={0.15}>
        <div className="p-5 rounded-[1.5rem] bg-cyan2-400/5 border border-cyan2-400/15 max-w-4xl mx-auto flex gap-3 text-left">
          <AlertCircle className="w-5 h-5 text-cyan2-300 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-extrabold text-white">Hogyan használd a térképet?</h4>
            <p className="text-[11px] text-night-200/60 leading-relaxed font-semibold">
              • **Adatforrás**: Ezek az interaktív térképes adatok nem a saját időjárás állomásunk közvetlen mérései, a vizualizációt és az előrejelzéseket a **Windy.com** szolgáltatja.<br />
              • A térkép bal alsó sarkában található **lejátszás gombbal** (Play) indíthatod el a felhők vagy csapadék mozgásának animációját.<br />
              • A térképet szabadon **húzhatod és nagyíthatod / kicsinyítheted** (egér görgővel vagy mobilon két ujjal).<br />
              • Ha rákattintasz a térképen egy pontra, megkapod a részletes helyi előrejelzést az adott koordinátára.<br />
              • A jobb oldali skálákon láthatod az értékek magyarázatát (pl. szélsebesség m/s-ban, csapadék mm-ben).
            </p>
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
