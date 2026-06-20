import React, { useState } from 'react';
import { Camera, RefreshCw, Eye, AlertCircle, Clock } from 'lucide-react';
import { FadeUp } from '../../components/AppleMotion';

const INITIAL_CAMERAS = [
  {
    id: 1,
    name: 'Kőszeg Főtér (Jurisics tér)',
    status: 'előkészítés alatt',
    description: 'Jurisics tér történelmi látképe. Élő közvetítés hamarosan elérhető lesz.',
    cover_url: 'https://images.unsplash.com/photo-1549692520-acc6669e2f0c?w=800',
    type: 'live'
  },
  {
    id: 2,
    name: 'Írott-kő Kilátó (884m)',
    status: 'fejlesztés alatt',
    description: 'Panoráma az Alpokalja legmagasabb pontjáról. Meteorológiai webkamera kép.',
    cover_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    type: 'weather'
  },
  {
    id: 3,
    name: 'Kálvária-hegy és templom',
    status: 'előkészítés alatt',
    description: 'Látkép a Kálvária templom és a kőszegi völgy felé.',
    cover_url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
    type: 'live'
  },
  {
    id: 4,
    name: 'Óház-kilátó (609m)',
    status: 'fejlesztés alatt',
    description: 'Hegyvidéki webkamera, amely a szélsebesség és köd mérésére szolgál.',
    cover_url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
    type: 'weather'
  }
];

function CameraCard({ cam }) {
  const [loading, setLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString('hu-HU'));

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setTimestamp(new Date().toLocaleTimeString('hu-HU'));
    }, 1200);
  };

  return (
    <div className="bg-[#f9f5f1]/85 dark:bg-[#0c1726]/90 backdrop-blur-[45px] border border-[#e9d8c9]/60 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all group flex flex-col justify-between">
      
      {/* Viewport block */}
      <div className="relative h-[220px] bg-gray-950 overflow-hidden flex items-center justify-center">
        {/* Underlay Cover Image */}
        <img 
          src={cam.cover_url} 
          alt={cam.name} 
          className="absolute inset-0 w-full h-full object-cover opacity-35 filter blur-[1px] group-hover:scale-105 transition-transform duration-700"
        />

        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-8 h-8 text-[#0bc9f8] animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Kép frissítése...</span>
          </div>
        )}

        {/* Webcam stream placeholder overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center text-white">
          <Camera className="w-10 h-10 text-[#0bc9f8] mb-3 group-hover:scale-110 transition-transform" />
          <span className="px-3 py-1 rounded-full bg-[#b36022]/85 text-[9px] font-black uppercase tracking-widest border border-[#b36022]/20 mb-2">
            {cam.status}
          </span>
          <p className="text-[11px] font-black text-white/70 max-w-[220px]">
            Kamerakép betöltése folyamatban...
          </p>
        </div>

        {/* Top bar timestamp metadata */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <span className="text-[8px] font-black uppercase tracking-widest bg-black/40 backdrop-blur-md px-2 py-1 rounded text-white/95 border border-white/5 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {timestamp}
          </span>
          <span className="text-[8px] font-black uppercase tracking-widest bg-black/40 backdrop-blur-md px-2 py-1 rounded text-emerald-400 border border-white/5">
            Offline
          </span>
        </div>

      </div>

      {/* Body description */}
      <div className="p-6 space-y-3">
        <div>
          <h3 className="text-sm font-black text-[#123a57] dark:text-white leading-tight">
            {cam.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed font-semibold">
            {cam.description}
          </p>
        </div>

        <div className="h-px bg-[#e9d8c9]/70 dark:bg-white/10 my-3" />

        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-[#0a97be] bg-[#123a57]/5 dark:bg-white/10 px-2.5 py-1 rounded-lg">
            {cam.type === 'live' ? 'Városi Kamera' : 'Meteorológiai'}
          </span>
          
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#123a57] hover:bg-[#0a97be] text-white text-[10px] font-bold shadow-md transition-all active:scale-95 shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Kép Lekérése</span>
          </button>
        </div>
      </div>

    </div>
  );
}

export default function Cameras() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Title */}
      <FadeUp>
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-[#123a57] dark:text-white tracking-tight">
            Kőszegi Élő Kamerák (Webcams)
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold max-w-md mx-auto leading-relaxed">
            Nézz körül Kőszeg történelmi belvárosában és a környező csúcsokon közvetlenül a kamerákon keresztül!
          </p>
        </div>
      </FadeUp>

      {/* Cameras Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {INITIAL_CAMERAS.map((cam) => (
          <FadeUp key={cam.id} delay={cam.id * 0.05}>
            <CameraCard cam={cam} />
          </FadeUp>
        ))}
      </div>

      {/* Info Warning notice */}
      <FadeUp delay={0.3}>
        <div className="mt-10 p-5 rounded-[2rem] bg-amber-500/10 border border-amber-500/30 max-w-2xl mx-auto flex gap-3 text-left">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-[#123a57] dark:text-white">Figyelmeztetés a közvetítésekről:</h4>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed font-semibold">
              A kameraképek átmenetileg előkészítés alatt vannak, amíg az IP-kamera streamek hálózati portjai és az RTSP-to-Web parser szerverünk konfigurálásra nem kerül. A fejlesztés gombra kattintva manuálisan újra próbálhatod lekérni a legfrissebb állóképet.
            </p>
          </div>
        </div>
      </FadeUp>

    </div>
  );
}
