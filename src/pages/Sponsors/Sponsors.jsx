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

  // Hirdetés-részletek modál + új mezők (flyer/plakát, elérhetőség)
  const [selectedAd, setSelectedAd] = useState(null);
  const [sponsorContact, setSponsorContact] = useState('');
  const [flyerFile, setFlyerFile] = useState(null);
  const [flyerPreview, setFlyerPreview] = useState(null);

  // A beégetett saját hirdetés (SA software) – ugyanakkora kártya, mint a többi.
  const DEVELOPER_AD = {
    id: 'sa-software',
    isDeveloper: true,
    name: 'SA software',
    subtitle: '& Network Solutions',
    logo_url: '/sasoftware.png',
    description: 'Egyedi szoftverfejlesztés, felhő-infrastruktúrák tervezése és prémium IT hálózati megoldások az Ön vállalkozására szabva. Ez az időjárás-alkalmazás is a mi munkánk.',
    website_url: null,
    contact: developerEmail,
    services: [
      { title: 'Web & Mobilappok', desc: 'Gyors, modern és reszponzív rendszerek (mint ez az app).' },
      { title: 'Felhő & Adatbázis', desc: 'Biztonságos Supabase és PostgreSQL integrációk.' },
      { title: 'IT Hálózatok', desc: 'VPN kiépítés, távoli elérés és rendszerfelügyelet.' }
    ]
  };

  // Minden hirdetés egy listában, egységes méretben: elöl a saját, utána a fizetős hirdetők.
  const allAds = [DEVELOPER_AD, ...sponsors];

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

  const handleFlyerChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFlyerFile(file);
    setFlyerPreview(URL.createObjectURL(file));
  };

  const handleAddOrUpdateSponsor = async () => {
    if (!sponsorName.trim()) {
      setFormError('A név megadása kötelező!');
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

      // Flyer/plakát (nagyobb felbontás a részletes nézethez)
      let finalFlyerUrl = flyerPreview; // megtartott meglévő URL vagy null ha eltávolítva
      if (flyerFile) {
        const compressedFlyer = await compressLogo(flyerFile, 1200);
        finalFlyerUrl = await uploadSponsorLogo(compressedFlyer);
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
        website_url: sponsorUrl.trim() || null,
        flyer_url: finalFlyerUrl || null,
        contact: sponsorContact.trim() || null,
        expires_at: expiresAt,
        active: true
      });

      // Reset form
      setSponsorName('');
      setSponsorDesc('');
      setSponsorUrl('');
      setSponsorContact('');
      setSelectedFile(null);
      setLogoPreview(null);
      setFlyerFile(null);
      setFlyerPreview(null);
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
    setSponsorContact(sponsor.contact || '');
    setLogoPreview(sponsor.logo_url);
    setFlyerFile(null);
    setFlyerPreview(sponsor.flyer_url || null);
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
              <span>Kőszegi <span className="text-gradient">Hirdetések</span></span>
            </h1>
            <p className="text-xs text-night-200/55 font-semibold mt-0.5">
              Helyi vállalkozások és partnerek · kattints egy hirdetésre a részletekért
            </p>
          </div>
        </div>
      </FadeUp>

      {/* --- HIRDETÉS-RÁCS (minden kártya egységes méretű) --- */}
      <FadeUp delay={0.05}>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 rounded-[1.75rem] bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
            {allAds.map((ad) => (
              <button
                key={ad.id}
                onClick={() => setSelectedAd(ad)}
                className={`glass-card rounded-[1.75rem] p-5 text-left flex flex-col h-full transition-all duration-300 relative overflow-hidden group active:scale-[0.99] ${ad.isDeveloper ? 'border-cyan2-500/30 shadow-glow' : 'hover:border-cyan2-400/30'}`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-cyan2-500/5 blur-xl pointer-events-none" />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                    <img src={ad.logo_url} alt={ad.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-white truncate">{ad.name}</h4>
                    <span className={`text-[8px] font-extrabold uppercase tracking-widest ${ad.isDeveloper ? 'text-cyan2-300' : 'text-night-200/45'}`}>
                      {ad.isDeveloper ? 'Fejlesztő · Kiemelt' : 'Hirdetés'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-night-200/65 leading-relaxed line-clamp-3 mt-3 flex-1 relative z-10">
                  {ad.description}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-cyan2-300 group-hover:text-white transition-colors relative z-10">
                  Részletek megtekintése →
                </span>
              </button>
            ))}
          </div>
        )}
      </FadeUp>

      {/* --- HIRDETÉSI CTA (fizetős felület) --- */}
      <FadeUp delay={0.1}>
        <div className="relative overflow-hidden rounded-[2rem] glass-card p-6 sm:p-8 text-center border border-cyan2-500/20 bg-[#0a1e22]/60 mt-2">
          <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-cyan2-500/10 blur-3xl pointer-events-none" />
          <h3 className="text-lg font-extrabold text-white">Hirdess a Kőszegi Időjárásban!</h3>
          <p className="text-xs text-night-200/70 max-w-md mx-auto leading-relaxed mt-2">
            Az alkalmazást Kőszeg lakói és a környékre látogató turisták ezrei használják nap mint nap. Jelenítsd meg vállalkozásodat saját hirdetési felületen – plakáttal, leírással és elérhetőséggel.
          </p>
          <a
            href={`mailto:${developerEmail}?subject=Hirdetési lehetőség - Kőszegi Időjárás`}
            className="btn-grad px-6 py-3 text-xs mt-5 inline-flex"
          >
            <Mail className="w-4 h-4" />
            <span>Hirdetési ajánlatkérés</span>
          </a>
          <p className="text-[10px] font-bold text-night-200/45 mt-2">{developerEmail}</p>
        </div>
      </FadeUp>

      {/* --- HIRDETÉS RÉSZLETES MODÁL --- */}
      <AnimatePresence>
        {selectedAd && (
          <div className="fixed inset-0 z-[350] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }} transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setSelectedAd(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
              transition={{ type: 'spring', stiffness: 440, damping: 34, mass: 0.7 }}
              className="relative w-full max-w-lg bg-night-800 rounded-[2rem] shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedAd(null)}
                aria-label="Bezárás"
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-rose-500 border border-white/20 text-white flex items-center justify-center transition-all active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Flyer / plakát (ha van), különben a logó nagyban */}
              {selectedAd.flyer_url ? (
                <div className="w-full bg-black/30 flex items-center justify-center rounded-t-[2rem] overflow-hidden">
                  <img src={selectedAd.flyer_url} alt={selectedAd.name} className="w-full h-auto max-h-[55vh] object-contain" />
                </div>
              ) : (
                <div className="pt-8 flex justify-center">
                  <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                    <img src={selectedAd.logo_url} alt={selectedAd.name} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              <div className="p-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-extrabold text-white tracking-tight">{selectedAd.name}</h3>
                  {selectedAd.subtitle && (
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan2-300 mt-1">{selectedAd.subtitle}</p>
                  )}
                </div>

                {selectedAd.description && (
                  <p className="text-sm text-night-100/85 leading-relaxed text-center whitespace-pre-wrap">{selectedAd.description}</p>
                )}

                {/* Fejlesztő szolgáltatások */}
                {selectedAd.isDeveloper && selectedAd.services && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                    {selectedAd.services.map((s) => (
                      <div key={s.title} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                        <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">{s.title}</h4>
                        <p className="text-[10px] text-night-200/60 leading-relaxed">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Elérhetőség + weboldal */}
                <div className="flex flex-col gap-2 pt-1">
                  {selectedAd.contact && (
                    <a
                      href={selectedAd.contact.includes('@') ? `mailto:${selectedAd.contact}` : `tel:${selectedAd.contact.replace(/\s/g, '')}`}
                      className="btn-grad w-full py-3 text-xs"
                    >
                      <Mail className="w-4 h-4" />
                      <span>{selectedAd.contact}</span>
                    </a>
                  )}
                  {selectedAd.website_url && (
                    <a
                      href={selectedAd.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all active:scale-95"
                    >
                      <Globe className="w-4 h-4" /><span>Weboldal megnyitása</span>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[9px] font-bold text-night-200/50 uppercase tracking-widest block">Hirdetés szövege</label>
                    <span className="text-[9px] font-bold text-night-200/40">{sponsorDesc.length}/1000</span>
                  </div>
                  <textarea
                    rows={5}
                    value={sponsorDesc}
                    onChange={e => setSponsorDesc(e.target.value.slice(0, 1000))}
                    placeholder="Pl.: Minőségi műanyag nyílászárók beépítése Kőszegen. Ingyenes helyszíni felmérés, akár 10 év garancia..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs font-semibold placeholder:text-night-200/30 focus:outline-none focus:ring-1 focus:ring-cyan2-400/50 resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-night-200/50 uppercase tracking-widest mb-1 block">Elérhetőség (e-mail vagy telefon)</label>
                  <input
                    type="text"
                    value={sponsorContact}
                    onChange={e => setSponsorContact(e.target.value.slice(0, 60))}
                    placeholder="Pl.: info@kuszala.hu vagy +36 30 123 4567"
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

                {/* Flyer / plakát feltöltése (a részletes modálban nagyban jelenik meg) */}
                <div>
                  <label className="text-[9px] font-bold text-night-200/50 uppercase tracking-widest mb-1 block">Plakát / flyer (opcionális, nagy kép a részletekhez)</label>
                  {flyerPreview ? (
                    <div className="relative w-full h-28 rounded-xl overflow-hidden border border-white/10 bg-black/20 flex items-center justify-center">
                      <img src={flyerPreview} alt="Flyer előnézet" className="h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => { setFlyerFile(null); setFlyerPreview(null); }}
                        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-md"
                        title="Plakát eltávolítása"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full flex items-center gap-2 px-3.5 py-3 rounded-xl border border-dashed border-white/20 hover:border-cyan2-400/40 bg-white/[0.02] text-night-200/60 hover:text-white cursor-pointer justify-center text-xs font-semibold transition-colors">
                      <ImageIcon className="w-4 h-4 text-cyan2-300" />
                      <span>Plakát feltöltése</span>
                      <input type="file" accept="image/*" onChange={handleFlyerChange} className="hidden" />
                    </label>
                  )}
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
                        setSponsorContact('');
                        setSelectedFile(null);
                        setLogoPreview(null);
                        setFlyerFile(null);
                        setFlyerPreview(null);
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
