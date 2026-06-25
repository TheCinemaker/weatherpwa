import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, ExternalLink, ShieldAlert, X, Baby, Users, BookOpen, AlertTriangle, Droplet } from 'lucide-react';

// Kőszeg koordinátái
const LAT = 47.3971;
const LON = 16.546;

// Open-Meteo: ingyenes, kulcs nélküli, CORS-barát. Aktuális UV + napi maximum.
const OPEN_METEO_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
  `&current=uv_index&daily=uv_index_max&timezone=Europe%2FBudapest`;

// Hivatalos UV-előrejelzés (HungaroMet) — referencia link.
const METHU_URL = 'https://www.met.hu/idojaras/humanmeteorologia/uv-b/figyelmeztetes/';

// WHO szerinti UV-index szintek + szín + tanács
function uvLevel(uv) {
  if (uv == null || isNaN(uv)) return null;
  if (uv < 3)  return { label: 'Alacsony',      color: '#34d399', advice: 'Nincs szükség különösebb védelemre.' };
  if (uv < 6)  return { label: 'Mérsékelt',     color: '#fbbf24', advice: 'Délben napszemüveg és fényvédő ajánlott.' };
  if (uv < 8)  return { label: 'Magas',         color: '#fb923c', advice: 'Naptej (SPF 30+), kalap, árnyék 11–15 óra között.' };
  if (uv < 11) return { label: 'Nagyon magas',  color: '#f43f5e', advice: 'Erős védelem kell; kerüld a déli napsütést.' };
  return                { label: 'Extrém',        color: '#a855f7', advice: 'Kerüld a szabadban tartózkodást a déli órákban!' };
}

// Dinamikus ajánló az aktuális/napi maximum UV-érték alapján
function getDynamicAdvice(uv) {
  if (uv == null || isNaN(uv)) return null;
  if (uv < 3) {
    return {
      alertClass: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      title: 'Mai tipp alacsony UV sugárzásnál',
      items: [
        'Bár a leégés veszélye minimális, a kora reggeli és esti hűvösebb kőszegi levegő miatt érdemes rétegesen öltözni.',
        'Ne feledkezz meg a napi 2-2,5 literes alapvető vízfogyasztásról a jó közérzet és az anyagcsere fenntartásához.'
      ]
    };
  }
  if (uv < 6) {
    return {
      alertClass: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
      iconBg: 'bg-amber-500/10 text-amber-400',
      title: 'Mai tipp mérsékelt UV sugárzásnál',
      items: [
        'Igyál legalább 2-3 dl tiszta vizet óránként. Kerüld a túl hideg, cukros vagy alkoholos italokat a közvetlen napfényben.',
        'Soha ne ugorj felhevült testtel a hideg vízbe (pl. medencébe vagy a patakba)! Előbb zuhanyozz le vagy mosakodj meg a vízzel, hogy elkerüld a hirtelen keringési sokkot és szívreflexet.',
        'Ha több órát töltesz a szabadban, használj legalább SPF 15-30-as fényvédő krémet az érzékenyebb testrészeken.'
      ]
    };
  }
  if (uv < 8) {
    return {
      alertClass: 'border-orange-500/20 bg-orange-500/5 text-orange-400',
      iconBg: 'bg-orange-500/10 text-orange-400',
      title: 'Mai riasztás magas UV sugárzásnál',
      items: [
        '11:00 és 15:00 óra között kerüld a tűző napot, húzódj árnyékba. Védelem nélkül az érzékeny bőr akár 15-20 perc alatt leéghet!',
        'Fokozottan figyelj a hidratálásra: fogyassz napi 2,5-3 liter szénsavmentes vizet. Mindig tarts magadnál kulacsot!',
        'Szigorúan tilos felhevült testtel hirtelen a hideg vízbe ugrani! A hirtelen hőmérséklet-különbség reflexes szívbénulást válthat ki. Mindig fokozatosan hűtsd le magad, mielőtt a vízbe mész.',
        'Viselj könnyű, de vállakat és karokat fedő világos ruhát, széles karimájú szalmakalapot és minőségi UV-szűrős napszemüveget.'
      ]
    };
  }
  return {
    alertClass: 'border-rose-500/25 bg-rose-500/5 text-rose-400',
    iconBg: 'bg-rose-500/10 text-rose-400',
    title: 'Vészjelzés rendkívüli / extrém UV sugárzásnál',
    items: [
      'Szigorúan kerüld a közvetlen napsugárzást 11 és 15 óra között! A fedetlen bőr percek alatt leéghet és súlyosan károsodhat.',
      'Kötelező az SPF 50+ naptej, a fejfedő és az UV400-as napszemüveg használata a szabadban.',
      'Igyál folyamatosan szénsavmentes ásványvizet vagy izotóniás italokat a kiizzadt sók pótlására. Kerüld a koffeint és az alkoholt!',
      'Életveszélyes lehet a felhevült testtel jéghideg vízbe ugrás. Először mindig hűtsd le magad az árnyékban vagy zuhanyzóval!',
      'Csecsemőket, kisgyermekeket és háziállatokat egyáltalán ne engedj a napra ebben az időszakban!'
    ]
  };
}

const shakeVariants = {
  shake: {
    rotate: [0, -12, 12, -12, 12, -6, 6, -3, 3, 0],
    scale: [1, 1.1, 1.1, 1.1, 1.1, 1, 1, 1, 1, 1],
    transition: {
      duration: 0.8,
      ease: "easeInOut"
    }
  },
  idle: {
    rotate: 0,
    scale: 1
  }
};

export default function UvCard() {
  const [uv, setUv] = useState(null);
  const [uvMax, setUvMax] = useState(null);
  const [state, setState] = useState('loading'); // 'loading' | 'ok' | 'error'
  const [showModal, setShowModal] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(OPEN_METEO_URL);
        if (!res.ok) throw new Error('Open-Meteo HTTP ' + res.status);
        const data = await res.json();
        if (!alive) return;
        setUv(data?.current?.uv_index ?? null);
        setUvMax(data?.daily?.uv_index_max?.[0] ?? null);
        setState('ok');
      } catch (err) {
        console.error('UV index lekérés hiba:', err);
        if (alive) setState('error');
      }
    })();
    return () => { alive = false; };
  }, []);

  // Easter egg: az ikon rázása időnként a figyelem felkeltésére (5-10 mp-enként véletlenszerűen)
  useEffect(() => {
    if (state !== 'ok') return;
    
    let timerId;
    
    const scheduleNextShake = () => {
      const delay = Math.floor(Math.random() * 5000) + 5000; // 5000 - 10000 ms
      
      timerId = setTimeout(() => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 800);
        scheduleNextShake();
      }, delay);
    };

    scheduleNextShake();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [state]);

  // Esc gombra bezáródó modális ablak + háttér görgetés letiltása
  useEffect(() => {
    if (!showModal) return;
    const onKey = (e) => e.key === 'Escape' && setShowModal(false);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [showModal]);

  const lvl = uvLevel(uv);
  const fillPct = uv != null ? Math.max(4, Math.min(100, (uv / 11) * 100)) : 0;
  const dynamicAdvice = getDynamicAdvice(uvMax ?? uv);

  return (
    <>
      <div 
        onClick={() => state === 'ok' && setShowModal(true)}
        className={`glass-card rounded-apple-outer p-5 overflow-hidden relative transition-all duration-300 ${
          state === 'ok' ? 'cursor-pointer hover:bg-white/[0.05] active:scale-[0.995]' : ''
        }`}
      >
        {/* lágy színes fény az aktuális szint alapján */}
        {lvl && (
          <div
            className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: lvl.color }}
          />
        )}

        <div className="relative flex items-start gap-4">
          <motion.div
            variants={shakeVariants}
            animate={isShaking ? "shake" : "idle"}
            className="w-12 h-12 rounded-apple-inner flex items-center justify-center text-white shadow-sm shrink-0 cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${lvl?.color || '#22d3ee'}, #f97316)` }}
          >
            <Sun className="w-6 h-6 animate-pulse" />
          </motion.div>

          <div className="min-w-0 flex-1 text-left">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-0.5 flex items-center gap-1.5">
              <span>UV-index · Kőszeg</span>
              {state === 'ok' && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan2-400 animate-ping inline-block" title="Kattints a részletekért" />
              )}
            </div>

            {state === 'loading' && (
              <div className="flex items-center gap-2 py-1.5">
                <div className="w-4 h-4 rounded-full border-2 border-cyan2-400 border-t-transparent animate-spin" />
                <span className="text-xs font-semibold text-white/60">Betöltés…</span>
              </div>
            )}

            {state === 'error' && (
              <div className="flex items-center gap-2 py-1.5 text-amber-300">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold">Az UV-adat most nem elérhető.</span>
              </div>
            )}

            {state === 'ok' && lvl && (
              <>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-extrabold text-white tracking-tight leading-none">
                    {uv.toFixed(1)}
                  </span>
                  <span
                    className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: `${lvl.color}22`, color: lvl.color }}
                  >
                    {lvl.label}
                  </span>
                  {uvMax != null && (
                    <span className="text-[11px] font-semibold text-white/55">
                      Napi csúcs: <strong className="text-white/80">{uvMax.toFixed(0)}</strong>
                    </span>
                  )}
                </div>

                {/* szín-kódolt szintsáv */}
                <div className="meter-track mt-2.5">
                  <div className="meter-fill" style={{ width: `${fillPct}%`, background: lvl.color }} />
                </div>

                <p className="text-[11px] text-white/65 leading-relaxed mt-2">{lvl.advice}</p>
              </>
            )}
          </div>
        </div>

        {/* forrás + hivatalos referencia */}
        <div className="relative mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
          <span className="text-[9px] font-semibold text-white/40 uppercase tracking-wider">
            Forrás: Open-Meteo · modellezett
          </span>
          <a
            href={METHU_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan2-200/80 hover:text-cyan2-200 transition-colors shrink-0"
          >
            Hivatalos: HungaroMet
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Titkos UV kisokos Modal - Portallal a body alá vetítve, z-index stacking context hiba ellen */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showModal && lvl && (
            <motion.div
              key="uv-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
              transition={{ duration: 0.18 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.94, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
                transition={{ type: 'spring', stiffness: 460, damping: 36, mass: 0.7 }}
                className="relative w-full max-w-lg bg-night-800 rounded-apple-outer border border-white/10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
              >
                {/* Színes akcentus sáv a tetején az aktuális UV szint színével */}
                <div className="h-2 w-full shrink-0" style={{ background: `linear-gradient(90deg, ${lvl.color}, #f97316)` }} />

                {/* Fejléc */}
                <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-apple-inner bg-amber-500/10 flex items-center justify-center text-amber-400">
                      <Sun className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">UV-index Kisokos</h3>
                      <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Kőszegi szint: {uv?.toFixed(1) || '0.0'} ({lvl.label})</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tartalom */}
                <div className="p-5 overflow-y-auto space-y-4 text-left leading-relaxed max-h-[calc(85vh-120px)]">
                  
                  {/* DYNAMIC RECOMMENDATION SECTION BASED ON CURRENT UV */}
                  {dynamicAdvice && (
                    <div className={`border p-4 rounded-apple-card space-y-2.5 ${dynamicAdvice.alertClass}`}>
                      <h4 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Droplet className="w-3.5 h-3.5" /> {dynamicAdvice.title}
                      </h4>
                      <ul className="text-xs text-white/85 list-disc list-inside space-y-2">
                        {dynamicAdvice.items.map((item, idx) => (
                          <li key={idx} className="leading-relaxed pl-1 -indent-4 ml-4">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Mi az az UV index? */}
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-apple-card space-y-2">
                    <h4 className="text-[11px] font-black text-cyan2-300 uppercase tracking-widest flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Mi az az UV-index?
                    </h4>
                    <p className="text-xs text-white/80">
                      A Napból érkező ultraibolya sugárzás erősségét jelző nemzetközi mérőszám. Minél magasabb az érték, annál gyorsabban károsodik és ég le a fedetlen bőr. A skála 0-tól indul és általában 11-ig terjed, de extrém esetekben ennél magasabb is lehet.
                    </p>
                  </div>

                  {/* Korosztályos útmutató */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-black text-cyan2-300 uppercase tracking-widest flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Fényvédelem korosztályok szerint
                    </h4>

                    {/* Csecsemők és babák */}
                    <div className="flex gap-3 bg-white/[0.02] border border-white/5 p-3.5 rounded-apple-card">
                      <div className="w-8 h-8 rounded-apple-inner bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
                        <Baby className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-white">Csecsemők és babák (0–2 év)</h5>
                        <p className="text-xs text-white/70">
                          Bőrük még rendkívül vékony és fejletlen, kevés védelmező melanint termel.
                        </p>
                        <p className="text-[11px] font-bold text-rose-300 leading-normal">
                          ⚠️ Közvetlen napfény egyáltalán nem érheti őket! 6 hónapos kor alatt a naptej sem ajánlott (a vegyi anyagok felszívódása miatt) – helyette szellős pamutruha, kalap, babakocsi-árnyékoló és sűrű árnyék javasolt.
                        </p>
                      </div>
                    </div>

                    {/* Gyermekek */}
                    <div className="flex gap-3 bg-white/[0.02] border border-white/5 p-3.5 rounded-apple-card">
                      <div className="w-8 h-8 rounded-apple-inner bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                        <Baby className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-white">Gyermekek (2–12 év)</h5>
                        <p className="text-xs text-white/70">
                          Bőrük fokozottan érzékeny. A gyermekkori ismétlődő leégések bizonyítottan többszörösére növelik a felnőttkori bőrrák (melanoma) kockázatát.
                        </p>
                        <p className="text-[11px] font-bold text-amber-300 leading-normal">
                          💡 11 és 15 óra között szigorúan árnyékban! Vízálló, kifejezetten gyermekeknek szánt SPF 50+ naptej, sapka és UV400-as napszemüveg használata kötelező.
                        </p>
                      </div>
                    </div>

                    {/* Fiatalok és felnőttek */}
                    <div className="flex gap-3 bg-white/[0.02] border border-white/5 p-3.5 rounded-apple-card">
                      <div className="w-8 h-8 rounded-apple-inner bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-white">Fiatalok és Felnőttek (12–50 év)</h5>
                        <p className="text-xs text-white/70">
                          Gyakori a tévhitek miatti leégés (pl. „felhős időben nem lehet leégni” vagy „a szél miatt nem fog a nap”).
                        </p>
                        <p className="text-[11px] font-bold text-emerald-300 leading-normal">
                          ☀️ SPF 30+ fényvédő használata javasolt a szabadban. Ne feledd: magas (6+) UV-indexnél az érzékeny bőr akár 15-20 perc alatt is leéghet!
                        </p>
                      </div>
                    </div>

                    {/* Idősek */}
                    <div className="flex gap-3 bg-white/[0.02] border border-white/5 p-3.5 rounded-apple-card">
                      <div className="w-8 h-8 rounded-apple-inner bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-white">Középkorúak és Idősek (50+ év)</h5>
                        <p className="text-xs text-white/70">
                          A bőr sejtregenerációs képessége lassul. A bőr „emlékszik”: az életünk során felhalmozódott napfény-terhelés ilyenkor mutatkozik meg ráncok, pigmentfoltok és rosszindulatú elváltozások formájában.
                        </p>
                        <p className="text-[11px] font-bold text-purple-300 leading-normal">
                          🔍 Rendszeres önvizsgálat és évenkénti bőrgyógyászati szűrés javasolt. Kinti munkához vagy sétához hordj szellős, de karokat/vállat fedő ruházatot és kalapot.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hasznos tippek */}
                  <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-apple-card space-y-2">
                    <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Érdekességek és tévhitek
                    </h4>
                    <ul className="text-xs text-white/80 list-disc list-inside space-y-2 leading-relaxed">
                      <li>
                        <strong className="text-white">A felhők csapdája:</strong> A vvény, fátyolos felhőzet az UV-sugárzás akár 80%-át is átengedi, ráadásul a felhők szélei visszaverik és fel is erősíthetik a sugarakat.
                      </li>
                      <li>
                        <strong className="text-white">Ablaküveg mögött:</strong> A lakás és az autó ablaküvege kiszűri a leégésért felelős UV-B sugarakat, de az idő előtti bőröregedést okozó UV-A sugarakat átengedi!
                      </li>
                      <li>
                        <strong className="text-white">Vízpart és homok:</strong> A homok és a vízfelszín visszaveri a sugárzást (akár 20-50%-kal felerősítve azt), ezért a vízben úszva vagy árnyékos napernyő alatt is le lehet égni.
                      </li>
                    </ul>
                  </div>

                </div>

                {/* Lábléc */}
                <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center shrink-0">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-apple-inner bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-bold transition-all w-full sm:w-auto"
                  >
                    Megértettem, vigyázok a bőrömre!
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
