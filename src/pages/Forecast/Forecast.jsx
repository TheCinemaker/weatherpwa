import React, { useState, useEffect } from 'react';
import { fetchForecastWeather } from '../../api/weather';
import { Calendar, CloudRain, ShieldAlert, FileText, ArrowRight, User } from 'lucide-react';
import { FadeUp } from '../../components/AppleMotion';

// Local simulated reports written by Ráduly László
const LOCAL_REPORTS = [
  {
    id: 1,
    date: '2026-06-19',
    title: 'Helyzetjelentés: Lassú felmelegedés és záporok esélye',
    author: 'Ráduly László',
    content: 'A mai napon a kőszegi hegyek felől érkező hűvösebb légtömegek hatása fokozatosan gyengül. Lassú felmelegedésre számíthatunk, de a délutáni órákban a megnövekvő fátyolfelhőzetből lokális záporok alakulhatnak ki. A csapadék mennyisége várhatóan 1-3 mm között mozog majd.',
  },
  {
    id: 2,
    date: '2026-06-17',
    title: 'Zivatarveszély: Sárga figyelmeztetés a kőszegi kistérségben',
    author: 'Ráduly László',
    content: 'Az Alpokalja felett kialakuló instabil légtömegek miatt zivatarok alakulhatnak ki, amelyeket átmenetileg erős vagy viharos széllökések (akár 60-70 km/h) és jégeső is kísérhet. Figyeljünk a kerti bútorokra és a szabadban parkoló autókra!',
  },
  {
    id: 3,
    date: '2026-06-15',
    title: 'Heti áttekintés: Visszatér a nyári meleg, de érkezik a nedvesség',
    author: 'Ráduly László',
    content: 'A hét első felében anticiklonális hatások alakítják időjárásunkat, sok napsütéssel. Csütörtöktől azonban egy markánsabb frontrendszer közelíti meg térségünket, felerősítve a gomolyfelhő-képződést. A hétvége melegnek, de fülledtnek ígérkezik.',
  }
];

export default function Forecast() {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchForecastWeather()
      .then((data) => {
        setForecast(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateStr) => {
    try {
      const options = { weekday: 'long', month: 'long', day: 'numeric' };
      const d = new Date(dateStr);
      return d.toLocaleDateString('hu-HU', options);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT 2 COLS: 7-DAY FORECAST --- */}
        <div className="lg:col-span-2 space-y-6">
          <FadeUp>
            <div className="bg-[#f9f5f1]/85 dark:bg-[#0c1726]/90 backdrop-blur-[45px] border border-[#e9d8c9]/60 dark:border-white/5 rounded-[2.5rem] p-6 sm:p-8 shadow-xl">
              <h2 className="text-xl font-black text-[#123a57] dark:text-white mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#b36022] dark:text-[#e0a05c]" />
                <span>7 Napos Előrejelzés</span>
              </h2>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-[#0a97be] border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Előrejelzés betöltése...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {forecast.map((day, idx) => (
                    <div 
                      key={day.date}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-beige-50/70 dark:bg-white/5 border border-[#e9d8c9]/40 dark:border-white/10 hover:shadow-md transition-all gap-4"
                    >
                      <div className="flex items-center gap-4">
                        {/* Day Icon */}
                        <div className="w-12 h-12 rounded-xl bg-[#123a57]/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                          <img 
                            src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`} 
                            alt={day.description} 
                            className="w-10 h-10 object-contain"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#123a57] dark:text-white capitalize">
                            {idx === 0 ? 'Ma' : formatDate(day.date)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {day.description}
                          </p>
                        </div>
                      </div>

                      {/* Temperature bar & precipitation */}
                      <div className="flex items-center gap-6 sm:justify-end">
                        {day.precipitation > 0 && (
                          <div className="flex items-center gap-1 text-[#0bc9f8] text-xs font-bold bg-[#0bc9f8]/10 px-2 py-1 rounded-lg">
                            <CloudRain className="w-3.5 h-3.5" />
                            <span>{day.precipitation.toFixed(1)} mm</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-right">
                          <span className="text-xs text-gray-400 font-bold">{Math.round(day.temp_min)}°</span>
                          
                          {/* Visual slider track */}
                          <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 relative overflow-hidden hidden sm:block">
                            <div 
                              className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-[#0bc9f8] to-[#d68743]"
                              style={{ left: '20%', right: '15%' }}
                            />
                          </div>

                          <span className="text-sm font-black text-[#123a57] dark:text-white">{Math.round(day.temp_max)}°C</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FadeUp>
        </div>

        {/* --- RIGHT COL: LACI'S LOCAL REPORTS --- */}
        <div className="space-y-6">
          <FadeUp delay={0.15}>
            <div className="bg-[#f9f5f1]/85 dark:bg-[#0c1726]/90 backdrop-blur-[45px] border border-[#e9d8c9]/60 dark:border-white/5 rounded-[2.5rem] p-6 sm:p-8 shadow-xl">
              <h2 className="text-xl font-black text-[#123a57] dark:text-white mb-6 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#b36022] dark:text-[#e0a05c]" />
                <span>Helyi Jelentések</span>
              </h2>

              <div className="space-y-4">
                {LOCAL_REPORTS.map((report) => (
                  <div 
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className="p-4 rounded-2xl bg-beige-50/70 dark:bg-white/5 border border-[#e9d8c9]/40 dark:border-white/10 hover:border-[#b36022] dark:hover:border-[#e0a05c] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase text-[#0a97be] tracking-widest">{report.date}</span>
                      <span className="flex items-center gap-1 text-[9px] font-bold text-gray-500"><User className="w-3 h-3"/> Laci</span>
                    </div>
                    <h3 className="text-xs font-black text-[#123a57] dark:text-white leading-snug group-hover:text-[#b36022] dark:group-hover:text-[#e0a05c] transition-colors mb-2">
                      {report.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                      {report.content}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] font-black text-[#b36022] dark:text-[#e0a05c] mt-3 group-hover:translate-x-1 transition-transform">
                      <span>Részletek</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>

      </div>

      {/* --- REPORT VIEW MODAL --- */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0a1626]/60 backdrop-blur-md" onClick={() => setSelectedReport(null)} />
          <div className="relative w-full max-w-lg bg-beige-50 dark:bg-[#0c1726] rounded-[2rem] border border-[#e9d8c9]/70 dark:border-white/10 shadow-2xl p-6 overflow-hidden z-10">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#b36022]" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-[#0a97be] tracking-widest uppercase">{selectedReport.date}</span>
              <button 
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 rounded-full bg-[#123a57]/5 hover:bg-[#123a57]/10 dark:bg-white/10 dark:hover:bg-white/20 text-[#123a57] dark:text-white flex items-center justify-center transition-all active:scale-95"
              >
                ✕
              </button>
            </div>
            <h3 className="text-lg font-black text-[#123a57] dark:text-white mb-3">
              {selectedReport.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-4 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#123a57]/10 flex items-center justify-center text-xs text-[#123a57] dark:text-white"><User className="w-3 h-3" /></span>
              Készítette: {selectedReport.author} (Kőszegi Időjárás Előrejelzés)
            </p>
            <div className="h-px bg-[#e9d8c9]/70 dark:bg-white/10 my-4" />
            <p className="text-sm text-[#123a57]/80 dark:text-gray-300 leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-line">
              {selectedReport.content}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
