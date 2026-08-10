import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ExternalLink, Mail, Globe, X } from 'lucide-react';
import { getSponsors } from '../api/supabase';

// SA software Developer Ad
const DEVELOPER_AD = {
  id: 'sa-software',
  isDeveloper: true,
  name: 'SA software',
  subtitle: '& Network Solutions',
  logo_url: '/sasoftware.png',
  description: 'Szeretne vállalkozásának egyedi, modern szoftvert vagy prémium, IT hálózatot? Olyan sikeres és ismert rendszereket terveztünk és építettünk, mint a VisitKőszeg, KőszegEats, TheTicket, VoltDesk és a KőszegWeather.',
  website_url: null,
  contact: 'koszegapp@gmail.com',
  services: [
    { title: 'Egyedi Szoftverek', desc: 'Üzleti rendszerek, web- és mobilalkalmazások fejlesztése.' },
    { title: 'Hotel IT & Rendszerek', desc: 'WiFi, IPTV és hálózati infrastruktúrák tervezése.' },
    { title: 'IT Szakértelem', desc: 'Több évtizedes szakmai háttér neves szállodaláncokban.' }
  ]
};

// Local mockup for Szendi Optika (per user request for local testing)
const MOCK_SZENDI = {
  id: 'szendi-optika-mock',
  name: 'Szendi Optika',
  logo_url: '/szendi-logo.png',
  description: 'Szendi Optika - Szakértelem és minőség Kőszegen. Szemüvegek, kontaktlencsék, látásvizsgálat és prémium optikai szolgáltatások.',
  website_url: 'https://www.szendioptika.hu/',
  contact: 'info@szendioptika.hu',
  active: true,
  expires_at: '2030-01-01T00:00:00.000Z'
};

export default function SponsorCard() {
  const [sponsors, setSponsors] = useState([MOCK_SZENDI, DEVELOPER_AD]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSponsor, setSelectedSponsor] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const fetched = await getSponsors();
        if (!alive) return;

        // Filter active & non-expired sponsors from database
        const nowStr = new Date().toISOString();
        const activeFetched = fetched.filter(s => 
          s.active && (!s.expires_at || s.expires_at > nowStr)
        );

        // Prepend our mockup and developer ad
        setSponsors([MOCK_SZENDI, DEVELOPER_AD, ...activeFetched]);
      } catch (err) {
        console.error('Sponsor list fetch failed:', err);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Cycle sponsors every 12 seconds if there are multiple sponsors
  useEffect(() => {
    if (sponsors.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sponsors.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [sponsors]);

  // Esc key handler for modal
  useEffect(() => {
    if (!selectedSponsor) return;
    const onKey = (e) => e.key === 'Escape' && setSelectedSponsor(null);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [selectedSponsor]);

  const currentSponsor = sponsors[currentIndex] || DEVELOPER_AD;
  const isSzendi = currentSponsor.name && currentSponsor.name.toLowerCase().includes('szendi');

  const handleCardClick = () => {
    if (isSzendi && currentSponsor.website_url) {
      window.open(currentSponsor.website_url, '_blank');
    } else {
      setSelectedSponsor(currentSponsor);
    }
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="glass-card rounded-apple-outer p-5 overflow-hidden relative cursor-pointer hover:bg-white/[0.05] active:scale-[0.995] transition-all duration-300"
      >
        {/* Soft colorful gradient glow */}
        <div
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none bg-cyan2-500"
        />

        <div className="relative flex items-start gap-4">
          {/* Logo container */}
          <div className="w-12 h-12 rounded-apple-inner bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
            {currentSponsor.logo_url ? (
              <img src={currentSponsor.logo_url} alt={currentSponsor.name} className="w-full h-full object-cover" />
            ) : (
              <Heart className="w-6 h-6 text-cyan2-300" />
            )}
          </div>

          {/* Texts */}
          <div className="min-w-0 flex-1 text-left">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-0.5 flex items-center gap-1.5">
              <span>Támogatóink</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan2-400 animate-ping inline-block" />
            </div>
            
            <h4 className="text-base font-extrabold text-white truncate leading-snug">
              {currentSponsor.name}
            </h4>
            
            <p className="text-[11px] text-white/70 leading-relaxed mt-1 line-clamp-2">
              {currentSponsor.description}
            </p>
          </div>
        </div>

        {/* Footer/Action */}
        <div className="relative mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
          <span className="text-[9px] font-bold text-cyan2-300 uppercase tracking-wider">
            {isSzendi ? 'Látogass el a weboldalra ➔' : 'Részletek megtekintése ➔'}
          </span>
          {currentSponsor.website_url && (
            <span className="text-[9px] font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1">
              {new URL(currentSponsor.website_url).hostname}
              <ExternalLink className="w-2.5 h-2.5" />
            </span>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedSponsor && (
            <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedSponsor(null)}
                className="absolute inset-0 bg-black/75 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 460, damping: 36, mass: 0.7 }}
                className="relative w-full max-w-lg bg-night-800 rounded-apple-outer border border-white/10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedSponsor(null)}
                  className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-rose-500 border border-white/20 text-white flex items-center justify-center transition-all active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Sponsor Flyer or big logo */}
                {selectedSponsor.flyer_url ? (
                  <div className="w-full bg-black/30 flex items-center justify-center max-h-[45vh] overflow-hidden">
                    <img src={selectedSponsor.flyer_url} alt={selectedSponsor.name} className="w-full h-auto object-contain" />
                  </div>
                ) : (
                  <div className="pt-8 pb-4 flex justify-center bg-white/[0.01]">
                    <div className="w-20 h-20 rounded-apple-card bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                      {selectedSponsor.logo_url ? (
                        <img src={selectedSponsor.logo_url} alt={selectedSponsor.name} className="w-full h-full object-cover" />
                      ) : (
                        <Heart className="w-8 h-8 text-cyan2-300" />
                      )}
                    </div>
                  </div>
                )}

                <div className="p-6 space-y-4 text-left overflow-y-auto max-h-[calc(85vh-160px)]">
                  <div className="text-center">
                    <h3 className="text-lg font-black text-white tracking-tight leading-snug">{selectedSponsor.name}</h3>
                    {selectedSponsor.subtitle && (
                      <p className="text-[9px] font-extrabold uppercase tracking-widest text-cyan2-300 mt-1">{selectedSponsor.subtitle}</p>
                    )}
                  </div>

                  <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">{selectedSponsor.description}</p>

                  {/* Developer Services */}
                  {selectedSponsor.isDeveloper && selectedSponsor.services && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                      {selectedSponsor.services.map((s) => (
                        <div key={s.title} className="p-2.5 rounded-apple-inner bg-white/[0.02] border border-white/5 space-y-1">
                          <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">{s.title}</h4>
                          <p className="text-[9px] text-white/60 leading-relaxed">{s.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 pt-3">
                    {selectedSponsor.contact && (
                      <a
                        href={selectedSponsor.contact.includes('@') ? `mailto:${selectedSponsor.contact}` : `tel:${selectedSponsor.contact.replace(/\s/g, '')}`}
                        className="btn-grad w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                      >
                        <Mail className="w-4 h-4" />
                        <span>
                          {selectedSponsor.isDeveloper ? 'Írj e-mailt a fejlesztőnek' : `Kapcsolat: ${selectedSponsor.contact}`}
                        </span>
                      </a>
                    )}

                    {selectedSponsor.website_url && (
                      <a
                        href={selectedSponsor.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-apple-inner bg-white/10 border border-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all active:scale-95"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Weboldal megnyitása</span>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
