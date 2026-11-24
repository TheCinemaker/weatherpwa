import { useState } from 'react';
import { FileText, ShieldAlert, Database, ChevronDown, ChevronUp, ExternalLink, AlertCircle } from 'lucide-react';
import { formatBudapestDateTime } from '../../utils/snowForecastEngine';

export default function SnowAssessmentCard({
  assessment,
  officialWarnings,
  models,
  fetchedAtEpochMs,
  cached,
  cacheAgeSec,
}) {
  const [showProvenance, setShowProvenance] = useState(false);

  const localWarnings = officialWarnings?.localWarnings || [];
  const nationalSnowWarnings = officialWarnings?.nationalSnowWarnings || [];

  return (
    <div className="space-y-4">
      {/* E. Determinisztikus meteorológiai értékelés */}
      <section className="rounded-apple-card glass-card p-4 sm:p-5 space-y-3">
        <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-300" />
          <span>Meteorológiai értékelés</span>
        </h3>

        <p className="text-xs sm:text-sm font-bold text-sky-100 leading-relaxed">
          {assessment?.headline}
        </p>

        {assessment?.summaryParagraphs?.map((p, idx) => (
          <p key={idx} className="text-xs text-white/80 leading-relaxed">
            {p}
          </p>
        ))}

        {assessment?.caveats?.length > 0 && (
          <ul className="space-y-1.5 pt-2 border-t border-white/10">
            {assessment.caveats.map((c, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[11px] text-amber-200/90">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-300" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Hivatalos HungaroMet / MeteoAlarm figyelmeztetések — külön kezelve a modellektől */}
      <section className="rounded-apple-card glass-card p-4 sm:p-5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-300" />
            <span>Hivatalos HungaroMet figyelmeztetések</span>
          </h3>
          <a
            href="https://www.met.hu/idojaras/veszelyjelzes/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-sky-300 hover:text-sky-200 inline-flex items-center gap-1"
          >
            <span>met.hu</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {!officialWarnings?.available ? (
          <p className="text-xs text-white/60">
            A hivatalos MeteoAlarm / HungaroMet riasztási feed jelenleg nem elérhető. A numerikus modellektől függetlenül ellenőrizd a met.hu oldalt.
          </p>
        ) : localWarnings.length > 0 ? (
          <div className="space-y-2">
            {localWarnings.map((w, idx) => (
              <div
                key={`${w.id}-${idx}`}
                className="rounded-apple-inner bg-amber-500/15 border border-amber-400/35 px-3 py-2 text-xs text-amber-100"
              >
                <div className="font-extrabold">
                  {w.levelHu}: {w.eventHu}
                </div>
                <div className="text-[11px] text-amber-100/80 mt-0.5">
                  Terület: {w.areaDesc} · Érvényes: {w.onset ? formatBudapestDateTime(Date.parse(w.onset)) : '–'} –{' '}
                  {w.expires ? formatBudapestDateTime(Date.parse(w.expires)) : '–'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-emerald-200/90 bg-emerald-500/10 border border-emerald-400/25 rounded-apple-inner px-3 py-2">
            Vas vármegyére / Nyugat-Dunántúlra jelenleg nincs érvényben hivatalos téli vagy egyéb veszélyjelzés.
          </div>
        )}

        {nationalSnowWarnings.length > 0 && (
          <p className="text-[11px] text-white/60">
            Országos kontextus: más magyarországi régiókban ({[...new Set(nationalSnowWarnings.map((w) => w.areaDesc))].join(', ')}) jelenleg aktív havazás/síkos út figyelmeztetés van érvényben.
          </p>
        )}
      </section>

      {/* Adatforrások és frissítési időpontok */}
      <section className="rounded-apple-card glass-card p-4">
        <button
          type="button"
          onClick={() => setShowProvenance((v) => !v)}
          className="w-full flex items-center justify-between gap-2 text-left"
        >
          <span className="text-xs font-extrabold text-white/85 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-sky-300" />
            <span>
              Adatforrások és modellfrissítések · Lekérve:{' '}
              {fetchedAtEpochMs ? formatBudapestDateTime(fetchedAtEpochMs) : '–'}
              {cached ? ` (cache: ${cacheAgeSec} mp)` : ''}
            </span>
          </span>
          {showProvenance ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
        </button>

        {showProvenance && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-[11px] text-white/75">
            {models.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-1 border-b border-white/5 last:border-0">
                <div>
                  <span className="font-bold text-white">{m.name}</span>{' '}
                  <span className="text-white/50">({m.provider}, {m.resolution})</span>
                  {m.notes && <span className="block text-[10px] text-white/50">{m.notes}</span>}
                </div>
                <div className="text-right text-[10px]">
                  {m.status === 'ok' ? (
                    <>
                      <div className={m.metadata?.isStale ? 'text-rose-300 font-bold' : 'text-emerald-300 font-bold'}>
                        {m.metadata?.isStale ? 'Elavult futás' : 'Érvényes'} · {m.metadata?.validHorizonHours}h
                      </div>
                      <div className="text-white/50">
                        Futás:{' '}
                        {m.metadata?.runInitEpochMs
                          ? formatBudapestDateTime(m.metadata.runInitEpochMs)
                          : m.isComposite
                            ? 'kompozit'
                            : 'ismeretlen'}
                      </div>
                    </>
                  ) : (
                    <span className="text-rose-300 font-bold">Sikertelen ({m.error})</span>
                  )}
                </div>
              </div>
            ))}
            <p className="text-[10px] text-white/45 pt-1">
              Források: Open-Meteo API (DWD ICON-D2, DWD ICON-EU, ECMWF IFS, NOAA GFS, Best Match) · Hivatalos riasztások: HungaroMet / EUMETNET MeteoAlarm. Kőszeg (47.389°N, 16.541°E · 277 m).
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

