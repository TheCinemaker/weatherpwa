import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, AlertTriangle, X, Image as ImageIcon, Trash2, Sun, Moon, CloudSun, Cloud, CloudRain, CloudDrizzle, CloudLightning, CloudSnow, Snowflake, CloudFog, Wind, CloudHail } from 'lucide-react';
import { FadeUp } from '../../components/AppleMotion';
import { useAdminUnlock } from '../../components/AdminContext';
import { getForecast, saveForecast, uploadForecastImage } from '../../api/supabase';

// SVG Weather icon dictionary matching available choices
const WEATHER_ICONS = {
  'sun': { Icon: Sun, label: 'Napos / Derült' },
  'cloud-sun': { Icon: CloudSun, label: 'Változóan felhős' },
  'cloud': { Icon: Cloud, label: 'Borult / Felhős' },
  'cloud-rain': { Icon: CloudRain, label: 'Eső' },
  'cloud-drizzle': { Icon: CloudDrizzle, label: 'Szitálás / Csendes eső' },
  'cloud-lightning': { Icon: CloudLightning, label: 'Zápor / Zivatar' },
  'cloud-snow': { Icon: CloudSnow, label: 'Hószállingózás' },
  'snowflake': { Icon: Snowflake, label: 'Havazás' },
  'cloud-fog': { Icon: CloudFog, label: 'Köd' },
  'wind': { Icon: Wind, label: 'Erős szél' },
  'cloud-hail': { Icon: CloudHail, label: 'Jégeső' },
  'moon': { Icon: Moon, label: 'Derült éjszaka' }
};

function compressForecastImage(file, maxW = 1000) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(resolve, 'image/jpeg', 0.85);
    };
    img.src = url;
  });
}

export default function Forecast() {
  const [activeTab, setActiveTab] = useState('1day'); // '1day' or '3day'
  
  const [forecastData, setForecastData] = useState({
    title: 'Helyzetjelentés: Betöltés...',
    content: 'Kérjük, várjon...',
    image_url: '',
    title_3day: '3 napos előrejelzés: Betöltés...',
    content_3day: 'Kérjük, várjon...',
    image_url_3day: '',
    card1_icon: 'sun',
    card1_desc: 'Napos',
    card1_temp_min: 15,
    card1_temp_max: 25,
    card2_icon: 'cloud-sun',
    card2_desc: 'Változóan felhős',
    card2_temp_min: 16,
    card2_temp_max: 26,
    card3_icon: 'cloud-rain',
    card3_desc: 'Záporok',
    card3_temp_min: 14,
    card3_temp_max: 22,
    announcement_text: '',
    announcement_active: false,
    updated_at: new Date().toISOString()
  });

  const [showAdmin, setShowAdmin] = useState(false);

  // Admin belépés a (közös) logóról: sikeres PIN után nyíljon a szerkesztő.
  useAdminUnlock(() => setShowAdmin(true));

  // Form states for Admin Edit
  const [adminTitle, setAdminTitle] = useState('');
  const [adminContent, setAdminContent] = useState('');
  const [adminImageUrl, setAdminImageUrl] = useState('');
  const [selectedFile1, setSelectedFile1] = useState(null);
  const [imagePreview1, setImagePreview1] = useState(null);

  const [adminTitle3day, setAdminTitle3day] = useState('');
  const [adminContent3day, setAdminContent3day] = useState('');
  const [adminImageUrl3day, setAdminImageUrl3day] = useState('');
  const [selectedFile3, setSelectedFile3] = useState(null);
  const [imagePreview3, setImagePreview3] = useState(null);

  // Manual Cards editing states
  const [adminCard1Icon, setAdminCard1Icon] = useState('sun');
  const [adminCard1Desc, setAdminCard1Desc] = useState('');
  const [adminCard1TempMin, setAdminCard1TempMin] = useState(15);
  const [adminCard1TempMax, setAdminCard1TempMax] = useState(25);

  const [adminCard2Icon, setAdminCard2Icon] = useState('cloud-sun');
  const [adminCard2Desc, setAdminCard2Desc] = useState('');
  const [adminCard2TempMin, setAdminCard2TempMin] = useState(16);
  const [adminCard2TempMax, setAdminCard2TempMax] = useState(26);

  const [adminCard3Icon, setAdminCard3Icon] = useState('cloud-rain');
  const [adminCard3Desc, setAdminCard3Desc] = useState('');
  const [adminCard3TempMin, setAdminCard3TempMin] = useState(14);
  const [adminCard3TempMax, setAdminCard3TempMax] = useState(22);
  
  const [adminAnnText, setAdminAnnText] = useState('');
  const [adminAnnActive, setAdminAnnActive] = useState(false);
  
  const [zoomImage, setZoomImage] = useState(null);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    document.title = 'Kőszeg Időjárás – Előrejelzés';
    window.scrollTo(0, 0);

    // Fetch local forecast
    getForecast().then(data => {
      setForecastData(data);
      
      // 1 day
      setAdminTitle(data.title || '');
      setAdminContent(data.content || '');
      setAdminImageUrl(data.image_url || '');
      setImagePreview1(data.image_url || null);
      
      // 3 day
      setAdminTitle3day(data.title_3day || '');
      setAdminContent3day(data.content_3day || '');
      setAdminImageUrl3day(data.image_url_3day || '');
      setImagePreview3(data.image_url_3day || null);

      // Card 1
      setAdminCard1Icon(data.card1_icon || 'sun');
      setAdminCard1Desc(data.card1_desc || 'Napos');
      setAdminCard1TempMin(data.card1_temp_min ?? 15);
      setAdminCard1TempMax(data.card1_temp_max ?? 25);

      // Card 2
      setAdminCard2Icon(data.card2_icon || 'cloud-sun');
      setAdminCard2Desc(data.card2_desc || 'Változóan felhős');
      setAdminCard2TempMin(data.card2_temp_min ?? 16);
      setAdminCard2TempMax(data.card2_temp_max ?? 26);

      // Card 3
      setAdminCard3Icon(data.card3_icon || 'cloud-rain');
      setAdminCard3Desc(data.card3_desc || 'Záporok');
      setAdminCard3TempMin(data.card3_temp_min ?? 14);
      setAdminCard3TempMax(data.card3_temp_max ?? 22);

      setAdminAnnText(data.announcement_text || '');
      setAdminAnnActive(data.announcement_active || false);
    });
  }, []);


  const handleImage1Change = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile1(file);
      setImagePreview1(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage1 = () => {
    setSelectedFile1(null);
    setImagePreview1(null);
    setAdminImageUrl('');
  };

  const handleImage3Change = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile3(file);
      setImagePreview3(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage3 = () => {
    setSelectedFile3(null);
    setImagePreview3(null);
    setAdminImageUrl3day('');
  };

  const handleSaveForecast = async () => {
    if (!adminTitle.trim() || !adminContent.trim() || !adminTitle3day.trim() || !adminContent3day.trim()) {
      setAdminError('Kérjük, töltsd ki az előrejelzés mezőket mindkét fülhöz!');
      return;
    }
    setSavingAdmin(true);
    setAdminError('');
    try {
      let finalImageUrl = adminImageUrl;
      if (selectedFile1) {
        const compressed = await compressForecastImage(selectedFile1);
        finalImageUrl = await uploadForecastImage(compressed);
      } else if (!imagePreview1) {
        finalImageUrl = '';
      }

      let finalImageUrl3day = adminImageUrl3day;
      if (selectedFile3) {
        const compressed = await compressForecastImage(selectedFile3);
        finalImageUrl3day = await uploadForecastImage(compressed);
      } else if (!imagePreview3) {
        finalImageUrl3day = '';
      }

      const data = await saveForecast({
        title: adminTitle.trim(),
        content: adminContent.trim(),
        image_url: finalImageUrl,
        title_3day: adminTitle3day.trim(),
        content_3day: adminContent3day.trim(),
        image_url_3day: finalImageUrl3day,
        
        card1_icon: adminCard1Icon,
        card1_desc: adminCard1Desc.trim(),
        card1_temp_min: parseFloat(adminCard1TempMin),
        card1_temp_max: parseFloat(adminCard1TempMax),
        
        card2_icon: adminCard2Icon,
        card2_desc: adminCard2Desc.trim(),
        card2_temp_min: parseFloat(adminCard2TempMin),
        card2_temp_max: parseFloat(adminCard2TempMax),
        
        card3_icon: adminCard3Icon,
        card3_desc: adminCard3Desc.trim(),
        card3_temp_min: parseFloat(adminCard3TempMin),
        card3_temp_max: parseFloat(adminCard3TempMax),
        
        announcement_text: adminAnnText.trim(),
        announcement_active: adminAnnActive
      });
      
      setForecastData(data);
      setAdminImageUrl(data.image_url || '');
      setImagePreview1(data.image_url || null);
      setSelectedFile1(null);

      setAdminImageUrl3day(data.image_url_3day || '');
      setImagePreview3(data.image_url_3day || null);
      setSelectedFile3(null);

      setShowAdmin(false);
    } catch (err) {
      console.error(err);
      setAdminError(err.message || 'Hiba történt a mentés során.');
    } finally {
      setSavingAdmin(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6">
      {/* Page Header */}
      <FadeUp>
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-6 h-6 text-cyan2-300" />
              <span>Kőszegi <span className="text-gradient">Előrejelzés</span></span>
            </h1>
            <p className="text-xs text-night-200/55 font-semibold mt-0.5">
              Ráduly László napi és 3 napos elemzései
            </p>
          </div>
        </div>
      </FadeUp>

      {/* --- FORECAST CARD WITH TABS --- */}
      <FadeUp delay={0.05}>
        <div className="relative glass-card rounded-[2rem] p-6 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-cyan2-500/10 blur-3xl pointer-events-none" />

          {/* Card Header: Title, Tabs & Admin Hold Hint */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2 shrink-0">
                <span className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center text-white">
                  <Calendar className="w-4 h-4" />
                </span>
                <span className="hidden xs:inline">Előrejelzés az Alpokaljára</span>
                <span className="xs:hidden">Előrejelzés</span>
              </h2>

              {/* TABS COMPONENT */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveTab('1day'); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeTab === '1day' ? 'bg-brand-gradient text-white shadow-glow' : 'text-night-200 hover:text-white'}`}
                >
                  1 Napos
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveTab('3day'); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeTab === '3day' ? 'bg-brand-gradient text-white shadow-glow' : 'text-night-200 hover:text-white'}`}
                >
                  3 Napos
                </button>
              </div>
            </div>
          </div>

          {/* Card Body: Switches based on active tab */}
          <div className="space-y-4 relative z-10">
            {activeTab === '1day' ? (
              <>
                <h3 className="text-base font-extrabold text-cyan2-200 leading-snug">
                  {forecastData.title}
                </h3>
                <p className="text-[10px] font-bold text-night-200/50 uppercase tracking-wide">
                  Készítette: Ráduly László · Frissítve: {new Date(forecastData.updated_at).toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="h-px bg-white/5 my-2.5" />
                <p className="text-sm text-night-100/85 leading-relaxed whitespace-pre-wrap font-medium">
                  {forecastData.content}
                </p>
                
                {/* 1-day manual forecast image display */}
                {forecastData.image_url && (
                  <div className="mt-6 rounded-2xl overflow-hidden border border-white/10 bg-black/25 max-w-2xl mx-auto hover:border-cyan2-400/40 transition-colors duration-300 cursor-zoom-in">
                    <img 
                      src={forecastData.image_url} 
                      alt="Napi előrejelzési térkép" 
                      onClick={() => setZoomImage(forecastData.image_url)}
                      className="w-full h-auto object-contain max-h-[420px] active:scale-95 transition-transform"
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="text-base font-extrabold text-cyan2-200 leading-snug">
                  {forecastData.title_3day}
                </h3>
                <p className="text-[10px] font-bold text-night-200/50 uppercase tracking-wide">
                  Készítette: Ráduly László · Frissítve: {new Date(forecastData.updated_at).toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="h-px bg-white/5 my-2.5" />
                <p className="text-sm text-night-100/85 leading-relaxed whitespace-pre-wrap font-medium">
                  {forecastData.content_3day}
                </p>
                
                {/* Manual 3-day cards layout */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  {/* Card 1: Today */}
                  <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-between text-center relative overflow-hidden bg-white/[0.01] hover:border-white/20 transition-colors duration-300">
                    <span className="text-[10px] font-bold text-night-200/40 uppercase tracking-widest">Ma</span>
                    <div className="my-3.5 w-12 h-12 rounded-xl bg-cyan2-400/[0.07] flex items-center justify-center text-cyan2-300">
                      {(() => {
                        const IconComp = WEATHER_ICONS[forecastData.card1_icon]?.Icon || Sun;
                        return <IconComp className="w-6 h-6" />;
                      })()}
                    </div>
                    <span className="text-xs font-extrabold text-white leading-tight mb-2.5">
                      {forecastData.card1_desc}
                    </span>
                    <div className="flex gap-3 text-xs border-t border-white/5 pt-2 w-full justify-center">
                      <div className="text-center">
                        <span className="text-[10px] text-night-200/60 uppercase tracking-wider block">Min</span>
                        <span className="text-sky2-300 font-extrabold">{Math.round(forecastData.card1_temp_min)}°C</span>
                      </div>
                      <div className="w-px h-6 bg-white/10" />
                      <div className="text-center">
                        <span className="text-[10px] text-night-200/60 uppercase tracking-wider block">Max</span>
                        <span className="text-rose-300 font-extrabold">{Math.round(forecastData.card1_temp_max)}°C</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Tomorrow */}
                  <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-between text-center relative overflow-hidden bg-white/[0.01] hover:border-white/20 transition-colors duration-300">
                    <span className="text-[10px] font-bold text-night-200/40 uppercase tracking-widest">Holnap</span>
                    <div className="my-3.5 w-12 h-12 rounded-xl bg-cyan2-400/[0.07] flex items-center justify-center text-cyan2-300">
                      {(() => {
                        const IconComp = WEATHER_ICONS[forecastData.card2_icon]?.Icon || Sun;
                        return <IconComp className="w-6 h-6" />;
                      })()}
                    </div>
                    <span className="text-xs font-extrabold text-white leading-tight mb-2.5">
                      {forecastData.card2_desc}
                    </span>
                    <div className="flex gap-3 text-xs border-t border-white/5 pt-2 w-full justify-center">
                      <div className="text-center">
                        <span className="text-[10px] text-night-200/60 uppercase tracking-wider block">Min</span>
                        <span className="text-sky2-300 font-extrabold">{Math.round(forecastData.card2_temp_min)}°C</span>
                      </div>
                      <div className="w-px h-6 bg-white/10" />
                      <div className="text-center">
                        <span className="text-[10px] text-night-200/60 uppercase tracking-wider block">Max</span>
                        <span className="text-rose-300 font-extrabold">{Math.round(forecastData.card2_temp_max)}°C</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Day After */}
                  <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-between text-center relative overflow-hidden bg-white/[0.01] hover:border-white/20 transition-colors duration-300">
                    <span className="text-[10px] font-bold text-night-200/40 uppercase tracking-widest">Holnapután</span>
                    <div className="my-3.5 w-12 h-12 rounded-xl bg-cyan2-400/[0.07] flex items-center justify-center text-cyan2-300">
                      {(() => {
                        const IconComp = WEATHER_ICONS[forecastData.card3_icon]?.Icon || Sun;
                        return <IconComp className="w-6 h-6" />;
                      })()}
                    </div>
                    <span className="text-xs font-extrabold text-white leading-tight mb-2.5">
                      {forecastData.card3_desc}
                    </span>
                    <div className="flex gap-3 text-xs border-t border-white/5 pt-2 w-full justify-center">
                      <div className="text-center">
                        <span className="text-[10px] text-night-200/60 uppercase tracking-wider block">Min</span>
                        <span className="text-sky2-300 font-extrabold">{Math.round(forecastData.card3_temp_min)}°C</span>
                      </div>
                      <div className="w-px h-6 bg-white/10" />
                      <div className="text-center">
                        <span className="text-[10px] text-night-200/60 uppercase tracking-wider block">Max</span>
                        <span className="text-rose-300 font-extrabold">{Math.round(forecastData.card3_temp_max)}°C</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 3-day manual forecast image display */}
                {forecastData.image_url_3day && (
                  <div className="mt-6 rounded-2xl overflow-hidden border border-white/10 bg-black/25 max-w-2xl mx-auto hover:border-cyan2-400/40 transition-colors duration-300 cursor-zoom-in">
                    <img 
                      src={forecastData.image_url_3day} 
                      alt="3 napos előrejelzési térkép" 
                      onClick={() => setZoomImage(forecastData.image_url_3day)}
                      className="w-full h-auto object-contain max-h-[420px] active:scale-95 transition-transform"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </FadeUp>

      {/* --- FORECAST IMAGE ZOOM LIGHTBOX --- */}
      <AnimatePresence>
        {zoomImage && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomImage(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-zoom-out"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl max-h-[90vh] z-10 flex flex-col items-center"
            >
              <img
                src={zoomImage}
                alt="Előrejelzés térkép nagyítva"
                className="max-w-full max-h-[80vh] object-contain rounded-xl border border-white/10"
              />
              <button
                onClick={() => setZoomImage(null)}
                className="mt-4 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <X className="w-4 h-4" /> Bezárás
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FORECAST ADMIN MODAL --- */}
      <AnimatePresence>
        {showAdmin && (
          <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }} transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-md"
              onClick={() => setShowAdmin(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
              transition={{ type: 'spring', stiffness: 440, damping: 34, mass: 0.7 }}
              className="relative w-full max-w-lg bg-night-800 rounded-[2rem] p-5 flex flex-col gap-4 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center text-white">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <span>Előrejelzések szerkesztése (Laci)</span>
                </h3>
                <button
                  onClick={() => setShowAdmin(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                
                {/* --- 1 NAPOS GROUP --- */}
                <div className="space-y-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] font-black uppercase text-cyan2-300 tracking-wider">1 Napos Előrejelzés</span>
                  <div>
                    <label className="text-[9px] font-bold text-night-200/50 uppercase tracking-widest mb-1.5 block">Cím</label>
                    <input
                      type="text"
                      value={adminTitle}
                      onChange={e => setAdminTitle(e.target.value.slice(0, 80))}
                      placeholder="Pl.: Lassú felmelegedés és záporok..."
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs font-semibold placeholder:text-night-200/35 focus:outline-none focus:ring-2 focus:ring-cyan2-400/50"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-night-200/50 uppercase tracking-widest mb-1.5 block">Részletek</label>
                    <textarea
                      rows={3}
                      value={adminContent}
                      onChange={e => setAdminContent(e.target.value)}
                      placeholder="Elemzés szövege..."
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs font-semibold placeholder:text-night-200/35 focus:outline-none focus:ring-2 focus:ring-cyan2-400/50 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Képfeltöltés az 1 naposhoz */}
                  <div>
                    <label className="text-[9px] font-bold text-night-200/50 uppercase tracking-widest mb-1.5 block">Előrejelzés Kép (opcionális)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImage1Change}
                      className="hidden"
                      id="forecast-img-file-1"
                    />
                    <div className="flex flex-col gap-3">
                      {imagePreview1 ? (
                        <div className="relative w-full h-24 rounded-xl overflow-hidden border border-white/10 bg-black/20 flex items-center justify-center">
                          <img src={imagePreview1} alt="Forecast 1 előnézet" className="h-full object-contain" />
                          <button
                            type="button"
                            onClick={handleRemoveImage1}
                            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-md"
                            title="Kép eltávolítása"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="forecast-img-file-1"
                          className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-white/20 hover:border-cyan2-400/40 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer text-xs font-bold text-white transition-all text-center"
                        >
                          <ImageIcon className="w-4 h-4 text-cyan2-300" />
                          <span>Kép feltöltése (1 Napos)</span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* --- 3 NAPOS GROUP --- */}
                <div className="space-y-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] font-black uppercase text-cyan2-300 tracking-wider">3 Napos Előrejelzés</span>
                  <div>
                    <label className="text-[9px] font-bold text-night-200/50 uppercase tracking-widest mb-1.5 block">Cím</label>
                    <input
                      type="text"
                      value={adminTitle3day}
                      onChange={e => setAdminTitle3day(e.target.value.slice(0, 80))}
                      placeholder="Pl.: 3 napos elemzés: Hétvégi lehűlés..."
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs font-semibold placeholder:text-night-200/35 focus:outline-none focus:ring-2 focus:ring-cyan2-400/50"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-night-200/50 uppercase tracking-widest mb-1.5 block">Részletek</label>
                    <textarea
                      rows={3}
                      value={adminContent3day}
                      onChange={e => setAdminContent3day(e.target.value)}
                      placeholder="3 napos elemzés szövege..."
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs font-semibold placeholder:text-night-200/35 focus:outline-none focus:ring-2 focus:ring-cyan2-400/50 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Képfeltöltés a 3 naposhoz */}
                  <div>
                    <label className="text-[9px] font-bold text-night-200/50 uppercase tracking-widest mb-1.5 block">Előrejelzés Kép (opcionális)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImage3Change}
                      className="hidden"
                      id="forecast-img-file-3"
                    />
                    <div className="flex flex-col gap-3">
                      {imagePreview3 ? (
                        <div className="relative w-full h-24 rounded-xl overflow-hidden border border-white/10 bg-black/20 flex items-center justify-center">
                          <img src={imagePreview3} alt="Forecast 3 előnézet" className="h-full object-contain" />
                          <button
                            type="button"
                            onClick={handleRemoveImage3}
                            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-md"
                            title="Kép eltávolítása"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="forecast-img-file-3"
                          className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-white/20 hover:border-cyan2-400/40 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer text-xs font-bold text-white transition-all text-center"
                        >
                          <ImageIcon className="w-4 h-4 text-cyan2-300" />
                          <span>Kép feltöltése (3 Napos)</span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* --- 3 NAPOS NAPI BONTÁS KÁRTYÁK --- */}
                <div className="space-y-3.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] font-black uppercase text-cyan2-300 tracking-wider">3 Napos Kártyák Szerkesztése</span>
                  
                  {/* Day 1: Ma */}
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2.5">
                    <span className="text-[9px] font-bold text-white/70 block uppercase">1. Nap (Ma)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] text-night-200/50 uppercase font-bold tracking-wider mb-1 block">Ikon</label>
                        <select
                          value={adminCard1Icon}
                          onChange={e => setAdminCard1Icon(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-white/10 bg-night-800 text-white text-xs font-bold focus:outline-none"
                        >
                          {Object.entries(WEATHER_ICONS).map(([key, item]) => (
                            <option key={key} value={key}>{item.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] text-night-200/50 uppercase font-bold tracking-wider mb-1 block">Leírás</label>
                        <input
                          type="text"
                          value={adminCard1Desc}
                          onChange={e => setAdminCard1Desc(e.target.value.slice(0, 30))}
                          placeholder="Pl.: Napos, szeles"
                          className="w-full px-2 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-white text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] text-night-200/50 uppercase font-bold tracking-wider mb-1 block">Min Hőm (°C)</label>
                        <input
                          type="number"
                          value={adminCard1TempMin}
                          onChange={e => setAdminCard1TempMin(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-white text-xs font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-night-200/50 uppercase font-bold tracking-wider mb-1 block">Max Hőm (°C)</label>
                        <input
                          type="number"
                          value={adminCard1TempMax}
                          onChange={e => setAdminCard1TempMax(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-white text-xs font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Day 2: Holnap */}
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2.5">
                    <span className="text-[9px] font-bold text-white/70 block uppercase">2. Nap (Holnap)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] text-night-200/50 uppercase font-bold tracking-wider mb-1 block">Ikon</label>
                        <select
                          value={adminCard2Icon}
                          onChange={e => setAdminCard2Icon(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-white/10 bg-night-800 text-white text-xs font-bold focus:outline-none"
                        >
                          {Object.entries(WEATHER_ICONS).map(([key, item]) => (
                            <option key={key} value={key}>{item.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] text-night-200/50 uppercase font-bold tracking-wider mb-1 block">Leírás</label>
                        <input
                          type="text"
                          value={adminCard2Desc}
                          onChange={e => setAdminCard2Desc(e.target.value.slice(0, 30))}
                          placeholder="Pl.: Borult, záporok"
                          className="w-full px-2 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-white text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] text-night-200/50 uppercase font-bold tracking-wider mb-1 block">Min Hőm (°C)</label>
                        <input
                          type="number"
                          value={adminCard2TempMin}
                          onChange={e => setAdminCard2TempMin(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-white text-xs font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-night-200/50 uppercase font-bold tracking-wider mb-1 block">Max Hőm (°C)</label>
                        <input
                          type="number"
                          value={adminCard2TempMax}
                          onChange={e => setAdminCard2TempMax(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-white text-xs font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Day 3: Holnapután */}
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2.5">
                    <span className="text-[9px] font-bold text-white/70 block uppercase">3. Nap (Holnapután)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] text-night-200/50 uppercase font-bold tracking-wider mb-1 block">Ikon</label>
                        <select
                          value={adminCard3Icon}
                          onChange={e => setAdminCard3Icon(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-white/10 bg-night-800 text-white text-xs font-bold focus:outline-none"
                        >
                          {Object.entries(WEATHER_ICONS).map(([key, item]) => (
                            <option key={key} value={key}>{item.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] text-night-200/50 uppercase font-bold tracking-wider mb-1 block">Leírás</label>
                        <input
                          type="text"
                          value={adminCard3Desc}
                          onChange={e => setAdminCard3Desc(e.target.value.slice(0, 30))}
                          placeholder="Pl.: Zápor, zivatar"
                          className="w-full px-2 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-white text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] text-night-200/50 uppercase font-bold tracking-wider mb-1 block">Min Hőm (°C)</label>
                        <input
                          type="number"
                          value={adminCard3TempMin}
                          onChange={e => setAdminCard3TempMin(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-white text-xs font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-night-200/50 uppercase font-bold tracking-wider mb-1 block">Max Hőm (°C)</label>
                        <input
                          type="number"
                          value={adminCard3TempMax}
                          onChange={e => setAdminCard3TempMax(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-white text-xs font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- SÜRGŐS ÉRTESÍTÉS --- */}
                <div className="space-y-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider">Sürgős Értesítés (Viharjelzés)</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-white">
                      <input
                        type="checkbox"
                        checked={adminAnnActive}
                        onChange={e => setAdminAnnActive(e.target.checked)}
                        className="rounded border-white/10 bg-white/[0.04] text-cyan2-500 focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <span>Aktív</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={adminAnnText}
                    onChange={e => setAdminAnnText(e.target.value.slice(0, 150))}
                    placeholder="Pl.: Viharjelzés! Erős széllökések várhatóak..."
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs font-semibold placeholder:text-night-200/35 focus:outline-none focus:ring-2 focus:ring-cyan2-400/50"
                  />
                </div>
              </div>

              {adminError && <p className="text-rose-300 text-xs font-extrabold text-center">{adminError}</p>}

              <button
                onClick={handleSaveForecast}
                disabled={savingAdmin}
                className="btn-grad w-full py-3.5 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {savingAdmin ? 'Mentés folyamatban...' : 'Jelentések Mentése és Publikálása'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
