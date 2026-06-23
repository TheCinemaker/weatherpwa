import React, { useEffect, useState } from 'react';
import { Sun, ExternalLink, ShieldAlert } from 'lucide-react';

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
  if (uv < 6)  return { label: 'Mérsékelt',     color: '#fbbf24', advice: 'Délben ajánlott napszemüveg és fényvédő.' };
  if (uv < 8)  return { label: 'Magas',         color: '#fb923c', advice: 'Naptej (SPF 30+), kalap, árnyék 11–15 óra között.' };
  if (uv < 11) return { label: 'Nagyon magas',  color: '#f43f5e', advice: 'Erős védelem kell; kerüld a déli napot.' };
  return                { label: 'Extrém',        color: '#a855f7', advice: 'Kerüld a szabadban tartózkodást a déli órákban!' };
}

export default function UvCard() {
  const [uv, setUv] = useState(null);
  const [uvMax, setUvMax] = useState(null);
  const [state, setState] = useState('loading'); // 'loading' | 'ok' | 'error'

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

  const lvl = uvLevel(uv);
  const fillPct = uv != null ? Math.max(4, Math.min(100, (uv / 11) * 100)) : 0;

  return (
    <div className="glass-card rounded-apple-outer p-5 overflow-hidden relative">
      {/* lágy színes fény az aktuális szint alapján */}
      {lvl && (
        <div
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: lvl.color }}
        />
      )}

      <div className="relative flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-apple-inner flex items-center justify-center text-white shadow-sm shrink-0"
          style={{ background: `linear-gradient(135deg, ${lvl?.color || '#22d3ee'}, #f97316)` }}
        >
          <Sun className="w-6 h-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-0.5">
            UV-index · Kőszeg
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
          className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan2-200/80 hover:text-cyan2-200 transition-colors shrink-0"
        >
          Hivatalos: HungaroMet
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
