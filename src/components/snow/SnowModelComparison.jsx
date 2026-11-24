import { useState } from 'react';
import { Layers, CheckCircle2, AlertTriangle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import {
  CONSENSUS_THRESHOLDS,
  formatBudapestTimeShort,
  formatSnowCm,
} from '../../utils/snowForecastEngine';

const AGREEMENT_STYLES = {
  good: {
    badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/35',
    dot: 'bg-emerald-400',
  },
  moderate: {
    badge: 'bg-amber-500/20 text-amber-200 border-amber-400/35',
    dot: 'bg-amber-400',
  },
  weak: {
    badge: 'bg-rose-500/20 text-rose-200 border-rose-400/35',
    dot: 'bg-rose-400',
  },
  insufficient: {
    badge: 'bg-slate-500/20 text-slate-200 border-slate-400/30',
    dot: 'bg-slate-400',
  },
};

export default function SnowModelComparison({
  models,
  consensus,
  horizonHours,
  selectedModelId,
  onSelectModel,
}) {
  const [showThresholds, setShowThresholds] = useState(false);
  const agrStyle = AGREEMENT_STYLES[consensus?.agreement?.level || 'insufficient'];

  return (
    <section className="rounded-apple-card glass-card p-4 sm:p-5 space-y-4">
      {/* Fejléc és konszenzus jelvény */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-300" />
            <span>Modell-összehasonlítás és konszenzus ({horizonHours} óra)</span>
          </h3>
          <p className="text-[11px] text-white/60 mt-0.5">
            Kattints egy modellre a fenti grafikon önálló átváltásához, vagy maradj a többmodellű mediánnál.
          </p>
        </div>

        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-extrabold ${agrStyle.badge}`}>
          <span className={`w-2 h-2 rounded-full ${agrStyle.dot}`} />
          <span>{consensus?.agreement?.label || '–'}</span>
        </div>
      </div>

      {/* Statisztikai összefoglaló sáv */}
      {consensus?.availableModelCount > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: 'Medián (fő)', value: formatSnowCm(consensus.freshSnow?.median), highlight: true },
            { label: 'Minimum', value: formatSnowCm(consensus.freshSnow?.min) },
            { label: 'Maximum', value: formatSnowCm(consensus.freshSnow?.max) },
            { label: 'Átlag', value: formatSnowCm(consensus.freshSnow?.mean) },
            {
              label: 'Eltérés (Max–Min)',
              value: consensus.freshSnow?.spread != null
                ? `${consensus.freshSnow.spread.toLocaleString('hu-HU')} cm`
                : '–',
            },
            {
              label: 'Szórás (σ)',
              value: consensus.freshSnow?.stdDev != null
                ? `${consensus.freshSnow.stdDev.toLocaleString('hu-HU')} cm`
                : '–',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-apple-inner px-3 py-2 border ${
                stat.highlight
                  ? 'bg-sky-400/15 border-sky-300/35'
                  : 'bg-white/[0.04] border-white/10'
              }`}
            >
              <div className="text-[10px] font-semibold text-white/55">{stat.label}</div>
              <div className={`text-sm font-extrabold mt-0.5 ${stat.highlight ? 'text-sky-200' : 'text-white'}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Konszenzus gomb + Modell kártyák */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onSelectModel('consensus')}
          className={`w-full text-left rounded-apple-inner px-3.5 py-2.5 border transition-all flex flex-wrap items-center justify-between gap-2 ${
            selectedModelId === 'consensus'
              ? 'bg-sky-500/20 border-sky-300/50 shadow-glow'
              : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-4 h-4 ${selectedModelId === 'consensus' ? 'text-sky-300' : 'text-white/40'}`} />
            <div>
              <span className="text-xs font-extrabold text-white">Modellkonszenzus (Medián idősor)</span>
              <span className="block text-[10px] text-white/60">
                {consensus?.snowingModelCount ?? 0} / {consensus?.availableModelCount ?? 0} teljes időtávú modell jelez havazást · A medián nem valószínűségi garancia
              </span>
            </div>
          </div>
          <span className="text-xs font-extrabold text-sky-200">
            {formatSnowCm(consensus?.freshSnow?.median)}
          </span>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {models.map((m) => {
            const isOk = m.status === 'ok';
            const win = m.windows?.[String(horizonHours)];
            const isSelected = selectedModelId === m.id;
            const isPartial = !!win?.partialCoverage;
            const isStale = !!m.metadata?.isStale;

            return (
              <button
                key={m.id}
                type="button"
                disabled={!isOk}
                onClick={() => isOk && onSelectModel(m.id)}
                className={`text-left rounded-apple-inner p-3 border transition-all flex flex-col justify-between gap-2 ${
                  !isOk
                    ? 'bg-rose-500/[0.06] border-rose-400/25 opacity-75 cursor-not-allowed'
                    : isSelected
                      ? 'bg-sky-500/20 border-sky-300/55 ring-1 ring-sky-300/35'
                      : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-extrabold text-white">{m.shortName}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/75">
                        {m.resolution}
                      </span>
                      {isPartial && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200">
                          ~{m.metadata?.validHorizonHours} órás horizont
                        </span>
                      )}
                      {isStale && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-400/20 text-rose-200 inline-flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" /> Elavult futás
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-white/55 truncate mt-0.5">{m.provider}</div>
                  </div>

                  {isOk ? (
                    <span className="text-sm font-extrabold text-sky-200 shrink-0">
                      {win?.hasSnowfall ? formatSnowCm(win.freshSnowCm) : 'Hiányzó hóadat'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 shrink-0">
                      <XCircle className="w-3.5 h-3.5" /> Hiányzik
                    </span>
                  )}
                </div>

                {isOk && win ? (
                  <div className="text-[11px] text-white/75 space-y-1 border-t border-white/10 pt-2 w-full">
                    <div className="flex justify-between gap-2">
                      <span className="text-white/50">Kezdet:</span>
                      <span className="font-semibold">
                        {win.snowStart ? formatBudapestTimeShort(win.snowStart.epochMs) : 'Nincs havazás'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/50">Vége:</span>
                      <span className="font-semibold">
                        {win.snowEnd ? formatBudapestTimeShort(win.snowEnd.epochMs) : '–'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/50">Csúcsintenzitás:</span>
                      <span className="font-semibold">
                        {win.snowPeak ? `${win.snowPeak.cmPerHour.toLocaleString('hu-HU')} cm/ó` : '0 cm/ó'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2 text-[10px] text-white/50 pt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> Futás:
                      </span>
                      <span>
                        {m.metadata?.runInitEpochMs
                          ? formatBudapestTimeShort(m.metadata.runInitEpochMs)
                          : m.isComposite
                            ? 'Kompozit idősor'
                            : 'Nincs metaadat'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-rose-200/85 border-t border-rose-400/20 pt-2 w-full">
                    {m.error || 'A modell nem válaszolt vagy nem fedi le ezt a területet.'}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Konszenzus ok + kinyitható küszöbérték dokumentáció */}
      <div className="rounded-apple-inner bg-white/[0.03] border border-white/10 px-3 py-2.5 text-[11px] text-white/75">
        <div className="flex items-start justify-between gap-2">
          <p>{consensus?.agreement?.reason}</p>
          <button
            type="button"
            onClick={() => setShowThresholds((v) => !v)}
            className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-sky-300 hover:text-sky-200"
          >
            <span>Küszöbök</span>
            {showThresholds ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
        {showThresholds && (
          <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-white/60 space-y-1">
            <div>
              • <strong>Jó egyezés:</strong> max–min ≤ {CONSENSUS_THRESHOLDS.GOOD_MAX_SPREAD_CM} cm, szórás ≤{' '}
              {CONSENSUS_THRESHOLDS.GOOD_MAX_STDDEV_CM} cm, vagy minden modell {'<'} {CONSENSUS_THRESHOLDS.NEGLIGIBLE_SNOW_CM} cm.
            </div>
            <div>
              • <strong>Közepes egyezés:</strong> max–min ≤ {CONSENSUS_THRESHOLDS.MODERATE_MAX_SPREAD_CM} cm, szórás ≤{' '}
              {CONSENSUS_THRESHOLDS.MODERATE_MAX_STDDEV_CM} cm, erős száraz/havas ellentmondás legfeljebb{' '}
              {CONSENSUS_THRESHOLDS.CONTRADICTION_MODERATE_MAX_CM} cm-ig.
            </div>
            <div>
              • <strong>Gyenge egyezés:</strong> a fenti határok felett, vagy éles ellentmondás esetén.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

