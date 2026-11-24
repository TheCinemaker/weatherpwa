import { useState } from 'react';
import { Snowflake, ChevronRight } from 'lucide-react';
import SnowForecastModal from './SnowForecastModal';

export default function SnowForecastEntry({ currentTemp = null }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-left rounded-apple-card glass-card px-4 py-3 border border-sky-300/25 hover:border-sky-300/50 transition-all active:scale-[0.99] flex items-center justify-between gap-3 group"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(56, 189, 248, 0.14), rgba(15, 23, 42, 0.45))',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-apple-inner bg-sky-400/20 border border-sky-300/35 flex items-center justify-center text-sky-200 shrink-0 group-hover:scale-105 transition-transform">
              <Snowflake className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <span className="block text-xs font-black uppercase tracking-wider text-sky-100">
                HÓELŐREJELZÉS
              </span>
              <span className="block text-[11px] font-semibold text-white/70 truncate">
                Többmodellű elemzés · ICON-D2 · ICON-EU · ECMWF · GFS
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-200 shrink-0">
            <span className="hidden sm:inline">Megnyitás</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>
      </div>

      <SnowForecastModal
        isOpen={open}
        onClose={() => setOpen(false)}
        currentTemp={currentTemp}
      />
    </>
  );
}

