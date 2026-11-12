import React from 'react';
import { Heart } from 'lucide-react';
import SponsorCard from './SponsorCard';

// Egyetlen csempébe zárt támogatói blokk a főoldal alján (a footer fölött):
// felül a forgó kiemelt támogató (SponsorCard), alatta az aktív támogatók listája.
export default function SponsorTile({ sponsors = [] }) {
  return (
    <section className="glass-card rounded-apple-outer p-4 sm:p-5 overflow-hidden" aria-label="Támogatóink">
      <h3 className="text-[11px] font-extrabold text-white uppercase tracking-widest flex items-center gap-2 mb-3">
        <Heart className="w-3.5 h-3.5 text-rose-300" />
        Támogatóink
      </h3>

      <SponsorCard embedded />

      {sponsors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-[9px] font-extrabold text-cyan2-300 uppercase tracking-widest mb-2">
            Akik segítik az időjárás állomás fenntartását
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sponsors.map(sp => (
              <a
                key={sp.id}
                href={sp.website_url || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2 rounded-apple-inner bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-cyan2-400/20 transition-all"
                title={sp.description || sp.name}
              >
                <img src={sp.logo_url} alt="" loading="lazy" className="w-7 h-7 rounded-md object-cover shrink-0" />
                <span className="text-xs font-bold text-white truncate">{sp.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
