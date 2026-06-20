import React from 'react';
import { Mountain, Info, Shield, Radio, ExternalLink, Mail, Award } from 'lucide-react';
import { FadeUp } from '../../components/AppleMotion';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* --- HERO / INTRODUCTION --- */}
      <FadeUp>
        <div className="bg-[#f9f5f1]/85 dark:bg-[#0c1726]/90 backdrop-blur-[45px] border border-[#e9d8c9]/60 dark:border-white/5 rounded-[2.5rem] p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#0bc9f8]/10 to-transparent rounded-full blur-2xl" />
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-[#123a57]/5 dark:bg-white/10 flex items-center justify-center border-2 border-[#b36022]/40 shrink-0 overflow-hidden shadow-lg">
              {/* Fallback initials styling, resembling a premium user card */}
              <span className="text-3xl font-black text-[#b36022] dark:text-[#e0a05c] tracking-tighter">RL</span>
            </div>
            
            <div className="space-y-3 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-black text-[#123a57] dark:text-white tracking-tight">
                Ráduly László
              </h2>
              <p className="text-xs font-black uppercase tracking-widest text-[#0a97be]">
                Kőszegi Időjárás Előrejelzés · Alapító & Operátor
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Több mint egy évtizede kísérem figyelemmel az Alpokalja és Kőszeg mikroklímájának alakulását. A célom a helyi lakosok és turisták pontos, naprakész és szakmailag megalapozott tájékoztatása a nap 24 órájában.
              </p>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* --- STATION EQUIPMENT DETAILS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Equipment Card */}
        <FadeUp delay={0.1}>
          <div className="bg-[#f9f5f1]/85 dark:bg-[#0c1726]/90 backdrop-blur-[45px] border border-[#e9d8c9]/60 dark:border-white/5 rounded-[2.5rem] p-6 shadow-xl h-full flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-lg font-black text-[#123a57] dark:text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#b36022]" />
                <span>Mérőállomás Technológia</span>
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                A méréseket egy professzionális, kalibrált **SmartMixin** (és hozzá kapcsolt Netatmo kiegészítő) szenzorrendszer végzi. Az adatok valós időben frissülnek és kerülnek feltöltésre a felhőbe.
              </p>
              <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-2 font-semibold">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0bc9f8]" /> Svájci precíziós hőmérő és páratartalom-mérő
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0bc9f8]" /> Nagy felbontású optikai esőmérő (csapadék intenzitás)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0bc9f8]" /> Ultrahangos szélirány- és szélsebesség-szenzorok
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0bc9f8]" /> Légnyomásmérő és levegősűrűség kalkulátorok
                </li>
              </ul>
            </div>
            <div className="text-[10px] font-black text-[#0a97be] uppercase tracking-wider mt-4">
              Állomás ID: 72461 · Magasság: 274m
            </div>
          </div>
        </FadeUp>

        {/* Station Philosophy Card */}
        <FadeUp delay={0.15}>
          <div className="bg-[#f9f5f1]/85 dark:bg-[#0c1726]/90 backdrop-blur-[45px] border border-[#e9d8c9]/60 dark:border-white/5 rounded-[2.5rem] p-6 shadow-xl h-full flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-lg font-black text-[#123a57] dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-[#b36022]" />
                <span>Közösségi Küldetés</span>
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Nemcsak az automatikus szenzoradatokat jelenítjük meg, hanem a Facebook oldalunkon rendszeresen közzétett, egyedi elemzéseket is nyomon követheted. Kőszeg és környékének időjárása az Alpok közelsége miatt rendkívül dinamikus, ami folyamatos emberi elemzést igényel.
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Köszönjük, hogy a mi méréseinket választod az utazásaid, túráid tervezéséhez és a mindennapi életed megszervezéséhez!
              </p>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <span className="text-[10px] font-black text-[#0a97be] uppercase tracking-wider">
                Alpokalja · Kőszegi-hegység
              </span>
            </div>
          </div>
        </FadeUp>

      </div>

      {/* --- CONTACT & MEDIA --- */}
      <FadeUp delay={0.2}>
        <div className="bg-[#f9f5f1]/85 dark:bg-[#0c1726]/90 backdrop-blur-[45px] border border-[#e9d8c9]/60 dark:border-white/5 rounded-[2.5rem] p-6 sm:p-8 shadow-xl text-center space-y-6">
          <h3 className="text-lg font-black text-[#123a57] dark:text-white">Lépj velünk kapcsolatba!</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
            Kövesd a közösségi oldalunkat a legfrissebb helyi előrejelzésekért és viharjelentésekért!
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="https://www.facebook.com/search/top?q=k%C5%91szegi%20id%C5%91j%C3%A1r%C3%A1s%20el%C5%91rejelz%C3%A9s" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#123a57] hover:bg-[#0a97be] text-white font-bold text-xs shadow-md shadow-[#123a57]/20 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto justify-center"
            >
              <span>Facebook Oldalunk</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            
            <a 
              href="mailto:koszegidojaras@gmail.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-white/5 border border-[#e9d8c9] dark:border-white/10 hover:bg-[#fcfaf7] text-[#123a57] dark:text-white font-bold text-xs transition-all hover:scale-105 active:scale-95 w-full sm:w-auto justify-center"
            >
              <Mail className="w-4 h-4" />
              <span>Kapcsolatfelvétel</span>
            </a>
          </div>
        </div>
      </FadeUp>

    </div>
  );
}
