import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import WeatherDashboard from './pages/WeatherDashboard/WeatherDashboard';
import Forecast from './pages/Forecast/Forecast';
import Reels from './pages/Reels/Reels';
import Cameras from './pages/Cameras/Cameras';
import Sponsors from './pages/Sponsors/Sponsors';
import About from './pages/About/About';
import Radar from './pages/Radar/Radar';
import { CloudSun, Calendar, Info, Download, Film, Camera, Menu, X, Heart, AlertTriangle, Map, Gamepad2, Sparkles } from 'lucide-react';
import Logo from './components/Logo';
import brandWeatherIcon from '@meteocons/svg/fill/partly-cloudy-day.svg?url';
import { getTodayNameday, buildMenuStories, fetchTodayWikiStories } from './utils/dailyAlmanac';
import { AdminProvider, useAdminRequest } from './components/AdminContext';
import { useAdminLongPress, AdminHoldBar } from './components/AdminLongPress';
import { incrementPageViews, getForecast } from './api/supabase';
import PushNotificationButton from './components/PushNotificationButton';
import PushAlertModal from './components/PushAlertModal';
import QuizModal from './components/QuizModal';
import LeaderboardModal from './components/LeaderboardModal';
import TippeldeModal from './components/TippeldeModal';
import { WeatherMoodProvider, useWeatherMood } from './components/WeatherMoodContext';

const NAV_ITEMS = [
  { path: '/', label: 'Élő Mérések', icon: CloudSun },
  { path: '/forecast', label: 'Előrejelzés', icon: Calendar },
  { path: '/radar', label: 'Radar & Felhők', icon: Map },
  { path: '/reels', label: 'Reels', icon: Film },
  { path: '/cameras', label: 'Kamerák', icon: Camera },
  { path: '/sponsors', label: 'Támogatók', icon: Heart },
  { path: '/about', label: 'Rólam', icon: Info },
];

// Látogatószámláló: a menü nyitásakor felpörög a végső értékig, számjegyenként
// külön kis "kilométeróra" cellában.
function VisitorCounter({ value }) {
  const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    if (reduceMotion) return undefined;
    let raf;
    const start = performance.now();
    const duration = 900;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setAnimated(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduceMotion]);

  const shown = reduceMotion ? value : animated;
  const len = String(value).length;
  const digits = String(shown).padStart(len, '0').split('');

  return (
    <span className="relative flex items-center" aria-label={`${value.toLocaleString('hu-HU')} látogató`}>
      {digits.map((d, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`w-[20px] h-7 flex items-center justify-center rounded-md bg-black/45 border border-white/10 text-base font-black text-white tabular-nums ${
            i > 0 && (len - i) % 3 === 0 ? 'ml-1.5' : 'ml-0.5'
          }`}
        >
          {d}
        </span>
      ))}
    </span>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const mood = useWeatherMood();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const todayNameday = getTodayNameday();
  const [wikiStories, setWikiStories] = useState([]);
  const menuStories = React.useMemo(() => {
    const base = buildMenuStories();
    if (!wikiStories.length) return base;
    const merged = [];
    const maxLen = Math.max(base.length, wikiStories.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < base.length) merged.push(base[i]);
      if (i < wikiStories.length) merged.push(wikiStories[i]);
    }
    return merged;
  }, [wikiStories]);
  const [storyIndex, setStoryIndex] = useState(() => Math.floor(Math.random() * 10));

  useEffect(() => {
    fetchTodayWikiStories().then((items) => {
      if (items.length > 0) setWikiStories(items);
    });
  }, []);
  
  // Custom features states
  const [viewCount, setViewCount] = useState(null);
  const [announcement, setAnnouncement] = useState({ text: '', active: false });
  const [showAnnBanner, setShowAnnBanner] = useState(false);
  const [pushAlert, setPushAlert] = useState(null);

  // Játékok states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showTippeldeModal, setShowTippeldeModal] = useState(false);

  // Scroll to top state
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const checkScrollTop = () => {
      if (window.scrollY > 300) {
        setShowScroll(true);
      } else {
        setShowScroll(false);
      }
    };
    window.addEventListener('scroll', checkScrollTop);
    return () => window.removeEventListener('scroll', checkScrollTop);
  }, []);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Kvíz megnyitása egyedi esemény alapján (Szélsebesség kártyáról)
  useEffect(() => {
    const handleOpenQuiz = () => setShowQuizModal(true);
    window.addEventListener('open-quiz', handleOpenQuiz);
    return () => window.removeEventListener('open-quiz', handleOpenQuiz);
  }, []);

  // Tippelde megnyitása egyedi esemény alapján
  useEffect(() => {
    const handleOpenTippelde = () => setShowTippeldeModal(true);
    window.addEventListener('open-tippelde', handleOpenTippelde);
    return () => window.removeEventListener('open-tippelde', handleOpenTippelde);
  }, []);

  // Admin belépés a logóra: 3 mp nyomás → PIN-kapu (globális kontextus).
  const requestAdmin = useAdminRequest();
  const logoPressFired = React.useRef(false);
  const { progress: holdProgress, handlers: logoHoldHandlers } = useAdminLongPress(
    () => { logoPressFired.current = true; setTimeout(() => { logoPressFired.current = false; }, 600); requestAdmin(); }
  );
  // A logó egyben „Főoldal" link is; hosszú nyomás után a kattintást elnyeljük,
  // hogy ne navigáljon el (különben az admin az aktuális oldalon nem nyílna).
  const handleLogoClick = (e) => {
    if (logoPressFired.current) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    // 0. Check query params for push alert click
    const params = new URLSearchParams(window.location.search);
    if (params.get('alert') === 'true') {
      const title = params.get('title') || 'Riasztás - Kőszeg';
      const body = params.get('body');
      if (body) {
        setPushAlert({ title, body });
        // Clean URL query parameters
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }

    // 1. Register PWA install prompt
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setShowInstallBtn(true); };
    window.addEventListener('beforeinstallprompt', handler);

    // 2. Increment and get page views
    incrementPageViews().then(count => {
      if (count > 0) setViewCount(count);
    });

    // 3. Check for active announcements
    getForecast().then(data => {
      if (data.announcement_active && data.announcement_text) {
        setAnnouncement({ text: data.announcement_text, active: true });
        
        // Only show if not dismissed in this session
        const dismissed = sessionStorage.getItem('dismissed_announcement');
        if (dismissed !== data.announcement_text) {
          setShowAnnBanner(true);
          
          // Trigger system notification if granted
          if ('Notification' in window && Notification.permission === 'granted') {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(reg => {
                reg.showNotification('Kőszegi Időjárás Figyelmeztetés', {
                  body: data.announcement_text,
                  icon: '/favicon.png'
                });
              }).catch(err => {
                console.error('Failed to show notification via Service Worker:', err);
              });
            }
          }
        }
      }
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Útvonalváltáskor zárjuk a menüt + lapozzunk a tetejére
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Drawer nyitva: háttér-görgetés tiltása
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const handleDismissBanner = () => {
    setShowAnnBanner(false);
    sessionStorage.setItem('dismissed_announcement', announcement.text);
  };

  return (
    <div
      className="relative min-h-screen text-night-100 font-sans overflow-x-hidden"
      style={mood.enabled ? {
        '--accent-from': mood.from,
        '--accent-to': mood.to,
        '--mood-glow-1': mood.glow1,
        '--mood-glow-2': mood.glow2,
      } : undefined}
    >

      <AdminHoldBar progress={holdProgress} />

      {/* --- NIGHT-SKY BACKGROUND --- */}
      {/* Az ambient glow-k is a pillanatnyi időjárás-hangulatot követik (ha a
          kapcsoló be van kapcsolva) — hideg-kékes fagyban, meleg-vöröses kánikulában. */}
      <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: 'linear-gradient(165deg, #111827 0%, #000000 100%)' }}>
        <div className="absolute inset-0 starfield opacity-20" />
        <div
          className="blob w-[45rem] h-[45rem] -top-40 -left-40 bg-teal2-500/25 animate-blob"
          style={mood.enabled ? { background: mood.glow1 } : undefined}
        />
        <div
          className="blob w-[40rem] h-[40rem] top-1/3 -right-40 bg-cyan2-500/25 animate-blob"
          style={{ animationDelay: '3s', ...(mood.enabled ? { background: mood.glow2 } : {}) }}
        />
        <div
          className="blob w-[34rem] h-[34rem] bottom-0 left-1/4 bg-indigo2-500/20 animate-blob"
          style={{ animationDelay: '6s', ...(mood.enabled ? { background: mood.glow3 } : {}) }}
        />
      </div>

      {/* --- IN-APP ANNOUNCEMENT BANNER --- */}
      <AnimatePresence>
        {showAnnBanner && (
          <motion.div 
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-0 inset-x-0 z-[150] px-4 pt-4 pb-2 pointer-events-none flex justify-center"
          >
            <div className="pointer-events-auto w-full max-w-xl p-4 rounded-apple-card bg-rose-500/90 text-white backdrop-blur-md border border-rose-400/30 flex items-start justify-between gap-3 shadow-lg shadow-rose-950/40">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-apple-inner bg-white/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div className="leading-snug">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-rose-100 block">Sürgős figyelmeztetés</span>
                  <p className="text-xs font-bold mt-0.5">{announcement.text}</p>
                </div>
              </div>
              <button 
                onClick={handleDismissBanner} 
                className="w-7 h-7 rounded-apple-inner bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0 text-white"
                aria-label="Bezárás"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DESKTOP SIDEBAR RAIL --- */}
      <aside className="hidden lg:flex fixed top-0 left-0 z-40 h-screen w-64 flex-col p-4">
        <div className="flex-1 flex flex-col glass-card rounded-apple-outer p-5 overflow-y-auto no-scrollbar">
          <Link to="/" onClick={handleLogoClick} onContextMenu={(e) => e.preventDefault()} className="flex items-center gap-3 mb-6 select-none active:scale-95 transition-transform" style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}>
            <motion.div
              {...logoHoldHandlers}
              className="touch-none w-11 h-11 rounded-apple-inner bg-brand-gradient bg-[length:200%_200%] animate-gradient-pan flex items-center justify-center text-white shadow-glow"
            >
              <Logo className="w-6 h-6" />
            </motion.div>
            <div className="leading-tight select-none">
              <h1 className="text-[13px] font-black tracking-tight text-white leading-none">
                <span className="text-cyan2-300">K</span>őszegi
              </h1>
              <div className="text-[10px] font-bold text-white/90 uppercase tracking-wide leading-none mt-0.5">
                <span className="text-cyan2-300">I</span>dőjárás
              </div>
              <div className="text-[9px] font-bold text-white/60 uppercase tracking-wider leading-none mt-0.5">
                <span className="text-cyan2-300">E</span>lőrejelzés
              </div>
            </div>
          </Link>

          <nav className="flex flex-col gap-1.5">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link key={path} to={path}
                  className={`relative flex items-center gap-3 px-4 py-2.5 rounded-apple-inner text-sm font-bold transition-all ${active ? 'text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>
                  {active && (
                    <motion.span layoutId="nav-active-desktop" className="absolute inset-0 rounded-apple-inner bg-brand-gradient shadow-glow" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                  )}
                  <Icon className="w-[18px] h-[18px] shrink-0 relative z-10" />
                  <span className="relative z-10">{label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => setShowLeaderboardModal(true)}
              className="relative flex items-center gap-3 px-4 py-2.5 rounded-apple-inner text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white transition-all text-left w-full"
            >
              <Gamepad2 className="w-[18px] h-[18px] shrink-0 relative z-10 text-cyan2-400" />
              <span className="relative z-10">Játékok</span>
            </button>
          </nav>

          {/* Napi kalendárium / Sztorikártya asztali oldalsávban is */}
          {menuStories.length > 0 && (() => {
            const currentStory = menuStories[storyIndex % menuStories.length];
            return (
              <button
                type="button"
                onClick={() => setStoryIndex(i => i + 1)}
                className="relative mt-3 w-full text-left rounded-apple-inner glass-card p-3 overflow-hidden active:scale-[0.98] transition-transform"
              >
                {mood.enabled && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: `linear-gradient(135deg, ${mood.glow2}, transparent 80%)` }}
                  />
                )}
                <div className="relative flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                    Mai névnap
                  </span>
                  <span
                    className="text-xs font-extrabold truncate"
                    style={{ color: mood.enabled ? mood.from : '#67e8f9' }}
                  >
                    {todayNameday}
                  </span>
                </div>
                <div className="relative flex items-center justify-between gap-1.5 mb-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-white/80">
                    <Sparkles
                      className="w-3 h-3 shrink-0"
                      style={{ color: mood.enabled ? mood.from : '#67e8f9' }}
                    />
                    {currentStory.tag}
                  </span>
                  <span className="text-[9px] font-bold text-white/55">koppints →</span>
                </div>
                <p className="relative text-xs font-semibold text-white leading-relaxed">
                  {currentStory.text}
                </p>
              </button>
            );
          })()}

          <div className="mt-auto pt-4 space-y-3.5">
            {/* Web Push Notification Button */}
            <PushNotificationButton mode="desktop" />

            {showInstallBtn && (
              <button onClick={handleInstall} className="btn-grad w-full py-2.5 text-xs">
                <Download className="w-4 h-4" /> Telepítés
              </button>
            )}

            <button
              onClick={() => mood.setEnabled(e => !e)}
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-apple-inner bg-white/[0.04] border border-white/10 text-left w-full"
            >
              <span className="text-xs font-bold text-white/80">Időjárás-hangulat</span>
              <span className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${mood.enabled ? 'bg-emerald-500' : 'bg-white/15'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${mood.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </span>
            </button>

            <div className="flex flex-col gap-2.5">
              {viewCount !== null && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                    Látogatók: <span className="text-cyan2-400">{viewCount.toLocaleString('hu-HU')}</span>
                  </span>
                </div>
              )}
              <p className="text-[10px] font-semibold text-white/50 leading-relaxed">
                © 2026 · Ráduly László · v3.0.1
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MOBILE TOP BAR + HAMBURGER (fixen rögzítve, alatta görög minden) ---
          Majdnem az oldal szélén/tetején (5px margó), kevésbé lekerekített,
          visszafogottabb (áttetszőbb) glass háttér, mint a lenti csempék. */}
      <header className="lg:hidden fixed top-[5px] inset-x-[5px] z-40 pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-between pl-2.5 pr-2.5 py-2 rounded-apple-card bg-black/22 backdrop-blur-2xl border border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Web Push Notification Button on the LEFT side */}
            <PushNotificationButton mode="mobile" />

            {/* FIGYELEM: admin belépés — hosszú nyomás a logón. Ne töröld az onClick/onContextMenu/style
                attribútumokat a Link-ről, se a motion.div touch-none class-t és a {...logoHoldHandlers} szórást,
                csak a vizuális (szín/méret) osztályokat módosítsd! */}
            <Link to="/" onClick={handleLogoClick} onContextMenu={(e) => e.preventDefault()} className="flex items-center gap-2.5 active:scale-95 transition-transform min-w-0" style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}>
              <motion.div
                {...logoHoldHandlers}
                className="touch-none relative w-10 h-10 rounded-apple-inner flex items-center justify-center shrink-0 bg-white/[0.06] ring-1 ring-white/10"
              >
                <img src={brandWeatherIcon} alt="Kőszegi Időjárás" className="w-9 h-9" />
              </motion.div>
              <span className="block text-[11px] xs:text-[12px] sm:text-[13px] font-black tracking-tight text-white whitespace-nowrap leading-none min-w-0 truncate">
                Kőszegi Időjárás Előrejelzés
              </span>
            </Link>
          </div>

          <button
            onClick={() => { setStoryIndex(i => i + 1); setMenuOpen(true); }}
            className="w-10 h-10 flex items-center justify-center rounded-apple-inner text-white active:scale-95 transition-all shrink-0 ml-2 ring-1 ring-white/10"
            style={{
              background: mood.enabled
                ? `linear-gradient(135deg, ${mood.from}, ${mood.to})`
                : 'linear-gradient(135deg, #64748b, #1e293b)',
            }}
            aria-label="Menü megnyitása"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* --- MOBILE DRAWER (framer-motion) --- */}
      <AnimatePresence>
        {menuOpen && (
          <div className="lg:hidden fixed inset-0 z-[100]">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
              transition={{ duration: 0.18 }}
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }}
              exit={{ x: '100%', transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
              transition={{ type: 'spring', stiffness: 480, damping: 42, mass: 0.7 }}
              className="absolute top-0 right-0 h-full w-[78%] max-w-[19rem] p-[5px]"
            >
              {/* A menü a dashboard nyelvét beszéli: csempe-rács (2 oszlop), hangulat-szín,
                  ugyanaz a márka-ikon és sarok-lekerekítés, mint a fejlécben. */}
              <div className="h-full flex flex-col glass-card rounded-apple-card p-3 overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-apple-inner bg-white/[0.06] ring-1 ring-white/10 flex items-center justify-center shrink-0">
                      <img src={brandWeatherIcon} alt="" className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-black tracking-tight text-white leading-tight select-none">
                      Kőszegi Időjárás<br />Előrejelzés
                    </span>
                  </div>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="w-9 h-9 flex items-center justify-center rounded-apple-inner bg-white/[0.08] ring-1 ring-white/10 text-white active:scale-95 shrink-0"
                    aria-label="Bezárás"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Látogatószám — kompakt, egysoros elrendezésben */}
                {viewCount !== null && (
                  <div className="relative rounded-apple-inner glass-card px-3 py-2 mb-2 flex items-center justify-between gap-2 overflow-hidden">
                    {mood.enabled && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: `linear-gradient(135deg, ${mood.glow1}, transparent 75%)` }}
                      />
                    )}
                    <span className="relative flex items-center gap-1.5 text-[10px] font-bold text-white/75 uppercase tracking-wider shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Látogatók
                    </span>
                    <div className="relative">
                      <VisitorCounter value={viewCount} />
                    </div>
                  </div>
                )}

                <nav className="flex flex-col gap-1">
                  {[
                    ...NAV_ITEMS.map(item => ({ ...item, key: item.path })),
                    { key: 'games', label: 'Játékok', icon: Gamepad2, onClick: () => { setMenuOpen(false); setShowLeaderboardModal(true); } },
                  ].map(({ key, path, label, icon: Icon, onClick }, i) => {
                    const active = path != null && location.pathname === path;
                    const activeText = mood.enabled ? mood.textOnAccent : '#ffffff';
                    const tileClass = 'relative flex items-center gap-2.5 w-full px-3 py-2 rounded-apple-inner text-left overflow-hidden transition-transform active:scale-[0.98] ' + (active ? '' : 'glass-card');
                    const tileStyle = active
                      ? { background: mood.enabled ? `linear-gradient(135deg, ${mood.from}, ${mood.to})` : 'linear-gradient(135deg, #0284c7, #06b6d4)', color: activeText }
                      : undefined;
                    const content = (
                      <>
                        <Icon
                          className="w-[18px] h-[18px] shrink-0"
                          style={{ color: active ? activeText : (mood.enabled ? mood.from : 'rgba(255,255,255,0.7)') }}
                        />
                        <span className="text-[13px] font-bold leading-tight" style={{ color: active ? activeText : '#ffffff' }}>
                          {label}
                        </span>
                      </>
                    );
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.03 + i * 0.025, duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {path != null ? (
                          <Link to={path} className={tileClass} style={tileStyle}>{content}</Link>
                        ) : (
                          <button onClick={onClick} className={tileClass} style={tileStyle}>{content}</button>
                        )}
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Napi kalendárium: Névnap + váltakozó visszaszámláló / kőszegi sztori */}
                {menuStories.length > 0 && (() => {
                  const currentStory = menuStories[storyIndex % menuStories.length];
                  return (
                    <button
                      type="button"
                      onClick={() => setStoryIndex(i => i + 1)}
                      className="relative mt-2.5 w-full text-left rounded-apple-inner glass-card p-3.5 overflow-hidden active:scale-[0.98] transition-transform"
                    >
                      {mood.enabled && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{ background: `linear-gradient(135deg, ${mood.glow2}, transparent 80%)` }}
                        />
                      )}
                      <div className="relative flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                          Mai névnap
                        </span>
                        <span
                          className="text-sm font-extrabold truncate"
                          style={{ color: mood.enabled ? mood.from : '#67e8f9' }}
                        >
                          {todayNameday}
                        </span>
                      </div>
                      <div className="relative flex items-center justify-between gap-1.5 mb-1.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-white/80">
                          <Sparkles
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: mood.enabled ? mood.from : '#67e8f9' }}
                          />
                          {currentStory.tag}
                        </span>
                        <span className="text-[10px] font-bold text-white/55">koppints →</span>
                      </div>
                      <p className="relative text-[13px] font-semibold text-white leading-relaxed">
                        {currentStory.text}
                      </p>
                    </button>
                  );
                })()}

                <div className="mt-auto pt-2 space-y-1.5">
                  <button
                    onClick={() => mood.setEnabled(e => !e)}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-apple-inner glass-card text-left w-full"
                  >
                    <span className="text-xs font-bold text-white">Időjárás-hangulat</span>
                    <span
                      className="relative w-9 h-5 rounded-full shrink-0 transition-colors"
                      style={{ background: mood.enabled ? `linear-gradient(135deg, ${mood.from}, ${mood.to})` : 'rgba(255,255,255,0.15)' }}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${mood.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </span>
                  </button>

                  {showInstallBtn && (
                    <button onClick={handleInstall} className="btn-grad w-full py-2 text-xs">
                      <Download className="w-4 h-4" /> Telepítés a kezdőképernyőre
                    </button>
                  )}

                  <p className="pt-1 text-center text-[10px] font-bold text-white/55">
                    © 2026 · Ráduly László · v3.0.1
                  </p>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* --- MAIN --- (nincs z-10: így a modálok a fix navbar fölé tudnak kerülni) */}
      <main className="lg:pl-64 relative pt-[5.5rem] lg:pt-6 pb-12">
        <Routes>
          <Route path="/" element={<WeatherDashboard />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/radar" element={<Radar />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/cameras" element={<Cameras />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      {/* --- GLOBÁLIS FOOTER — vékonyabb, egy-két sorba sűrítve, a hangulat-színt
          viszi tovább (text-gradient + a "Sponsored by" pill is), nem egy külön,
          fix cián sáv --- */}
      <footer className="lg:pl-64 relative z-10 px-4 pb-6">
        <div className="max-w-6xl mx-auto border-t border-white/[0.06] pt-4 flex flex-col items-center gap-1 text-center">
          <p className="text-[10px] font-bold text-white/60 flex flex-wrap items-center justify-center gap-x-1.5">
            <span>
              Készítette:{' '}
              <a
                href="mailto:koszegapp@gmail.com"
                className="text-gradient font-extrabold tracking-tight hover:brightness-125 transition-all"
              >
                SA software
              </a>
            </span>
            <span className="text-white/25">·</span>
            <span>© {new Date().getFullYear()}</span>
            <span className="text-white/25">·</span>
            <span>v3.0.1</span>
          </p>
          <a
            href="https://visitkoszeg.hu"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[8px] font-extrabold uppercase tracking-[0.18em] transition-all hover:brightness-125"
            style={{
              borderColor: mood.enabled ? `${mood.from}55` : 'rgba(103,232,249,0.3)',
              color: mood.enabled ? mood.from : '#67e8f9',
            }}
          >
            Sponsored by VISITKOSZEG.HU
          </a>
        </div>
      </footer>
      <AnimatePresence>
        {showScroll && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollTop}
            className="fixed bottom-6 right-6 z-[100] w-11 h-11 rounded-full bg-cyan2-500/90 hover:bg-cyan2-400 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all border border-cyan2-400/20 backdrop-blur-sm"
            title="Ugrás a tetejére"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
      <PushAlertModal alert={pushAlert} onClose={() => setPushAlert(null)} />
      <QuizModal isOpen={showQuizModal} onClose={() => setShowQuizModal(false)} />
      <LeaderboardModal 
        isOpen={showLeaderboardModal} 
        onClose={() => setShowLeaderboardModal(false)}
        onOpenQuiz={() => { setShowLeaderboardModal(false); setShowQuizModal(true); }}
        onOpenTippelde={() => { setShowLeaderboardModal(false); setShowTippeldeModal(true); }}
      />
      <TippeldeModal isOpen={showTippeldeModal} onClose={() => setShowTippeldeModal(false)} />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <WeatherMoodProvider>
        <AdminProvider>
          <AppContent />
        </AdminProvider>
      </WeatherMoodProvider>
    </Router>
  );
}
