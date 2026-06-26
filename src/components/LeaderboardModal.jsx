import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Award, Target, Gamepad2 } from 'lucide-react';
import { getQuizLeaderboard, getTippeldeLeaderboard, getActiveTippeldePredictions, getOrCreatePlayerId } from '../api/supabase';

export default function LeaderboardModal({ isOpen, onClose, onOpenQuiz, onOpenTippelde }) {
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' | 'tippelde'
  const [tippeldeRange, setTippeldeRange] = useState('active'); // 'active' | 'weekly' | 'all'
  const [quizList, setQuizList] = useState([]);
  const [tippeldeAllList, setTippeldeAllList] = useState([]);
  const [tippeldeWeeklyList, setTippeldeWeeklyList] = useState([]);
  const [tippeldeActiveList, setTippeldeActiveList] = useState([]);
  const [loading, setLoading] = useState(false);

  const myPlayerId = getOrCreatePlayerId();

  // Ranglisták betöltése
  useEffect(() => {
    if (!isOpen) return;
    
    setLoading(true);
    Promise.all([
      getQuizLeaderboard(10),
      getTippeldeLeaderboard('all', 10),
      getTippeldeLeaderboard('weekly', 10),
      getActiveTippeldePredictions()
    ]).then(([quizData, tippeldeAll, tippeldeWeekly, tippeldeActive]) => {
      setQuizList(quizData);
      setTippeldeAllList(tippeldeAll);
      setTippeldeWeeklyList(tippeldeWeekly);
      setTippeldeActiveList(tippeldeActive);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [isOpen]);

  // Esc gomb bezárás + görgetés tiltás
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

  if (!isOpen) return null;

  const currentTippeldeList = 
    tippeldeRange === 'weekly' 
      ? tippeldeWeeklyList 
      : tippeldeRange === 'all' 
        ? tippeldeAllList 
        : tippeldeActiveList;

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
          className="relative w-full max-w-md bg-night-800 rounded-apple-outer border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
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

          {/* Header */}
          <div className="p-5 pb-3 flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-apple-inner bg-cyan2-500/10 flex items-center justify-center text-cyan2-400">
              <Gamepad2 className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Kőszegi Játékok</h3>
              <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Ranglisták és Játék indítása 🎮</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-5 pb-2 shrink-0">
            <div className="flex bg-white/[0.04] p-1 rounded-apple-inner border border-white/5">
              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex-1 py-2 text-xs font-bold rounded-apple-inner transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'quiz' ? 'bg-cyan2-500 text-white shadow-sm' : 'text-white/60 hover:text-white'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Kvíz Bajnokok</span>
              </button>
              <button
                onClick={() => setActiveTab('tippelde')}
                className={`flex-1 py-2 text-xs font-bold rounded-apple-inner transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'tippelde' ? 'bg-cyan2-500 text-white shadow-sm' : 'text-white/60 hover:text-white'
                }`}
              >
                <Target className="w-4 h-4" />
                <span>Tippelde</span>
              </button>
            </div>
          </div>

          {/* Leaderboard content */}
          <div className="p-5 pt-2 overflow-y-auto flex-1 text-left min-h-[250px]">
            
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-cyan2-400 border-t-transparent animate-spin" />
                <span className="text-xs font-bold text-white/50">Eredmények betöltése…</span>
              </div>
            ) : activeTab === 'quiz' ? (
              
              /* QUIZ LEADERBOARD */
              <div className="space-y-3">
                <button
                  onClick={onOpenQuiz}
                  className="w-full py-3 bg-brand-gradient hover:brightness-110 active:scale-[0.98] text-white rounded-apple-inner text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-glow"
                >
                  <Award className="w-4 h-4" />
                  <span>Kvíz indítása 🧠</span>
                </button>

                {quizList.length === 0 ? (
                  <div className="text-center py-12 text-xs text-white/50">Nincsenek még eredmények. Légy te az első!</div>
                ) : (
                  <div className="overflow-hidden border border-white/5 rounded-apple-card bg-white/[0.01]">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-white/[0.03] text-[9px] font-bold text-white/50 uppercase tracking-widest border-b border-white/5">
                          <th className="py-2.5 px-3.5 text-center w-12">Hely</th>
                          <th className="py-2.5 px-3">Név</th>
                          <th className="py-2.5 px-3 text-center">Pontszám</th>
                          <th className="py-2.5 px-3.5 text-right w-16">Idő</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-semibold text-white/90">
                        {quizList.map((item, idx) => {
                          const rank = idx + 1;
                          const rankDisplay = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
                          const isMe = item.player_id === myPlayerId;
                          return (
                            <tr key={item.id} className={`transition-colors ${isMe ? 'bg-emerald-500/10 border-l-2 border-emerald-500 hover:bg-emerald-500/15' : 'hover:bg-white/[0.02]'}`}>
                              <td className="py-3 px-3.5 text-center font-bold text-cyan2-300 text-sm">{rankDisplay}</td>
                              <td className={`py-3 px-3 truncate max-w-[170px] ${isMe ? 'text-emerald-300 font-extrabold' : ''}`} title={item.name}>
                                {item.name}
                                {isMe && <span className="text-[8px] font-black uppercase text-emerald-400 ml-1.5 tracking-wider">(Te)</span>}
                              </td>
                              <td className="py-3 px-3 text-center font-black text-white">{item.score} / 5</td>
                              <td className="py-3 px-3.5 text-right text-white/60 font-bold">{item.time_seconds}s</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            ) : (
              
              /* TIPPELDE LEADERBOARD */
              <div className="space-y-3">
                <button
                  onClick={onOpenTippelde}
                  className="w-full py-3 bg-brand-gradient hover:brightness-110 active:scale-[0.98] text-white rounded-apple-inner text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-glow"
                >
                  <Target className="w-4 h-4" />
                  <span>Tippelek holnapra 🌡️</span>
                </button>

                {/* Range Selector */}
                <div className="flex justify-end gap-1.5 mb-2 select-none">
                  <button
                    onClick={() => setTippeldeRange('active')}
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border ${
                      tippeldeRange === 'active'
                        ? 'bg-cyan2-500/20 border-cyan2-400/40 text-cyan2-300'
                        : 'border-white/5 text-white/50 hover:text-white'
                    }`}
                  >
                    Aktív tippek
                  </button>
                  <button
                    onClick={() => setTippeldeRange('weekly')}
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border ${
                      tippeldeRange === 'weekly'
                        ? 'bg-cyan2-500/20 border-cyan2-400/40 text-cyan2-300'
                        : 'border-white/5 text-white/50 hover:text-white'
                    }`}
                  >
                    Heti
                  </button>
                  <button
                    onClick={() => setTippeldeRange('all')}
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border ${
                      tippeldeRange === 'all'
                        ? 'bg-cyan2-500/20 border-cyan2-400/40 text-cyan2-300'
                        : 'border-white/5 text-white/50 hover:text-white'
                    }`}
                  >
                    Összesített
                  </button>
                </div>

                {currentTippeldeList.length === 0 ? (
                  <div className="text-center py-12 text-xs text-white/50">
                    {tippeldeRange === 'active' 
                      ? 'Nincsenek aktív tippek a holnapi napra. Tippelj te elsőként!' 
                      : 'Nincsenek még tippelde pontok ebben az időszakban.'}
                  </div>
                ) : (
                  <div className="overflow-hidden border border-white/5 rounded-apple-card bg-white/[0.01]">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-white/[0.03] text-[9px] font-bold text-white/50 uppercase tracking-widest border-b border-white/5">
                          <th className="py-2.5 px-3.5 text-center w-12">{tippeldeRange === 'active' ? '#' : 'Hely'}</th>
                          <th className="py-2.5 px-3">Játékos</th>
                          {tippeldeRange === 'active' ? (
                            <>
                              <th className="py-2.5 px-3 text-center">Tipp</th>
                              <th className="py-2.5 px-3.5 text-right w-24">Cél dátum</th>
                            </>
                          ) : (
                            <>
                              <th className="py-2.5 px-3 text-center">Pontszám</th>
                              <th className="py-2.5 px-3.5 text-right w-20">Tippek</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-semibold text-white/90">
                        {currentTippeldeList.map((item, idx) => {
                          const rank = idx + 1;
                          const rankDisplay = tippeldeRange === 'active' 
                            ? `${rank}.` 
                            : rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
                          const isMe = item.player_id === myPlayerId;
                          return (
                            <tr key={item.player_id || item.id || item.name + idx} className={`transition-colors ${isMe ? 'bg-emerald-500/10 border-l-2 border-emerald-500 hover:bg-emerald-500/15' : 'hover:bg-white/[0.02]'}`}>
                              <td className="py-3 px-3.5 text-center font-bold text-cyan2-300 text-sm">{rankDisplay}</td>
                              <td className={`py-3 px-3 truncate max-w-[170px] ${isMe ? 'text-emerald-300 font-extrabold' : ''}`} title={item.name}>
                                {item.name}
                                {isMe && <span className="text-[8px] font-black uppercase text-emerald-400 ml-1.5 tracking-wider">(Te)</span>}
                              </td>
                              {tippeldeRange === 'active' ? (
                                <>
                                  <td className="py-3 px-3 text-center font-black text-cyan2-300">{item.prediction.toFixed(1)} °C</td>
                                  <td className="py-3 px-3.5 text-right text-white/60 font-bold">
                                    {new Date(item.target_date).toLocaleDateString('hu-HU', { month: '2-digit', day: '2-digit' })}
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="py-3 px-3 text-center font-black text-amber-300">{item.points} p</td>
                                  <td className="py-3 px-3.5 text-right text-white/60 font-bold">{item.predictions_count} db</td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            )}

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
