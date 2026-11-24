import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Snowflake,
  RefreshCw,
  Thermometer,
  Clock,
  Layers3,
  AlertTriangle,
} from 'lucide-react';
import { fetchSnowForecast } from '../api/snowForecast';
import {
  FORECAST_HORIZONS,
  formatBudapestTimeShort,
  formatSnowCm,
} from '../utils/snowForecastEngine';
import SnowTimelineChart from './snow/SnowTimelineChart';
import SnowModelComparison from './snow/SnowModelComparison';
import SnowDepthRetentionCard from './snow/SnowDepthRetentionCard';
import SnowAssessmentCard from './snow/SnowAssessmentCard';

function SnowModalSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="rounded-apple-card bg-white/[0.05] border border-white/10 h-36" />
      <div className="rounded-apple-card bg-white/[0.05] border border-white/10 h-64" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-apple-card bg-white/[0.05] border border-white/10 h-28" />
        <div className="rounded-apple-card bg-white/[0.05] border border-white/10 h-28" />
        <div className="rounded-apple-card bg-white/[0.05] border border-white/10 h-28" />
      </div>
    </div>
  );
}

const AUTO_REFRESH_MS = 15 * 60 * 1000; // 15 perc

export default function SnowForecastModal({ isOpen, onClose, currentTemp = null }) {
  const [horizonHours, setHorizonHours] = useState(48);
  const [selectedModelId, setSelectedModelId] = useState('consensus');
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [fetchNonce, setFetchNonce] = useState(0); // kézi frissítés (gyorsítótár megkerülésével)
  const [autoTick, setAutoTick] = useState(0); // nyitva hagyott modal időzített újratöltése
  const forceRef = useRef(false);
  const dataRef = useRef(null);

  const handleRefresh = useCallback(() => {
    forceRef.current = true;
    setRefreshing(true);
    setError(null);
    setFetchNonce((n) => n + 1);
  }, []);

  // Nyitva hagyott modal: AUTO_REFRESH_MS-enként csendes újratöltés
  useEffect(() => {
    if (!isOpen) return undefined;
    const id = setInterval(() => setAutoTick((n) => n + 1), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [isOpen]);

  // Minden megnyitáskor (és kézi / időzített frissítéskor) új lekérés. A régi adat
  // addig látszik, amíg az új meg nem érkezik. Sima lekérés a szerver 3 perces
  // gyorsítótárából is jöhet; csak a Frissítés gomb kényszerít (refresh=1) friss hívást.
  useEffect(() => {
    if (!isOpen) return undefined;
    const force = forceRef.current;
    forceRef.current = false;
    const controller = new AbortController();
    let cancelled = false;
    fetchSnowForecast({ refresh: force, signal: controller.signal })
      .then((json) => {
        if (!cancelled) {
          dataRef.current = json;
          setData(json);
          setError(null);
        }
      })
      .catch((err) => {
        // Háttér-újratöltés hibája ne dobja el a már látható adatot, de jelezzük a felhasználónak
        if (!cancelled && err?.name !== 'AbortError') {
          setError(err?.message || 'Nem sikerült betölteni a hóelőrejelzést.');
        }
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isOpen, fetchNonce, autoTick]);

  const isInitialLoading = isOpen && !data && !error;
  const isBusy = refreshing || isInitialLoading;

  // Esc gomb + body scroll lock
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  const horizonKey = String(horizonHours);
  const consensus = data?.consensus?.[horizonKey] || null;
  const assessment = data?.assessment?.[horizonKey] || null;
  const models = useMemo(() => data?.models || [], [data]);

  const activeModel = useMemo(() => {
    if (selectedModelId === 'consensus') return null;
    const found = models.find((m) => m.id === selectedModelId && m.status === 'ok');
    return found || null;
  }, [models, selectedModelId]);

  const activeHourlySeries = useMemo(() => {
    if (activeModel) return activeModel.hourly || [];
    return consensus?.consensusHourly || [];
  }, [activeModel, consensus]);

  const heroSnowStartText = useMemo(() => {
    const startMs = activeModel
      ? activeModel.windows?.[horizonKey]?.snowStart?.epochMs
      : consensus?.timing?.medianStartMs;
    if (!startMs) return 'Nincs havazás az ablakban';
    return formatBudapestTimeShort(startMs);
  }, [activeModel, consensus, horizonKey]);

  const heroFreshSnowText = useMemo(() => {
    if (activeModel) {
      return formatSnowCm(activeModel.windows?.[horizonKey]?.freshSnowCm);
    }
    if (!consensus) return '–';
    const minD = consensus.freshSnowDisplay?.minCm;
    const maxD = consensus.freshSnowDisplay?.maxCm;
    const med = consensus.freshSnow?.median;
    if (minD != null && maxD != null && minD !== maxD) {
      return `${minD.toLocaleString('hu-HU')}–${maxD.toLocaleString('hu-HU')} cm (medián: ${formatSnowCm(med)})`;
    }
    return formatSnowCm(med);
  }, [activeModel, consensus, horizonKey]);

  const heroDepthText = useMemo(() => {
    if (activeModel) {
      return formatSnowCm(activeModel.windows?.[horizonKey]?.snowDepth?.peakCm);
    }
    const vals = [
      consensus?.snowDepth?.at24hMedianCm,
      consensus?.snowDepth?.at48hMedianCm,
      consensus?.snowDepth?.at72hMedianCm,
    ].filter((v) => v != null);
    if (!vals.length) return '–';
    return formatSnowCm(Math.max(...vals));
  }, [activeModel, consensus, horizonKey]);

  const modalNode = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Kőszeg Hóelőrejelzés"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.75 }}
            className="relative w-full sm:max-w-5xl h-[96dvh] sm:h-auto sm:max-h-[92vh] bg-[#07111c]/95 rounded-t-[26px] sm:rounded-apple-outer border border-sky-300/20 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Felső jegeskék accent sáv */}
            <div className="h-1.5 w-full shrink-0 bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400" />

            {/* Rögzített modal fejléc */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-[#07111c]/90 backdrop-blur-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-apple-inner bg-gradient-to-br from-sky-400/30 to-indigo-500/30 border border-sky-300/35 flex items-center justify-center text-sky-200 shrink-0">
                  <Snowflake className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                    Kőszeg · Hóelőrejelzés
                  </h2>
                  <p className="text-[10px] text-sky-200/75 font-semibold truncate">
                    Többmodellű numerikus hóelemzés (47.389°N, 16.541°E)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* 24 / 48 / 72 órás ablak választó */}
                <div className="flex items-center p-0.5 rounded-apple-inner bg-white/[0.06] border border-white/10">
                  {FORECAST_HORIZONS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHorizonHours(h)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                        horizonHours === h
                          ? 'bg-sky-400 text-slate-950 shadow'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {h}ó
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isBusy}
                  className="w-9 h-9 rounded-apple-inner bg-white/[0.08] hover:bg-white/15 border border-white/10 text-sky-200 flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
                  title="Friss előrejelzés lekérése"
                  aria-label="Frissítés"
                >
                  <RefreshCw className={`w-4 h-4 ${isBusy ? 'animate-spin' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-apple-inner bg-white/10 hover:bg-rose-500/80 border border-white/15 text-white flex items-center justify-center transition-all active:scale-95"
                  aria-label="Bezárás"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Görgethető belső tartalom */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {isInitialLoading ? (
                <SnowModalSkeleton />
              ) : error && !data ? (
                <div className="rounded-apple-card glass-card p-6 text-center space-y-3 border border-rose-400/30">
                  <AlertTriangle className="w-8 h-8 text-rose-300 mx-auto" />
                  <p className="text-sm font-bold text-white">{error}</p>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="btn-grad px-4 py-2 text-xs mx-auto"
                  >
                    Újrapróbálás
                  </button>
                </div>
              ) : data ? (
                <>
                  {error && (
                    <div className="rounded-apple-inner bg-rose-500/15 border border-rose-400/30 px-3.5 py-2 text-xs text-rose-200 flex items-center justify-between gap-2">
                      <span>Frissítési hiba: {error}</span>
                      <button
                        type="button"
                        onClick={handleRefresh}
                        className="font-bold underline shrink-0"
                      >
                        Újra
                      </button>
                    </div>
                  )}

                  {/* A. Fő előrejelzés összegző kártya */}
                  <section className="relative rounded-apple-card glass-card p-4 sm:p-5 overflow-hidden border border-sky-300/25">
                    <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-sky-400/15 blur-3xl pointer-events-none" />
                    <div className="relative z-10 space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-300">
                          Fő előrejelzés · Következő {horizonHours} óra ({activeModel ? activeModel.shortName : 'Modellkonszenzus'})
                        </span>
                        <span className="text-[10px] font-bold text-white/60">
                          Elérhető modellek: {data.dataQuality?.availableModels ?? 0} / {data.dataQuality?.totalModels ?? 5}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                        {activeModel
                          ? `${activeModel.shortName} modell: ${heroFreshSnowText} friss hó a következő ${horizonHours} órában`
                          : assessment?.headline}
                      </h3>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                        <div className="rounded-apple-inner bg-black/25 border border-white/10 p-3">
                          <div className="text-[10px] text-white/55 flex items-center gap-1">
                            <Thermometer className="w-3 h-3 text-amber-300" /> Jelenlegi hőmérséklet
                          </div>
                          <div className="text-base font-extrabold text-white mt-0.5">
                            {currentTemp != null ? `${currentTemp.toLocaleString('hu-HU')} °C` : '–'}
                          </div>
                        </div>

                        <div className="rounded-apple-inner bg-black/25 border border-white/10 p-3">
                          <div className="text-[10px] text-white/55 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-sky-300" /> Havazás kezdete
                          </div>
                          <div className="text-sm font-extrabold text-white mt-0.5">
                            {heroSnowStartText}
                          </div>
                        </div>

                        <div className="rounded-apple-inner bg-sky-500/15 border border-sky-300/35 p-3">
                          <div className="text-[10px] text-sky-200/80 flex items-center gap-1">
                            <Snowflake className="w-3 h-3 text-sky-300" /> Várható friss hó
                          </div>
                          <div className="text-sm font-extrabold text-sky-100 mt-0.5">
                            {heroFreshSnowText}
                          </div>
                        </div>

                        <div className="rounded-apple-inner bg-black/25 border border-white/10 p-3">
                          <div className="text-[10px] text-white/55 flex items-center gap-1">
                            <Layers3 className="w-3 h-3 text-indigo-300" /> Hóvastagság (csúcs)
                          </div>
                          <div className="text-base font-extrabold text-white mt-0.5">
                            {heroDepthText}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* B. Interaktív óránkénti grafikon */}
                  <SnowTimelineChart
                    hourlySeries={activeHourlySeries}
                    seriesLabel={activeModel ? activeModel.shortName : 'Konszenzus (medián)'}
                    horizonHours={horizonHours}
                    isConsensus={!activeModel}
                  />

                  {/* C. Modell-összehasonlítás és választó */}
                  <SnowModelComparison
                    models={models}
                    consensus={consensus}
                    horizonHours={horizonHours}
                    selectedModelId={activeModel ? activeModel.id : 'consensus'}
                    onSelectModel={setSelectedModelId}
                  />

                  {/* D. Hóvastagság és megmaradás */}
                  <SnowDepthRetentionCard
                    consensus={consensus}
                    selectedModel={activeModel}
                    horizonHours={horizonHours}
                    isConsensus={!activeModel}
                  />

                  {/* E. Meteorológiai értékelés + HungaroMet + Adatforrások */}
                  <SnowAssessmentCard
                    assessment={assessment}
                    officialWarnings={data.officialWarnings}
                    models={models}
                    selectedModel={activeModel}
                    horizonHours={horizonHours}
                    fetchedAtEpochMs={data.fetchedAtEpochMs}
                    cached={data.cached}
                    cacheAgeSec={data.cacheAgeSec}
                  />
                </>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalNode, document.body);
}

