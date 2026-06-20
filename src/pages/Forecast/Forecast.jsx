import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchForecastWeather } from '../../api/weather';
import { Calendar, CloudRain, ShieldAlert, ArrowRight, User, X } from 'lucide-react';
import { FadeUp } from '../../components/AppleMotion';

const LOCAL_REPORTS = [
  { id: 1, date: '2026-06-19', title: 'Helyzetjelentés: Lassú felmelegedés és záporok esélye', author: 'Ráduly László', content: 'A mai napon a kőszegi hegyek felől érkező hűvösebb légtömegek hatása fokozatosan gyengül. Lassú felmelegedésre számíthatunk, de a délutáni órákban a megnövekvő fátyolfelhőzetből lokális záporok alakulhatnak ki. A csapadék mennyisége várhatóan 1-3 mm között mozog majd.' },
  { id: 2, date: '2026-06-17', title: 'Zivatarveszély: Sárga figyelmeztetés a kőszegi kistérségben', author: 'Ráduly László', content: 'Az Alpokalja felett kialakuló instabil légtömegek miatt zivatarok alakulhatnak ki, amelyeket átmenetileg erős vagy viharos széllökések (akár 60-70 km/h) és jégeső is kísérhet. Figyeljünk a kerti bútorokra és a szabadban parkoló autókra!' },
  { id: 3, date: '2026-06-15', title: 'Heti áttekintés: Visszatér a nyári meleg, de érkezik a nedvesség', author: 'Ráduly László', content: 'A hét első felében anticiklonális hatások alakítják időjárásunkat, sok napsütéssel. Csütörtöktől azonban egy markánsabb frontrendszer közelíti meg térségünket, felerősítve a gomolyfelhő-képződést. A hétvége melegnek, de fülledtnek ígérkezik.' }
];

export default function Forecast() {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchForecastWeather()
      .then((data) => { setForecast(data); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  }, []);

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('hu-HU', { weekday: 'long', month: 'long', day: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* --- 7-DAY FORECAST --- */}
        <div className="lg:col-span-2">
          <FadeUp>
            <div className="glass-card rounded-[2rem] p-5 sm:p-6">
              <h2 className="text-lg font-extrabold text-white mb-5 flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-white"><Calendar className="w-5 h-5" /></span>
                <span>7 Napos Előrejelzés</span>
              </h2>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-9 h-9 rounded-full border-[3px] border-cyan2-400 border-t-transparent animate-spin mb-4" />
                  <p className="text-xs font-bold text-night-200/55 uppercase tracking-widest">Előrejelzés betöltése...</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {forecast.map((day, idx) => (
                    <div key={day.date} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 active:scale-[0.99] transition-all gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-cyan2-400/10 flex items-center justify-center shrink-0">
                          <img src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`} alt={day.description} className="w-10 h-10 object-contain" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-white capitalize truncate">{idx === 0 ? 'Ma' : formatDate(day.date)}</p>
                          <p className="text-xs text-night-200/55 capitalize truncate">{day.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {day.precipitation > 0 && (
                          <div className="hidden sm:flex items-center gap-1 text-cyan2-200 text-xs font-bold bg-cyan2-400/10 px-2.5 py-1 rounded-full">
                            <CloudRain className="w-3.5 h-3.5" />
                            <span>{day.precipitation.toFixed(1)} mm</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-right">
                          <span className="text-xs text-night-200/45 font-bold">{Math.round(day.temp_min)}°</span>
                          <div className="w-14 h-1.5 rounded-full bg-white/10 relative overflow-hidden hidden sm:block">
                            <div className="absolute top-0 bottom-0 rounded-full bg-brand-gradient" style={{ left: '20%', right: '15%' }} />
                          </div>
                          <span className="text-base font-extrabold text-white">{Math.round(day.temp_max)}°</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FadeUp>
        </div>

        {/* --- LOCAL REPORTS --- */}
        <div>
          <FadeUp delay={0.1}>
            <div className="glass-card rounded-[2rem] p-5 sm:p-6">
              <h2 className="text-lg font-extrabold text-white mb-5 flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-white"><ShieldAlert className="w-5 h-5" /></span>
                <span>Helyi Jelentések</span>
              </h2>
              <div className="space-y-2.5">
                {LOCAL_REPORTS.map((report) => (
                  <button key={report.id} onClick={() => setSelectedReport(report)}
                    className="w-full text-left p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-cyan2-400/30 active:scale-[0.99] transition-all group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase text-cyan2-200/80 tracking-widest">{report.date}</span>
                      <span className="flex items-center gap-1 text-[9px] font-bold text-night-200/45"><User className="w-3 h-3" /> Laci</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-white leading-snug mb-2">{report.title}</h3>
                    <p className="text-[11px] text-night-200/60 line-clamp-3 leading-relaxed">{report.content}</p>
                    <div className="flex items-center gap-1 text-[10px] font-extrabold text-cyan2-200 mt-3 group-hover:translate-x-1 transition-transform">
                      <span>Részletek</span><ArrowRight className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </div>

      {/* --- REPORT MODAL --- */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedReport(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative w-full max-w-lg bg-night-800 rounded-[2rem] border border-white/10 shadow-2xl p-6 overflow-hidden z-10">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand-gradient" />
              <div className="flex items-center justify-between mb-4 mt-1">
                <span className="text-xs font-extrabold text-cyan2-200/80 tracking-widest uppercase">{selectedReport.date}</span>
                <button onClick={() => setSelectedReport(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-extrabold text-white mb-3">{selectedReport.title}</h3>
              <p className="text-xs text-night-200/55 font-bold mb-4 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-brand-gradient flex items-center justify-center text-white"><User className="w-3 h-3" /></span>
                Készítette: {selectedReport.author}
              </p>
              <div className="h-px bg-white/10 my-4" />
              <p className="text-sm text-night-100/85 leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-line">{selectedReport.content}</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
