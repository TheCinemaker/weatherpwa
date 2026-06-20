import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import WeatherDashboard from './pages/WeatherDashboard/WeatherDashboard';
import Forecast from './pages/Forecast/Forecast';
import About from './pages/About/About';
import Reels from './pages/Reels/Reels';
import Cameras from './pages/Cameras/Cameras';
import { Mountain, Calendar, Info, Moon, Sun, Download, Menu, X, Film, Camera } from 'lucide-react';

function AppContent() {
  const location = useLocation();
  const [dark, setDark] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Apply Dark/Light mode theme
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [dark]);

  // Listen for PWA installation prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to installation: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const navItems = [
    { path: '/', label: 'Élő Mérések', icon: <Mountain className="w-4 h-4" /> },
    { path: '/forecast', label: 'Előrejelzés', icon: <Calendar className="w-4 h-4" /> },
    { path: '/reels', label: 'Reels', icon: <Film className="w-4 h-4" /> },
    { path: '/cameras', label: 'Kamerák', icon: <Camera className="w-4 h-4" /> },
    { path: '/about', label: 'Rólunk', icon: <Info className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-beige-50 dark:bg-[#030816] text-[#123a57] dark:text-gray-100 transition-colors duration-500 font-sans">
      
      {/* Background Noise Overlay */}
      <div className="fixed inset-0 opacity-[0.03] bg-[url('/noise.svg')] mix-blend-overlay pointer-events-none z-0"></div>

      {/* --- PREMIUM GLASS NAVIGATION HEADER --- */}
      <header className="sticky top-0 z-50 px-4 pt-4 max-w-7xl w-full mx-auto pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-between px-6 py-4 rounded-[2rem] bg-white/40 dark:bg-[#123a57]/20 backdrop-blur-[30px] border border-white/50 dark:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-2 select-none active:scale-95 transition-all">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0bc9f8] to-[#123a57] flex items-center justify-center text-white shadow-md">
              <Mountain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight uppercase leading-none text-[#123a57] dark:text-white">
                Kőszegi
              </h1>
              <span className="text-[10px] font-bold text-[#b36022] dark:text-[#e0a05c] uppercase tracking-widest">
                Időjárás
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Link Tabs */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    active 
                      ? 'bg-[#123a57] text-white shadow-md' 
                      : 'text-[#123a57]/70 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Action Buttons (Install PWA, Dark Mode, Mobile Menu Toggle) */}
          <div className="flex items-center gap-2">
            {showInstallBtn && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#b36022] hover:bg-[#d68743] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Letöltés</span>
              </button>
            )}

            <button
              onClick={() => setDark(!dark)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#123a57]/5 hover:bg-[#123a57]/10 dark:bg-white/10 dark:hover:bg-white/20 text-[#123a57] dark:text-white transition-all active:scale-95"
              aria-label="Theme toggle"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile Menu Icon */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-[#123a57]/5 hover:bg-[#123a57]/10 dark:bg-white/10 dark:hover:bg-white/20 text-[#123a57] dark:text-white transition-all active:scale-95"
              aria-label="Menu"
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {menuOpen && (
          <div className="md:hidden pointer-events-auto mt-2 p-3 rounded-[2rem] bg-white/90 dark:bg-[#0c1726]/95 backdrop-blur-[30px] border border-white/50 dark:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.1)] space-y-1 animate-in fade-in slide-in-from-top-3 duration-250">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black transition-all ${
                    active 
                      ? 'bg-[#123a57] text-white shadow-md' 
                      : 'text-[#123a57]/70 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* --- CONTENT CONTAINER AREA --- */}
      <main className="flex-1 relative z-10 py-6">
        <Routes>
          <Route path="/" element={<WeatherDashboard />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/cameras" element={<Cameras />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      {/* --- PREMIUM FOOTER --- */}
      <footer className="relative z-10 py-8 border-t border-[#e9d8c9]/60 dark:border-white/10 text-center bg-[#f5efe6]/40 dark:bg-[#0c1726]/30 backdrop-blur-[10px]">
        <p className="text-xs font-bold text-[#123a57]/60 dark:text-gray-500">
          © 2026 Kőszegi Időjárás Előrejelzés · Mérések és elemzések: Ráduly László
        </p>
        <p className="text-[10px] text-[#123a57]/40 dark:text-gray-600 mt-1 font-semibold">
          Állomás adatok forrása: SmartMixin Station ID 72461
        </p>
      </footer>

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
