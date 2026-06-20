import React from 'react';
import { Radio, ExternalLink, Mail, Award } from 'lucide-react';
import { FadeUp } from '../../components/AppleMotion';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 space-y-5">

      {/* --- HERO / INTRO --- */}
      <FadeUp>
        <div className="relative overflow-hidden rounded-[2rem] glass-card p-6 sm:p-8">
          <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-cyan2-500/15 blur-3xl" />
          <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
            <div className="w-24 h-24 rounded-full bg-brand-gradient flex items-center justify-center shrink-0 shadow-glow">
              <span className="text-3xl font-extrabold text-white tracking-tighter">RL</span>
            </div>
            <div className="space-y-2.5 text-center sm:text-left">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Ráduly László</h2>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-cyan2-200/80">
                Kőszegi Időjárás Előrejelzés · Alapító & Operátor
              </p>
              <p className="text-sm text-night-200/75 leading-relaxed">
                Több mint egy évtizede kísérem figyelemmel az Alpokalja és Kőszeg mikroklímájának alakulását. A célom a helyi lakosok és turisták pontos, naprakész és szakmailag megalapozott tájékoztatása a nap 24 órájában.
              </p>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* --- STATION DETAILS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FadeUp delay={0.08}>
          <div className="glass-card rounded-[2rem] p-6 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-white"><Radio className="w-5 h-5" /></span>
                <span>Mérőállomás Technológia</span>
              </h3>
              <p className="text-xs text-night-200/70 leading-relaxed">
                A méréseket egy professzionális, kalibrált <strong className="text-white">SmartMixin</strong> (és hozzá kapcsolt Netatmo kiegészítő) szenzorrendszer végzi. Az adatok valós időben frissülnek és kerülnek feltöltésre a felhőbe.
              </p>
              <ul className="text-xs text-night-200/70 space-y-2 font-semibold">
                {[
                  'Svájci precíziós hőmérő és páratartalom-mérő',
                  'Nagy felbontású optikai esőmérő (csapadék intenzitás)',
                  'Ultrahangos szélirány- és szélsebesség-szenzorok',
                  'Légnyomásmérő és levegősűrűség kalkulátorok',
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-brand-gradient shrink-0" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-[10px] font-extrabold text-cyan2-200/80 uppercase tracking-wider mt-5">
              Állomás ID: 72461 · Magasság: 274m
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.12}>
          <div className="glass-card rounded-[2rem] p-6 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-white"><Award className="w-5 h-5" /></span>
                <span>Közösségi Küldetés</span>
              </h3>
              <p className="text-xs text-night-200/70 leading-relaxed">
                Nemcsak az automatikus szenzoradatokat jelenítjük meg, hanem a Facebook oldalunkon rendszeresen közzétett, egyedi elemzéseket is nyomon követheted. Kőszeg és környékének időjárása az Alpok közelsége miatt rendkívül dinamikus, ami folyamatos emberi elemzést igényel.
              </p>
              <p className="text-xs text-night-200/70 leading-relaxed">
                Köszönjük, hogy a mi méréseinket választod az utazásaid, túráid tervezéséhez és a mindennapi életed megszervezéséhez!
              </p>
            </div>
            <div className="text-[10px] font-extrabold text-cyan2-200/80 uppercase tracking-wider mt-5">
              Alpokalja · Kőszegi-hegység
            </div>
          </div>
        </FadeUp>
      </div>

      {/* --- CONTACT --- */}
      <FadeUp delay={0.16}>
        <div className="glass-card rounded-[2rem] p-6 sm:p-8 text-center space-y-5">
          <h3 className="text-base font-extrabold text-white">Lépj velünk kapcsolatba! 👋</h3>
          <p className="text-xs text-night-200/60 max-w-lg mx-auto leading-relaxed">
            Kövesd a közösségi oldalunkat a legfrissebb helyi előrejelzésekért és viharjelentésekért!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="https://www.facebook.com/search/top?q=k%C5%91szegi%20id%C5%91j%C3%A1r%C3%A1s%20el%C5%91rejelz%C3%A9s"
              target="_blank" rel="noopener noreferrer" className="btn-grad px-6 py-3 text-xs w-full sm:w-auto">
              <span>Facebook Oldalunk</span><ExternalLink className="w-4 h-4" />
            </a>
            <a href="mailto:koszegidojaras@gmail.com"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all active:scale-95 w-full sm:w-auto">
              <Mail className="w-4 h-4" /><span>Kapcsolatfelvétel</span>
            </a>
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
