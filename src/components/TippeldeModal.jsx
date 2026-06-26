import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, AlertCircle, Thermometer, User, Send, CheckCircle2 } from 'lucide-react';
import { submitPrediction, checkTippeldeAlreadyTipped, checkTippeldeNameTaken, getOrCreatePlayerId } from '../api/supabase';

// Dátum formázása magyarul (YYYY. MM. DD.)
function formatLocalDate(date) {
  return date.toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// Cél dátum kiszámítása (holnap)
function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

export default function TippeldeModal({ isOpen, onClose }) {
  const tomorrow = getTomorrowDate();
  const targetDateStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
  const targetDateFormatted = formatLocalDate(tomorrow);

  const [playerName, setPlayerName] = useState('');
  const [prediction, setPrediction] = useState(22.0); // alapértelmezett tipp
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [alreadyTipped, setAlreadyTipped] = useState(false);
  const [savedTip, setSavedTip] = useState(null);

  // Betöltéskor lekérjük az elmentett nevet és ellenőrizzük, tippelt-e már ma
  useEffect(() => {
    if (!isOpen) return;

    const savedName = localStorage.getItem('tippelde_player_name') || '';
    setPlayerName(savedName);

    // Adatbázis ellenőrzés (ha töröltük a DB-ből, de a kliens oldalon még megvan, akkor is engedjük újra)
    checkTippeldeAlreadyTipped(targetDateStr).then(dbTip => {
      if (dbTip) {
        setAlreadyTipped(true);
        setSavedTip(dbTip.prediction);
        localStorage.setItem('tippelde_last_tipped_date', targetDateStr);
        localStorage.setItem('tippelde_last_tipped_value', dbTip.prediction.toString());
      } else {
        // Ha az adatbázisban nincs, de a local storage szerint van, nézzük meg újra (offline fallback-nek)
        const lastTippedDate = localStorage.getItem('tippelde_last_tipped_date');
        const lastTippedValue = localStorage.getItem('tippelde_last_tipped_value');
        if (lastTippedDate === targetDateStr) {
          setAlreadyTipped(true);
          setSavedTip(lastTippedValue);
        } else {
          setAlreadyTipped(false);
          setSavedTip(null);
        }
      }
    }).catch(() => {
      // Offline fallback
      const lastTippedDate = localStorage.getItem('tippelde_last_tipped_date');
      const lastTippedValue = localStorage.getItem('tippelde_last_tipped_value');
      if (lastTippedDate === targetDateStr) {
        setAlreadyTipped(true);
        setSavedTip(lastTippedValue);
      } else {
        setAlreadyTipped(false);
        setSavedTip(null);
      }
    });

    setErrorMsg('');
    setIsSubmitted(false);
  }, [isOpen, targetDateStr]);

  // Billentyűzet kezelés + háttér görgetés letiltás
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Névfoglalás ellenőrzése
      const player_id = getOrCreatePlayerId();
      const nameTaken = await checkTippeldeNameTaken(playerName.trim(), player_id);
      if (nameTaken) {
        setErrorMsg('Ez a becenév már foglalt! Kérjük, válassz másikat!');
        setIsSubmitting(false);
        return;
      }

      // 2. Biztonsági ellenőrzés az adatbázisban is player_id alapon
      const dbTip = await checkTippeldeAlreadyTipped(targetDateStr);
      if (dbTip) {
        setErrorMsg('Már adtál le tippet a holnapi napra erről az eszközről!');
        setIsSubmitting(false);
        return;
      }

      // 3. Tipp mentése
      await submitPrediction(playerName.trim(), parseFloat(prediction), targetDateStr);

      // 4. LocalStorage frissítése
      localStorage.setItem('tippelde_player_name', playerName.trim());
      localStorage.setItem('tippelde_last_tipped_date', targetDateStr);
      localStorage.setItem('tippelde_last_tipped_value', prediction.toFixed(1));

      setSavedTip(prediction.toFixed(1));
      setIsSubmitted(true);
      setAlreadyTipped(true);
    } catch (err) {
      console.error(err);
      setErrorMsg('Nem sikerült beküldeni a tippet. Kérjük, próbáld újra!');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: 'spring', stiffness: 440, damping: 34, mass: 0.7 }}
          className="relative w-full max-w-sm bg-night-800 rounded-apple-outer border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header gradient bar */}
          <div className="h-2 w-full shrink-0 bg-brand-gradient" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 z-20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="p-6 space-y-4">
            
            {/* Header info */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-apple-inner bg-cyan2-500/10 flex items-center justify-center text-cyan2-400">
                <Thermometer className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Holnapi Tippelde</h3>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Időjárás Jósda 🔮</p>
              </div>
            </div>

            {/* Explanatory text */}
            <p className="text-xs text-white/70 leading-relaxed text-left">
              Mekkora lesz a legmagasabb hőmérséklet a holnapi napon (<strong>{targetDateFormatted}</strong>)? 🌡️
            </p>

            {/* ALREADY TIPPED OR SUBMITTED STATE */}
            {alreadyTipped ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-apple-card flex items-start gap-2.5 text-left text-emerald-300 text-xs">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  <div>
                    <strong className="block text-white mb-0.5">Sikeresen leadtad a mai tippedet!</strong>
                    Holnapra ({targetDateFormatted}) leadott tipped: <strong className="text-white text-sm">{savedTip} °C</strong>.
                  </div>
                </div>
                <p className="text-[10px] text-white/50 italic leading-normal">
                  *Naponta csak egy tippet adhatsz le. Másnap, miután lezárjuk a méréseket, láthatod az eredményedet a dicsőségfalon!
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-3.5 bg-white/10 hover:bg-white/15 text-white rounded-apple-inner text-xs font-bold transition-all"
                >
                  Bezárás
                </button>
              </div>
            ) : (
              /* INPUT FORM STATE */
              <form onSubmit={handleSubmit} className="space-y-4 text-left pt-1">
                
                {/* Name field */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1">
                    <User className="w-3 h-3 text-cyan2-400" /> Beceneved
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    placeholder="Pl.: Laci, Szili"
                    className="w-full px-4 py-3 rounded-apple-inner border border-white/10 bg-white/[0.04] text-white text-xs font-semibold placeholder:text-night-200/35 focus:outline-none focus:ring-2 focus:ring-cyan2-400/50"
                  />
                </div>

                {/* Prediction slider / indicator */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-white/50 uppercase tracking-widest flex items-center justify-between">
                    <span>Holnapi Max Hőmérséklet Tipp</span>
                    <span className="text-sm font-black text-cyan2-300 bg-cyan2-500/10 px-2 py-0.5 rounded-full">{prediction.toFixed(1)} °C</span>
                  </label>
                  
                  {/* Slider with +/- buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPrediction(prev => Math.max(-10, parseFloat((prev - 0.1).toFixed(1))))}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white font-extrabold text-sm select-none shrink-0 transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="-10.0"
                      max="45.0"
                      step="0.1"
                      value={prediction}
                      onChange={e => setPrediction(parseFloat(e.target.value))}
                      className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan2-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setPrediction(prev => Math.min(45, parseFloat((prev + 0.1).toFixed(1))))}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white font-extrabold text-sm select-none shrink-0 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="flex justify-between text-[8px] font-bold text-white/30 uppercase tracking-widest px-1">
                    <span>-10 °C</span>
                    <span>17.5 °C</span>
                    <span>45 °C</span>
                  </div>
                </div>

                {/* Rules Alert box */}
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-apple-card flex gap-2 text-[10px] text-white/60 leading-normal">
                  <HelpCircle className="w-4 h-4 shrink-0 text-cyan2-300" />
                  <div>
                    <strong className="text-white block mb-0.5">Pontozás szabályai:</strong>
                    Tökéletes egyezésért <strong>15 pont</strong> jár. <br/>
                    ±0.2 °C eltérés: 10p · ±0.5 °C: 8p · ±1.0 °C: 5p · ±2.0 °C: 2p. Minden tippért jár 1 részvételi pont!
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-xs text-rose-300 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> {errorMsg}
                  </p>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !playerName.trim()}
                  className="btn-grad w-full py-3.5 text-xs font-bold uppercase tracking-wider rounded-apple-inner flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Tipp mentése...' : 'Tipp leadása! 🔮'}
                </button>

              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
