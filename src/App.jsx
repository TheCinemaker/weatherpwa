import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import WeatherDashboard from './pages/WeatherDashboard/WeatherDashboard';
import About from './pages/About/About';
import Reels from './pages/Reels/Reels';
import Cameras from './pages/Cameras/Cameras';
import { CloudSun, Calendar, Info, Download, Film, Camera, Menu, X } from 'lucide-react';
import Logo from './components/Logo';

const NAV_ITEMS = [
  { path: '/', label: 'Élő Mérések', icon: CloudSun },
  { path: 'forecast', label: 'Előrejelzés', icon: Calendar, customClick: true },
  { path: '/reels', label: 'Reels', icon: Film },
  { path: '/cameras', label: 'Kamerák', icon: Camera },
  { path: '/about', label: 'Rólunk', icon: Info },
];

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleForecastClick = (e) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById('dashboard-forecast');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      const el = document.getElementById('dashboard-forecast');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setShowInstallBtn(true); };
    window.addEventListener('beforeinstallprompt', handler);
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

  return (
    <div className="relative min-h-screen text-night-100 font-sans overflow-x-hidden">

      {/* --- NIGHT-SKY BACKGROUND --- */}
      <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: 'linear-gradient(165deg, #0A2227 0%, #061216 48%, #030608 100%)' }}>
        <div className="absolute inset-0 starfield opacity-20" />
        <div className="blob w-[45rem] h-[45rem] -top-40 -left-40 bg-teal2-500/25 animate-blob" />
        <div className="blob w-[40rem] h-[40rem] top-1/3 -right-40 bg-cyan2-500/25 animate-blob" style={{ animationDelay: '3s' }} />
        <div className="blob w-[34rem] h-[34rem] bottom-0 left-1/4 bg-indigo2-500/20 animate-blob" style={{ animationDelay: '6s' }} />
      </div>

      {/* --- DESKTOP SIDEBAR RAIL --- */}
      <aside className="hidden lg:flex fixed top-0 left-0 z-40 h-screen w-64 flex-col p-4">
        <div className="flex-1 flex flex-col glass-card rounded-[2rem] p-5">
          <Link to="/" className="flex items-center gap-3 mb-8 select-none active:scale-95 transition-transform">
            <div className="w-11 h-11 rounded-2xl bg-brand-gradient bg-[length:200%_200%] animate-gradient-pan flex items-center justify-center text-white shadow-glow">
              <Logo className="w-6 h-6" />
            </div>
            <div className="leading-tight">
              <h1 className="text-[15px] font-extrabold tracking-tight text-white">Kőszeg</h1>
              <span className="text-[10px] font-bold text-night-200/60 uppercase tracking-[0.18em]">Időjárás</span>
            </div>
          </Link>

          <nav className="flex flex-col gap-1.5">
            {NAV_ITEMS.map(({ path, label, icon: Icon, customClick }) => {
              const active = location.pathname === path;
              if (customClick) {
                return (
                  <button key={path} onClick={handleForecastClick}
                    className="relative w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-night-200/70 hover:bg-white/10 hover:text-white transition-all text-left">
                    <Icon className="w-[18px] h-[18px] shrink-0 relative z-10" />
                    <span className="relative z-10">{label}</span>
                  </button>
                );
              }
              return (
                <Link key={path} to={path}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${active ? 'text-white' : 'text-night-200/70 hover:bg-white/10 hover:text-white'}`}>
                  {active && (
                    <motion.span layoutId="nav-active-desktop" className="absolute inset-0 rounded-2xl bg-brand-gradient shadow-glow" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                  )}
                  <Icon className="w-[18px] h-[18px] shrink-0 relative z-10" />
                  <span className="relative z-10">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 space-y-3">
            {showInstallBtn && (
              <button onClick={handleInstall} className="btn-grad w-full py-2.5 text-xs">
                <Download className="w-4 h-4" /> Telepítés
              </button>
            )}
            <p className="text-[10px] font-semibold text-night-200/45 leading-relaxed">
              © 2026 · Ráduly László<br />SmartMixin · ID 72461
            </p>
          </div>
        </div>
      </aside>

      {/* --- MOBILE TOP BAR + HAMBURGER --- */}
      <header className="lg:hidden sticky top-0 z-40 px-4 pt-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-between px-4 py-2.5 rounded-[1.5rem] glass-card">
          <Link to="/" className="flex items-center gap-2.5 active:scale-95 transition-transform">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient bg-[length:200%_200%] animate-gradient-pan flex items-center justify-center text-white shadow-glow">
              <Logo className="w-5 h-5" />
            </div>
            <span className="text-sm font-extrabold tracking-tight text-white">Kőszegi<span className="text-gradient"> Időjárás</span></span>
          </Link>
          <button
            onClick={() => setMenuOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white active:scale-95 transition-all"
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
              className="absolute top-0 right-0 h-full w-[80%] max-w-xs p-4"
            >
              <div className="h-full flex flex-col glass-card rounded-[1.75rem] p-5">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-brand-gradient bg-[length:200%_200%] animate-gradient-pan flex items-center justify-center text-white shadow-glow">
                      <Logo className="w-5 h-5" />
                    </div>
                    <div className="leading-tight">
                      <h1 className="text-sm font-extrabold tracking-tight text-white">Kőszeg</h1>
                      <span className="text-[9px] font-bold text-night-200/55 uppercase tracking-[0.18em]">Időjárás</span>
                    </div>
                  </div>
                  <button onClick={() => setMenuOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white active:scale-95" aria-label="Bezárás">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="flex flex-col gap-1.5">
                  {NAV_ITEMS.map(({ path, label, icon: Icon, customClick }, i) => {
                    const active = location.pathname === path;
                    if (customClick) {
                      return (
                        <motion.div
                          key={path}
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.08 + i * 0.05 }}
                        >
                          <button onClick={(e) => { handleForecastClick(e); setMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-night-200/75 hover:bg-white/10 hover:text-white transition-all text-left">
                            <Icon className="w-[18px] h-[18px] shrink-0" />
                            <span>{label}</span>
                          </button>
                        </motion.div>
                      );
                    }
                    return (
                      <motion.div
                        key={path}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 + i * 0.03, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Link to={path}
                          className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-brand-gradient text-white shadow-glow' : 'text-night-200/75 hover:bg-white/10 hover:text-white'}`}>
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
                  <p className="text-[10px] font-semibold text-night-200/45 leading-relaxed text-center">
                    © 2026 · Ráduly László<br />SmartMixin · ID 72461
                  </p>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* --- MAIN --- */}
      <main className="lg:pl-64 relative z-10 pt-4 lg:pt-6 pb-12">
        <Routes>
          <Route path="/" element={<WeatherDashboard />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/cameras" element={<Cameras />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
