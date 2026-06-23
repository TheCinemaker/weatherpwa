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
import { CloudSun, Calendar, Info, Download, Film, Camera, Menu, X, Heart, AlertTriangle, Map } from 'lucide-react';
import Logo from './components/Logo';
import { AdminProvider, useAdminRequest } from './components/AdminContext';
import { useAdminLongPress, AdminHoldBar } from './components/AdminLongPress';
import { incrementPageViews, getForecast } from './api/supabase';
import PushNotificationButton from './components/PushNotificationButton';
import PushAlertModal from './components/PushAlertModal';

const NAV_ITEMS = [
  { path: '/', label: 'Élő Mérések', icon: CloudSun },
  { path: '/forecast', label: 'Előrejelzés', icon: Calendar },
  { path: '/radar', label: 'Radar & Felhők', icon: Map },
  { path: '/reels', label: 'Reels', icon: Film },
  { path: '/cameras', label: 'Kamerák', icon: Camera },
  { path: '/sponsors', label: 'Támogatók', icon: Heart },
  { path: '/about', label: 'Rólam', icon: Info },
];

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Custom features states
  const [viewCount, setViewCount] = useState(null);
  const [announcement, setAnnouncement] = useState({ text: '', active: false });
  const [showAnnBanner, setShowAnnBanner] = useState(false);
  const [pushAlert, setPushAlert] = useState(null);

  // Admin belépés a logóra: 3 mp nyomás → PIN-kapu (globális kontextus).
  const requestAdmin = useAdminRequest();
  const logoPressFired = React.useRef(false);
  const { progress: holdProgress, handlers: logoHoldHandlers } = useAdminLongPress(
    () => { logoPressFired.current = true; setTimeout(() => { logoPressFired.current = false; }, 600); requestAdmin(); }
  );
  // A logó egyben „Főoldal" link is; hosszú nyomás után a kattintást elnyeljük,
  // hogy ne navigáljon el (különben az admin az aktuális oldalon nem nyílna).
  const handleLogoClick = (e) => { if (logoPressFired.current) e.preventDefault(); };

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
    <div className="relative min-h-screen text-night-100 font-sans overflow-x-hidden">

      <AdminHoldBar progress={holdProgress} />

      {/* --- NIGHT-SKY BACKGROUND --- */}
      <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: 'linear-gradient(165deg, #0A2227 0%, #061216 48%, #030608 100%)' }}>
        <div className="absolute inset-0 starfield opacity-20" />
        <div className="blob w-[45rem] h-[45rem] -top-40 -left-40 bg-teal2-500/25 animate-blob" />
        <div className="blob w-[40rem] h-[40rem] top-1/3 -right-40 bg-cyan2-500/25 animate-blob" style={{ animationDelay: '3s' }} />
        <div className="blob w-[34rem] h-[34rem] bottom-0 left-1/4 bg-indigo2-500/20 animate-blob" style={{ animationDelay: '6s' }} />
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
        <div className="flex-1 flex flex-col glass-card rounded-apple-outer p-5">
          <Link to="/" onClick={handleLogoClick} className="flex items-center gap-3 mb-8 select-none active:scale-95 transition-transform">
            <div
              {...logoHoldHandlers}
              title="Admin belépés: tartsd nyomva a logót 3 másodpercig"
              className="w-11 h-11 rounded-apple-inner bg-brand-gradient bg-[length:200%_200%] animate-gradient-pan flex items-center justify-center text-white shadow-glow"
            >
              <Logo className="w-6 h-6" />
            </div>
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
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-apple-inner text-sm font-bold transition-all ${active ? 'text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>
                  {active && (
                    <motion.span layoutId="nav-active-desktop" className="absolute inset-0 rounded-apple-inner bg-brand-gradient shadow-glow" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                  )}
                  <Icon className="w-[18px] h-[18px] shrink-0 relative z-10" />
                  <span className="relative z-10">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 space-y-4">
            {/* Web Push Notification Button */}
            <PushNotificationButton mode="desktop" />

            {showInstallBtn && (
              <button onClick={handleInstall} className="btn-grad w-full py-2.5 text-xs">
                <Download className="w-4 h-4" /> Telepítés
              </button>
            )}
            
            <p className="text-[10px] font-semibold text-white/50 leading-relaxed">
              © 2026 · Ráduly László
              {viewCount !== null && (
                <>
                  <br />
                  <span className="text-cyan2-400/80 font-extrabold tracking-wider">Látogatók: {viewCount.toLocaleString('hu-HU')}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </aside>

      {/* --- MOBILE TOP BAR + HAMBURGER (fixen rögzítve, alatta görög minden) --- */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 px-4 pt-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-between px-4 py-2.5 rounded-apple-card glass-card">
          <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2.5 active:scale-95 transition-transform">
            <div
              {...logoHoldHandlers}
              title="Admin belépés: tartsd nyomva a logót 3 másodpercig"
              className="w-9 h-9 rounded-apple-inner bg-brand-gradient bg-[length:200%_200%] animate-gradient-pan flex items-center justify-center text-white shadow-glow"
            >
              <Logo className="w-5 h-5" />
            </div>
            <span className="text-[13px] sm:text-[15px] font-black tracking-tight text-white whitespace-nowrap">
              <span className="text-cyan2-300">K</span>őszegi<span className="text-cyan2-300">I</span>dőjárás<span className="text-cyan2-300">E</span>lőrejelzés
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {/* Web Push Notification Button */}
            <PushNotificationButton mode="mobile" />

            <button
              onClick={() => setMenuOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-apple-inner bg-white/10 border border-white/10 text-white active:scale-95 transition-all"
              aria-label="Menü megnyitása"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
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
              className="absolute top-0 right-0 h-full w-[80%] max-w-xs p-4"
            >
              <div className="h-full flex flex-col glass-card rounded-apple-outer p-5">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-apple-inner bg-brand-gradient bg-[length:200%_200%] animate-gradient-pan flex items-center justify-center text-white shadow-glow">
                      <Logo className="w-5 h-5" />
                    </div>
                    <div className="leading-tight select-none">
                      <h1 className="text-xs font-black tracking-tight text-white leading-none">
                        <span className="text-cyan2-300">K</span>őszegi
                      </h1>
                      <div className="text-[9px] font-bold text-white/90 uppercase tracking-wide leading-none mt-0.5">
                        <span className="text-cyan2-300">I</span>dőjárás
                      </div>
                      <div className="text-[8px] font-bold text-white/60 uppercase tracking-wider leading-none mt-0.5">
                        <span className="text-cyan2-300">E</span>lőrejelzés
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setMenuOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-apple-inner bg-white/10 text-white active:scale-95" aria-label="Bezárás">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="flex flex-col gap-1.5">
                  {NAV_ITEMS.map(({ path, label, icon: Icon }, i) => {
                    const active = location.pathname === path;
                    return (
                      <motion.div
                        key={path}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 + i * 0.03, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Link to={path}
                          className={`flex items-center gap-3 px-4 py-3.5 rounded-apple-inner text-sm font-bold transition-all ${active ? 'bg-brand-gradient text-white shadow-glow' : 'text-white hover:bg-white/10 hover:text-white'}`}>
                          <Icon className="w-[18px] h-[18px] shrink-0" />
                          <span>{label}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                <div className="mt-auto pt-6 space-y-3">
                  {showInstallBtn && (
                    <button onClick={handleInstall} className="btn-grad w-full py-3 text-xs">
                      <Download className="w-4 h-4" /> Telepítés a kezdőképernyőre
                    </button>
                  )}
                  
                  <p className="text-[10px] font-semibold text-white/50 leading-relaxed text-center">
                    © 2026 · Ráduly László
                    {viewCount !== null && (
                      <>
                        <br />
                        <span className="text-cyan2-400 font-extrabold tracking-wider">Látogatók: {viewCount.toLocaleString('hu-HU')}</span>
                      </>
                    )}
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

      {/* --- GLOBÁLIS FOOTER --- */}
      <footer className="lg:pl-64 relative z-10 px-4 pb-10">
        <div className="max-w-6xl mx-auto border-t border-white/10 pt-6 flex flex-col items-center gap-1.5 text-center">
          <p className="text-[11px] font-bold text-white/70">
            Designed &amp; developed by{' '}
            <a
              href="mailto:avar.szilveszter@gmail.com"
              className="text-gradient font-extrabold tracking-tight hover:brightness-125 transition-all"
            >
              SA software
            </a>
          </p>
          <p className="text-[10px] font-semibold text-white/50 leading-relaxed">
            © {new Date().getFullYear()} SA software · Minden jog fenntartva · All rights reserved.
          </p>
          <p className="text-[10px] font-semibold text-white/50 leading-relaxed">
            Version: 2.0.11
          </p>
          <a
            href="https://visitkoszeg.hu"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[9px] font-extrabold uppercase tracking-[0.18em] text-cyan2-200/80 hover:text-white hover:border-cyan2-400/30 transition-all"
          >
            Sponsored by VISITKOSZEG.HU
          </a>
        </div>
      </footer>
      <PushAlertModal alert={pushAlert} onClose={() => setPushAlert(null)} />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AdminProvider>
        <AppContent />
      </AdminProvider>
    </Router>
  );
}
