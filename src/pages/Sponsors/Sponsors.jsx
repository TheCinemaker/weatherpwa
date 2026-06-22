import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Mail, Plus, Trash2, Edit2, Check, X, Shield, Calendar, Image as ImageIcon, Heart } from 'lucide-react';
import { FadeUp } from '../../components/AppleMotion';
import { useAdminUnlock } from '../../components/AdminContext';
import { getSponsors, saveSponsor, deleteSponsor, uploadSponsorLogo } from '../../api/supabase';

function compressLogo(file, maxW = 400) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(resolve, 'image/jpeg', 0.85);
    };
    img.src = url;
  });
}

export default function Sponsors() {
  const developerEmail = "avar.szilveszter@gmail.com";
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Admin state
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Admin belépés a (közös) logóról: sikeres PIN után nyíljon a szerkesztő.
  useAdminUnlock(() => { setIsAdminAuthenticated(true); setShowAdmin(true); });

  // New sponsor form
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorDesc, setSponsorDesc] = useState('');
  const [sponsorUrl, setSponsorUrl] = useState('');
  const [sponsorDurationWeeks, setSponsorDurationWeeks] = useState(4); // default 4 weeks
  const [selectedFile, setSelectedFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [savingSponsor, setSavingSponsor] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchSponsorsList = async () => {
    setLoading(true);
    const data = await getSponsors();
    setSponsors(data);
    setLoading(false);
  };

  useEffect(() => {
    document.title = 'Kőszeg Időjárás – Támogatóink';
    fetchSponsorsList();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleAddOrUpdateSponsor = async () => {
    if (!sponsorName.trim() || !sponsorUrl.trim()) {
      setFormError('A név és a weboldal megadása kötelező!');
      return;
    }
    if (!selectedFile && !editingSponsor?.logo_url) {
      setFormError('Kérjük, tölts fel egy logót!');
      return;
    }

    setSavingSponsor(true);
    setFormError('');
    try {
      let finalLogoUrl = editingSponsor?.logo_url || '';
      
      if (selectedFile) {
        const compressed = await compressLogo(selectedFile);
        finalLogoUrl = await uploadSponsorLogo(compressed);
      }

      // Calculate expiration date
      let expiresAt;
      if (editingSponsor && !selectedFile) {
        expiresAt = editingSponsor.expires_at; // keep existing if editing and not changing duration
      } else {
        const date = new Date();
        date.setDate(date.getDate() + (sponsorDurationWeeks * 7));
        expiresAt = date.toISOString();
      }

      await saveSponsor({
        id: editingSponsor?.id || null,
        name: sponsorName.trim(),
        logo_url: finalLogoUrl,
        description: sponsorDesc.trim() || null,
        website_url: sponsorUrl.trim(),
        expires_at: expiresAt,
        active: true
      });

      // Reset form
      setSponsorName('');
      setSponsorDesc('');
      setSponsorUrl('');
      setSelectedFile(null);
      setLogoPreview(null);
      setEditingSponsor(null);
      
      await fetchSponsorsList();
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Hiba történt a mentés során.');
    } finally {
      setSavingSponsor(false);
    }
  };

  const handleDeleteSponsor = async (id) => {
    if (window.confirm('Biztosan törlöd ezt a támogatót?')) {
      try {
        await deleteSponsor(id);
        await fetchSponsorsList();
      } catch (err) {
        alert('Hiba a törlés során: ' + err.message);
      }
    }
  };

  const handleEditSponsorClick = (sponsor) => {
    setEditingSponsor(sponsor);
    setSponsorName(sponsor.name);
    setSponsorDesc(sponsor.description || '');
    setSponsorUrl(sponsor.website_url || '');
    setLogoPreview(sponsor.logo_url);
    setFormError('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6 pb-12">
      {/* Fejléc */}
      <FadeUp>
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Heart className="w-6 h-6 text-cyan2-300" />
              <span>Kiemelt <span className="text-gradient">Támogatóink</span></span>
            </h1>
            <p className="text-xs text-night-200/55 font-semibold mt-0.5">
              Helyi vállalkozások, amelyek támogatják az időjárás állomás működését
            </p>
          </div>
        </div>
      </FadeUp>

      {/* Fő Fejlesztő/Támogató Kártya (SA software) */}
      <FadeUp delay={0.05}>
        <div className="relative overflow-hidden rounded-[2rem] glass-card p-6 sm:p-8 text-center border border-cyan2-500/20 shadow-glow bg-[#0a1e22]/60">
          <div className="absolute -top-16 -left-10 w-56 h-56 rounded-full bg-cyan2-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-10 w-56 h-56 rounded-full bg-teal2-500/10 blur-3xl pointer-events-none" />

          {/* SA software logó */}
          <div className="relative w-20 h-20 mx-auto mb-5 select-none">
            <div className="w-20 h-20 rounded-3xl bg-night-900 border-2 border-cyan2-400/40 flex items-center justify-center shadow-lg relative z-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#saLogoGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="saLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#2dd4bf" />
                  </linearGradient>
                </defs>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-extrabold text-white tracking-tight">SA software</h2>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan2-300 mt-1">
            & Network Solutions
          </p>

          <p className="text-xs text-night-200/80 leading-relaxed max-w-md mx-auto mt-4 font-medium">
            Egyedi szoftverfejlesztés, felhő-infrastruktúrák tervezése és prémium IT hálózati megoldások az Ön vállalkozására szabva.
          </p>

          {/* Szolgáltatások */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 text-left">
            {[
              { icon: Globe, title: 'Web & Mobilappok', desc: 'Gyors, modern és reszponzív rendszerek (mint ez az időjárás app).' },
              { icon: Shield, title: 'Felhő & Adatbázis', desc: 'Biztonságos Supabase és PostgreSQL alapú adatbázis integrációk.' },
              { icon: Calendar, title: 'IT Hálózatok', desc: 'VPN kiépítés, távoli elérés és folyamatos rendszerfelügyelet.' }
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
                <Icon className="w-5 h-5 text-cyan2-300" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h4>
                <p className="text-[10px] text-night-200/60 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Kapcsolat */}
          <div className="mt-6 flex flex-col items-center justify-center gap-2">
            <a
              href={`mailto:${developerEmail}?subject=Ajánlatkérés - SA software`}
              className="btn-grad px-6 py-3 text-xs w-full sm:w-auto"
            >
              <Mail className="w-4 h-4" />
              <span>Írjon nekünk e-mailt</span>
            </a>
            <span className="text-[10px] font-bold text-night-200/40">{developerEmail}</span>
          </div>
        </div>
      </FadeUp>

      {/* --- ACTIVE SPONSORS LIST --- */}
      <FadeUp delay={0.1}>
        <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-cyan2-200/80 mt-8 mb-4 flex items-center gap-3">
          <span>Partnereink & Hirdetőink</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-32 rounded-[2rem] bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : sponsors.length === 0 ? (
          /* Empty State / Promote ad space */
          <div className="rounded-[2rem] glass-card p-6 text-center space-y-4">
            <h3 className="text-base font-extrabold text-white">Szeretnéd itt látni a vállalkozásodat?</h3>
            <p className="text-xs text-night-200/70 max-w-md mx-auto leading-relaxed">
              Az alkalmazás Kőszeg lakói és a környékre látogató turisták körében is népszerű. Támogasd a fenntartást, és jelenítsd meg hirdetésedet az oldalon!
            </p>
            <a
              href={`mailto:${developerEmail}?subject=Hirdetési lehetőség - Kőszeg Weather`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all active:scale-95"
            >
              <Mail className="w-4 h-4" /><span>Hirdetési részletek</span>
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sponsors.map((sp) => (
              <div key={sp.id} className="glass-card rounded-[2rem] p-5 flex items-start gap-4 hover:border-cyan2-400/30 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-cyan2-500/5 blur-xl pointer-events-none" />
                
                {/* Logo */}
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  <img src={sp.logo_url} alt={sp.name} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h4 className="text-sm font-extrabold text-white truncate">{sp.name}</h4>
                  {sp.description && (
                    <p className="text-[11px] text-night-200/60 leading-relaxed line-clamp-2">{sp.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <a
                      href={sp.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-cyan2-300 hover:text-white transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Weboldal megnyitása</span>
                    </a>
                    
                    <span className="text-[8px] font-bold text-night-200/40 uppercase tracking-wider">
                      Aktív
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </FadeUp>

      {/* --- SPONSOR ADMIN MODAL --- */}
      <AnimatePresence>
        {showAdmin && (
          <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }} transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-md"
              onClick={() => { setShowAdmin(false); setEditingSponsor(null); }}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
              transition={{ type: 'spring', stiffness: 440, damping: 34, mass: 0.7 }}
              className="relative w-full max-w-lg bg-night-800 rounded-[2rem] p-6 flex flex-col gap-4 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan2-400" />
                  <span>Támogatók Kezelése (Fejlesztő Admin)</span>
                </h3>
                <button
                  onClick={() => { setShowAdmin(false); setEditingSponsor(null); }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form to add/edit sponsor */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-cyan2-200 uppercase tracking-widest">
                  {editingSponsor ? 'Támogató Módosítása' : 'Új Támogató Hozzáadása'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-night-200/50 uppercase tracking-widest mb-1 block">Támogató neve</label>
                    <input
                      type="text"
                      value={sponsorName}
                      onChange={e => setSponsorName(e.target.value.slice(0, 50))}
                      placeholder="Pl.: Kuszala Ablak"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs font-semibold placeholder:text-night-200/30 focus:outline-none focus:ring-1 focus:ring-cyan2-400/50"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-night-200/50 uppercase tracking-widest mb-1 block">Weboldal URL</label>
                    <input
                      type="text"
                      value={sponsorUrl}
                      onChange={e => setSponsorUrl(e.target.value)}
                      placeholder="https://example.hu"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs font-semibold placeholder:text-night-200/30 focus:outline-none focus:ring-1 focus:ring-cyan2-400/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-night-200/50 uppercase tracking-widest mb-1 block">Rövid leírás</label>
                  <input
                    type="text"
                    value={sponsorDesc}
                    onChange={e => setSponsorDesc(e.target.value.slice(0, 100))}
                    placeholder="Pl.: Minőségi műanyag nyílászárók beépítése Kőszegen..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs font-semibold placeholder:text-night-200/30 focus:outline-none focus:ring-1 focus:ring-cyan2-400/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  {/* Duration picker */}
                  <div>
                    <label className="text-[9px] font-bold text-night-200/50 uppercase tracking-widest mb-1 block">Hirdetés időtartama</label>
                    <select
                      value={sponsorDurationWeeks}
                      onChange={e => setSponsorDurationWeeks(parseInt(e.target.value, 10))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#070c14] text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-cyan2-400/50"
                      disabled={!!editingSponsor && !selectedFile}
                    >
                      <option value={1}>1 Hét (7 nap)</option>
                      <option value={2}>2 Hét (14 nap)</option>
                      <option value={4}>4 Hét (28 nap) - Standard</option>
                      <option value={8}>8 Hét (56 nap)</option>
                      <option value={12}>12 Hét (84 nap)</option>
                    </select>
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="text-[9px] font-bold text-night-200/50 uppercase tracking-widest mb-1 block">Logó feltöltése</label>
                    <label className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-night-200/60 hover:text-white cursor-pointer justify-center text-xs font-semibold transition-colors duration-200">
                      {logoPreview ? (
                        <div className="flex items-center gap-2">
                          <img src={logoPreview} alt="" className="w-6 h-6 object-cover rounded-md" />
                          <span className="truncate max-w-[120px]">{selectedFile ? selectedFile.name : 'Logó kiválasztva'}</span>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4" />
                          <span>Válassz képet</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                </div>

                {formError && <p className="text-rose-300 text-[10px] font-extrabold text-center">{formError}</p>}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleAddOrUpdateSponsor}
                    disabled={savingSponsor}
                    className="btn-grad flex-1 py-3 text-xs font-bold"
                  >
                    {savingSponsor ? 'Mentés...' : editingSponsor ? 'Módosítás Mentése' : 'Támogató Mentése'}
                  </button>
                  {editingSponsor && (
                    <button
                      onClick={() => {
                        setEditingSponsor(null);
                        setSponsorName('');
                        setSponsorDesc('');
                        setSponsorUrl('');
                        setSelectedFile(null);
                        setLogoPreview(null);
                      }}
                      className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
                    >
                      Mégse
                    </button>
                  )}
                </div>
              </div>

              {/* List of existing sponsors for management */}
              <div className="space-y-2 mt-2">
                <h4 className="text-xs font-bold text-night-200/50 uppercase tracking-widest">
                  Aktív hirdetők ({sponsors.length})
                </h4>

                <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
                  {sponsors.map(sp => (
                    <div key={sp.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={sp.logo_url} alt="" className="w-8 h-8 object-cover rounded-md border border-white/10 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{sp.name}</p>
                          <p className="text-[8px] font-bold text-night-200/40 uppercase">Lejár: {new Date(sp.expires_at).toLocaleDateString('hu-HU')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditSponsorClick(sp)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-cyan2-500/20 hover:text-cyan2-200 text-white transition-colors"
                          title="Szerkesztés"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSponsor(sp.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-200 text-white transition-colors"
                          title="Törlés"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
