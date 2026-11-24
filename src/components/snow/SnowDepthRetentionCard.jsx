import { Layers3, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatSnowCm } from '../../utils/snowForecastEngine';

const RETENTION_BADGES = {
  high: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/35',
  moderate: 'bg-sky-500/20 text-sky-200 border-sky-400/35',
  uncertain: 'bg-amber-500/20 text-amber-200 border-amber-400/35',
  low: 'bg-rose-500/20 text-rose-200 border-rose-400/35',
  existing: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/35',
  none: 'bg-white/[0.08] text-white/75 border-white/15',
};

function formatDepthCell(medianCm, minCm, maxCm) {
  if (medianCm == null) return { main: 'Nincs adat', range: null };
  const main = formatSnowCm(medianCm);
  if (minCm == null || maxCm == null) return { main, range: null };
  const minTxt = formatSnowCm(minCm);
  const maxTxt = formatSnowCm(maxCm);
  if (minTxt === maxTxt) return { main, range: 'modellek azonosak' };
  return { main, range: `tartomány: ${minTxt} – ${maxTxt}` };
}

export default function SnowDepthRetentionCard({
  consensus,
  selectedModel,
  horizonHours,
  isConsensus,
}) {
  const snowDepth = consensus?.snowDepth;
  const activeRetention = !isConsensus && selectedModel
    ? selectedModel.windows?.[String(horizonHours)]?.retention
    : null;

  // Konszenzus esetén a rendelkezésre álló modellek leggyakoribb/legóvatosabb megmaradási értékelése
  const displayRetention = activeRetention || (() => {
    const win = selectedModel?.windows?.[String(horizonHours)];
    if (win?.retention) return win.retention;
    if ((consensus?.freshSnow?.median ?? 0) < 0.2) {
      return {
        level: 'none',
        label: 'Nincs érdemi friss hóréteg',
        reason: 'A modellek mediánja nem jelez olyan friss havazást, amely tartós hótakarót építene.',
      };
    }
    return {
      level: 'uncertain',
      label: 'Többmodellű összesítés',
      reason: 'A hóvastagság alakulása a felszíni hőmérséklettől és a talaj hőháztartásától függ — lásd a fenti modell-lapokat.',
    };
  })();

  const cells = [
    { label: 'Jelenlegi (0 óra)', ...formatDepthCell(snowDepth?.currentMedianCm, null, null) },
    { label: '+24 óra múlva', ...formatDepthCell(snowDepth?.at24hMedianCm, snowDepth?.at24hMinCm, snowDepth?.at24hMaxCm) },
    { label: '+48 óra múlva', ...formatDepthCell(snowDepth?.at48hMedianCm, snowDepth?.at48hMinCm, snowDepth?.at48hMaxCm) },
    { label: '+72 óra múlva', ...formatDepthCell(snowDepth?.at72hMedianCm, snowDepth?.at72hMinCm, snowDepth?.at72hMaxCm) },
  ];

  return (
    <section className="rounded-apple-card glass-card p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
            <Layers3 className="w-4 h-4 text-sky-300" />
            <span>Talajon lévő hóvastagság (snow_depth) és megmaradás</span>
          </h3>
          <p className="text-[11px] text-white/60 mt-0.5">
            Különválasztva a lehulló friss hótól (`snowfall`): a numerikus modellek által a talajra számított tényleges hótakaró (méterből cm-re átszámítva).
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
            RETENTION_BADGES[displayRetention.level] || RETENTION_BADGES.none
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {displayRetention.label}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {cells.map((c) => (
          <div key={c.label} className="rounded-apple-inner bg-white/[0.04] border border-white/10 p-3">
            <div className="text-[10px] font-semibold text-white/55">{c.label}</div>
            <div className="text-base font-extrabold text-white mt-0.5">{c.main}</div>
            {c.range && <div className="text-[10px] text-sky-200/75 mt-0.5">{c.range}</div>}
          </div>
        ))}
      </div>

      {snowDepth?.hasSignificantDivergence && (
        <div className="rounded-apple-inner bg-amber-500/10 border border-amber-400/25 px-3 py-2 text-[11px] text-amber-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" />
          <span>
            A modellek között jelentős eltérés van a talajon megmaradó hóvastagságban (akár{' '}
            <strong>{snowDepth.maxSpreadCm.toLocaleString('hu-HU')} cm</strong> különbség a 24–72 órás metszetekben).
          </span>
        </div>
      )}

      <div className="text-xs text-white/80 leading-relaxed bg-white/[0.03] rounded-apple-inner px-3 py-2.5 border border-white/10">
        {displayRetention.reason}
      </div>
    </section>
  );
}

