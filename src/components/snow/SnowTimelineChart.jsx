import { memo, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { ChevronLeft, ChevronRight, Snowflake, Droplets, Thermometer, Wind, Mountain } from 'lucide-react';
import { formatBudapestDateTime, formatSnowCm } from '../../utils/snowForecastEngine';

ChartJS.register(
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

const PHASE_BADGE_STYLES = {
  dry_snow: 'bg-sky-400/20 text-sky-200 border-sky-300/35',
  wet_snow: 'bg-cyan-400/20 text-cyan-100 border-cyan-300/35',
  sleet: 'bg-indigo-400/20 text-indigo-200 border-indigo-300/35',
  freezing_rain: 'bg-rose-500/25 text-rose-200 border-rose-400/45',
  rain: 'bg-slate-400/20 text-slate-200 border-slate-300/30',
  none: 'bg-white/[0.06] text-white/70 border-white/15',
};

function degToCompass(deg) {
  if (typeof deg !== 'number' || !Number.isFinite(deg)) return '–';
  const dirs = ['É', 'ÉK', 'K', 'DK', 'D', 'DNy', 'Ny', 'ÉNy'];
  return dirs[Math.round(deg / 45) % 8] || '–';
}

function formatAxisLabel(epochMs) {
  const d = new Date(epochMs);
  const clock = new Intl.DateTimeFormat('hu-HU', {
    timeZone: 'Europe/Budapest',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
  if (clock === '00:00' || clock === '12:00') {
    const day = new Intl.DateTimeFormat('hu-HU', {
      timeZone: 'Europe/Budapest',
      weekday: 'short',
    }).format(d);
    return `${day} ${clock}`;
  }
  return clock;
}

const SnowTimelineChart = memo(function SnowTimelineChart({
  hourlySeries,
  seriesLabel,
  horizonHours,
  isConsensus,
}) {
  const sliced = useMemo(() => {
    if (!Array.isArray(hourlySeries) || hourlySeries.length === 0) return [];
    const startMs = hourlySeries[0].epochMs;
    const limitMs = startMs + horizonHours * 3600000;
    return hourlySeries.filter((h) => h.epochMs < limitMs);
  }, [hourlySeries, horizonHours]);

  // Alapértelmezett kijelölt óra: az első számottevő csapadékos/havas óra, különben a legeleje
  const defaultIdx = useMemo(() => {
    if (!sliced.length) return 0;
    const peakIdx = sliced.reduce((best, cur, idx) => {
      const curScore = (cur.snowfallCm ?? 0) * 10 + (cur.precipitationMm ?? 0);
      const bestScore = (sliced[best]?.snowfallCm ?? 0) * 10 + (sliced[best]?.precipitationMm ?? 0);
      return curScore > bestScore ? idx : best;
    }, 0);
    return peakIdx;
  }, [sliced]);

  const [manualSelection, setManualSelection] = useState(null);
  const selectedIdx = useMemo(() => {
    if (!sliced.length) return 0;
    if (
      manualSelection &&
      manualSelection.key === `${seriesLabel}-${horizonHours}` &&
      manualSelection.idx >= 0 &&
      manualSelection.idx < sliced.length
    ) {
      return manualSelection.idx;
    }
    return defaultIdx;
  }, [manualSelection, seriesLabel, horizonHours, sliced.length, defaultIdx]);

  const selectIndex = (idx) => {
    if (idx < 0 || idx >= sliced.length) return;
    setManualSelection({ key: `${seriesLabel}-${horizonHours}`, idx });
  };

  const labels = useMemo(() => sliced.map((h) => formatAxisLabel(h.epochMs)), [sliced]);

  // 1. grafikon: Friss hó (cm/ó) bal tengely + Hőmérséklet / Nedves hőmérséklet (°C) jobb tengely
  const snowTempData = useMemo(() => ({
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Friss hó (cm/ó)',
        data: sliced.map((h) => h.snowfallCm ?? 0),
        yAxisID: 'ySnow',
        backgroundColor: 'rgba(125, 211, 252, 0.78)',
        borderColor: 'rgba(186, 230, 253, 0.95)',
        borderWidth: 1,
        borderRadius: 4,
        order: 2,
      },
      {
        type: 'line',
        label: 'Hőmérséklet (°C)',
        data: sliced.map((h) => h.tempC),
        yAxisID: 'yTemp',
        borderColor: '#fbbf24',
        backgroundColor: 'rgba(251, 191, 36, 0.12)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.3,
        order: 1,
      },
      {
        type: 'line',
        label: 'Nedves hőm. (°C)',
        data: sliced.map((h) => h.wetBulbC),
        yAxisID: 'yTemp',
        borderColor: '#93c5fd',
        borderDash: [4, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 3,
        tension: 0.3,
        order: 1,
      },
    ],
  }), [labels, sliced]);

  const snowTempOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    onClick: (_, elements) => {
      if (elements && elements.length > 0) {
        selectIndex(elements[0].index);
      }
    },
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255,255,255,0.82)',
          boxWidth: 10,
          boxHeight: 10,
          font: { size: 10, weight: '600' },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(8, 17, 29, 0.94)',
        borderColor: 'rgba(125, 211, 252, 0.35)',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        callbacks: {
          title: (items) => {
            const idx = items?.[0]?.dataIndex;
            const pt = idx != null ? sliced[idx] : null;
            return pt ? formatBudapestDateTime(pt.epochMs) : '';
          },
          label: (ctx) => {
            const v = ctx.parsed.y;
            if (v == null) return null;
            const unit = ctx.dataset.yAxisID === 'ySnow' ? ' cm/ó' : ' °C';
            return `${ctx.dataset.label.replace(/\s*\([^)]*\)/, '')}: ${v.toLocaleString('hu-HU')}${unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: 'rgba(255,255,255,0.65)', maxRotation: 0, autoSkip: true, maxTicksLimit: 8, font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      ySnow: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        suggestedMax: 2,
        title: { display: true, text: 'Friss hó (cm)', color: 'rgba(186,230,253,0.8)', font: { size: 10 } },
        ticks: { color: 'rgba(186,230,253,0.85)', font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.06)' },
      },
      yTemp: {
        type: 'linear',
        position: 'right',
        title: { display: true, text: 'Hőm. (°C)', color: 'rgba(253,230,138,0.8)', font: { size: 10 } },
        ticks: { color: 'rgba(253,230,138,0.85)', font: { size: 10 } },
        grid: { drawOnChartArea: false },
      },
    },
  }), [sliced]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. grafikon: Összes csapadék (mm/ó) bal tengely + Hóvastagság a talajon (cm) jobb tengely
  const precipDepthData = useMemo(() => ({
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Csapadék (mm/ó)',
        data: sliced.map((h) => h.precipitationMm ?? 0),
        yAxisID: 'yPrecip',
        backgroundColor: 'rgba(56, 189, 248, 0.45)',
        borderColor: 'rgba(56, 189, 248, 0.8)',
        borderWidth: 1,
        borderRadius: 3,
        order: 2,
      },
      {
        type: 'line',
        label: 'Hóvastagság talajon (cm)',
        data: sliced.map((h) => h.snowDepthCm),
        yAxisID: 'yDepth',
        borderColor: '#e0f2fe',
        backgroundColor: 'rgba(224, 242, 254, 0.14)',
        borderWidth: 2,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.25,
        order: 1,
      },
    ],
  }), [labels, sliced]);

  const precipDepthOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    onClick: (_, elements) => {
      if (elements && elements.length > 0) {
        selectIndex(elements[0].index);
      }
    },
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255,255,255,0.82)',
          boxWidth: 10,
          boxHeight: 10,
          font: { size: 10, weight: '600' },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(8, 17, 29, 0.94)',
        borderColor: 'rgba(125, 211, 252, 0.35)',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        callbacks: {
          title: (items) => {
            const idx = items?.[0]?.dataIndex;
            const pt = idx != null ? sliced[idx] : null;
            return pt ? formatBudapestDateTime(pt.epochMs) : '';
          },
          label: (ctx) => {
            const v = ctx.parsed.y;
            if (v == null) return null;
            const unit = ctx.dataset.yAxisID === 'yPrecip' ? ' mm/ó' : ' cm (talajon)';
            return `${ctx.dataset.label.replace(/\s*\([^)]*\)/, '')}: ${v.toLocaleString('hu-HU')}${unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: 'rgba(255,255,255,0.65)', maxRotation: 0, autoSkip: true, maxTicksLimit: 8, font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      yPrecip: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        suggestedMax: 2,
        title: { display: true, text: 'Csapadék (mm)', color: 'rgba(125,211,252,0.8)', font: { size: 10 } },
        ticks: { color: 'rgba(125,211,252,0.85)', font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.06)' },
      },
      yDepth: {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        suggestedMax: 5,
        title: { display: true, text: 'Hóréteg (cm)', color: 'rgba(224,242,254,0.85)', font: { size: 10 } },
        ticks: { color: 'rgba(224,242,254,0.85)', font: { size: 10 } },
        grid: { drawOnChartArea: false },
      },
    },
  }), [sliced]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeHour = sliced[selectedIdx] || null;

  if (!sliced.length) {
    return (
      <div className="rounded-apple-card glass-card p-5 text-xs text-white/70">
        Ehhez a modellhez ebben az időtávban nincs megjeleníthető óránkénti adat.
      </div>
    );
  }

  return (
    <section className="rounded-apple-card glass-card p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
            <Snowflake className="w-4 h-4 text-sky-300" />
            <span>Óránkénti idővonal · {seriesLabel}</span>
          </h3>
          <p className="text-[11px] text-white/60 mt-0.5">
            {isConsensus
              ? 'Többmodellű medián idősor · koppints vagy kattints bármelyik órára a részletes adatokért'
              : 'Kiválasztott modell önálló idősora · koppints bármelyik órára a részletekért'}
          </p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-sky-400/15 border border-sky-300/25 text-sky-200">
          Külön tengelyek: cm · °C · mm
        </span>
      </div>

      {/* Kijelölt óra részletező kártya */}
      {activeHour && (
        <div className="rounded-apple-inner bg-white/[0.05] border border-sky-300/20 p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => selectIndex(selectedIdx - 1)}
                disabled={selectedIdx <= 0}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-white transition-colors"
                aria-label="Előző óra"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="text-xs font-extrabold text-white">
                  {formatBudapestDateTime(activeHour.epochMs)}
                </div>
                <div className="text-[10px] text-white/55 font-semibold">
                  +{activeHour.offsetHours} óra előrejelzés (Europe/Budapest)
                </div>
              </div>
              <button
                type="button"
                onClick={() => selectIndex(selectedIdx + 1)}
                disabled={selectedIdx >= sliced.length - 1}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-white transition-colors"
                aria-label="Következő óra"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <span
              className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
                PHASE_BADGE_STYLES[activeHour.phase?.code || 'none']
              }`}
            >
              {activeHour.phase?.label || '–'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="rounded-lg bg-black/25 px-2.5 py-2 border border-white/5">
              <div className="text-[10px] text-white/55 flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-amber-300" /> Hőm. / Nedves
              </div>
              <div className="font-extrabold text-white mt-0.5">
                {activeHour.tempC != null ? `${activeHour.tempC.toLocaleString('hu-HU')} °C` : '–'}
                <span className="text-sky-200/80 font-semibold text-[11px] ml-1">
                  ({activeHour.wetBulbC != null ? `${activeHour.wetBulbC.toLocaleString('hu-HU')}°` : '–'})
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-black/25 px-2.5 py-2 border border-white/5">
              <div className="text-[10px] text-white/55 flex items-center gap-1">
                <Snowflake className="w-3 h-3 text-sky-300" /> Friss hó
              </div>
              <div className="font-extrabold text-sky-200 mt-0.5">
                {activeHour.snowfallCm != null ? `${activeHour.snowfallCm.toLocaleString('hu-HU')} cm/ó` : '–'}
              </div>
            </div>

            <div className="rounded-lg bg-black/25 px-2.5 py-2 border border-white/5">
              <div className="text-[10px] text-white/55 flex items-center gap-1">
                <Droplets className="w-3 h-3 text-cyan-300" /> Csapadék
              </div>
              <div className="font-extrabold text-white mt-0.5">
                {activeHour.precipitationMm != null ? `${activeHour.precipitationMm.toLocaleString('hu-HU')} mm` : '–'}
              </div>
            </div>

            <div className="rounded-lg bg-black/25 px-2.5 py-2 border border-white/5">
              <div className="text-[10px] text-white/55 flex items-center gap-1">
                <Wind className="w-3 h-3 text-teal-300" /> Szél / Lökés
              </div>
              <div className="font-extrabold text-white mt-0.5">
                {activeHour.windSpeedKmh != null ? Math.round(activeHour.windSpeedKmh) : '–'}
                {activeHour.windGustsKmh != null ? `–${Math.round(activeHour.windGustsKmh)}` : ''} km/h{' '}
                <span className="text-white/60 text-[10px]">{degToCompass(activeHour.windDirDeg)}</span>
              </div>
            </div>

            <div className="rounded-lg bg-black/25 px-2.5 py-2 border border-white/5 col-span-2 sm:col-span-1">
              <div className="text-[10px] text-white/55 flex items-center gap-1">
                <Mountain className="w-3 h-3 text-indigo-300" /> Hóréteg / 0°C szint
              </div>
              <div className="font-extrabold text-white mt-0.5 text-[11px]">
                {activeHour.snowDepthCm != null ? formatSnowCm(activeHour.snowDepthCm) : '–'}
                <span className="text-white/60 ml-1">
                  · {activeHour.freezingLevelM != null ? `${Math.round(activeHour.freezingLevelM)} m` : '0°C n.a.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. grafikon: Friss hó + Hőmérséklet */}
      <div>
        <div className="text-[11px] font-bold text-white/75 mb-1.5">
          1. Friss havazás (cm/ó) és hőmérséklet / nedves hőmérséklet (°C)
        </div>
        <div className="h-48 sm:h-56 w-full">
          <Chart type="bar" data={snowTempData} options={snowTempOptions} />
        </div>
      </div>

      {/* 2. grafikon: Teljes csapadék (mm/ó) + Hóvastagság a talajon (cm) */}
      <div>
        <div className="text-[11px] font-bold text-white/75 mb-1.5">
          2. Összes csapadék (mm/ó) és talajon lévő hóvastagság (cm)
        </div>
        <div className="h-40 sm:h-48 w-full">
          <Chart type="bar" data={precipDepthData} options={precipDepthOptions} />
        </div>
      </div>
    </section>
  );
});

export default SnowTimelineChart;

