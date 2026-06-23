import React, { useState } from 'react';
import { Radio, ExternalLink, Mail, Award, Heart, Copy, Check } from 'lucide-react';
import { FadeUp } from '../../components/AppleMotion';

const BANK_ACCOUNT = '12600016-11886145-76225958';
const WISE_HANDLE = '@laszlor374';

export default function About() {
  const [copied, setCopied] = useState(null); // 'bank' | 'wise' | null

  const handleCopy = async (value, key) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(c => (c === key ? null : c)), 2000);
    } catch {
      /* a vágólap nem mindig elérhető – ilyenkor a felhasználó kézzel másolhat */
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-5">

      {/* --- HERO / INTRO --- */}
      <FadeUp>
        <div className="relative overflow-hidden rounded-apple-outer glass-card p-6 sm:p-8">
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
          <div className="glass-card rounded-apple-outer p-6 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-apple-inner bg-brand-gradient flex items-center justify-center text-white"><Radio className="w-5 h-5" /></span>
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
          <div className="glass-card rounded-apple-outer p-6 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-apple-inner bg-brand-gradient flex items-center justify-center text-white"><Award className="w-5 h-5" /></span>
                <span>Közösségi Küldetés</span>
              </h3>
              <p className="text-xs text-night-200/70 leading-relaxed">
                Nemcsak az automatikus szenzoradatokat jelenítem meg, hanem a Facebook oldalamon rendszeresen közzétett, egyedi elemzéseimet is nyomon követheted. Kőszeg és környékének időjárása az Alpok közelsége miatt rendkívül dinamikus, ami folyamatos egyéni elemzést igényel.
              </p>
              <p className="text-xs text-night-200/70 leading-relaxed">
                Köszönöm, hogy az én méréseimet választod az utazásaid, túráid tervezéséhez és a mindennapi életed megszervezéséhez!
              </p>
            </div>
            <div className="text-[10px] font-extrabold text-cyan2-200/80 uppercase tracking-wider mt-5">
              Alpokalja · Kőszegi-hegység
            </div>
          </div>
        </FadeUp>
      </div>

      {/* --- TÁMOGATÁS --- */}
      <FadeUp delay={0.16}>
        <div className="relative overflow-hidden glass-card rounded-apple-outer p-6 sm:p-8 space-y-5">
          <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-1.5 text-center sm:text-left">
            <h3 className="text-base font-extrabold text-white flex items-center justify-center sm:justify-start gap-2.5">
              <span className="w-9 h-9 rounded-apple-inner bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-glow">
                <Heart className="w-5 h-5" />
              </span>
              <span>Az oldal támogatása</span>
            </h3>
            <p className="text-xs text-night-200/70 leading-relaxed max-w-xl">
              Az állomás üzemeltetése és fejlesztése folyamatos költséggel jár. Ha hasznosnak találod az oldalt, támogatásodat hálásan köszönöm! Kérlek, a közleménybe írd be: <strong className="text-white">támogatás</strong>.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Bankszámlaszám */}
            <div className="rounded-apple-card bg-white/[0.04] border border-white/10 p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-night-200/55 uppercase tracking-widest mb-1">Bankszámlaszám</div>
                <div className="text-sm font-extrabold text-white tracking-wide break-all">{BANK_ACCOUNT}</div>
              </div>
              <button
                onClick={() => handleCopy(BANK_ACCOUNT, 'bank')}
                className="shrink-0 w-9 h-9 rounded-apple-inner bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95"
                title="Számlaszám másolása"
                aria-label="Számlaszám másolása"
              >
                {copied === 'bank' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Wise */}
            <div className="rounded-apple-card bg-white/[0.04] border border-white/10 p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-night-200/55 uppercase tracking-widest mb-1">Wise</div>
                <div className="text-sm font-extrabold text-white tracking-wide break-all">{WISE_HANDLE}</div>
              </div>
              <button
                onClick={() => handleCopy(WISE_HANDLE, 'wise')}
                className="shrink-0 w-9 h-9 rounded-apple-inner bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95"
                title="Wise azonosító másolása"
                aria-label="Wise azonosító másolása"
              >
                {copied === 'wise' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {copied && (
            <p className="relative z-10 text-[11px] font-bold text-emerald-300 text-center sm:text-left">
              Vágólapra másolva!
            </p>
          )}
        </div>
      </FadeUp>

      {/* --- CONTACT --- */}
      <FadeUp delay={0.2}>
        <div className="glass-card rounded-apple-outer p-6 sm:p-8 text-center space-y-5">
          <h3 className="text-base font-extrabold text-white">Lépj velem kapcsolatba!</h3>
          <p className="text-xs text-night-200/60 max-w-lg mx-auto leading-relaxed">
            Kövesd a közösségi oldalamat a legfrissebb helyi előrejelzésekért és viharjelentésekért!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="https://www.facebook.com/idojaraskoszeg.hu"
              target="_blank" rel="noopener noreferrer" className="btn-grad px-6 py-3 text-xs w-full sm:w-auto">
              <span>Facebook Oldalam</span><ExternalLink className="w-4 h-4" />
            </a>
            <a href="mailto:idojaraskoszeg@gmail.com"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-apple-inner bg-white/10 border border-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all active:scale-95 w-full sm:w-auto">
              <Mail className="w-4 h-4" /><span>Kapcsolatfelvétel</span>
            </a>
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
