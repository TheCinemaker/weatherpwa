import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { hu } from 'date-fns/locale';
import { IoCameraOutline, IoCloseOutline, IoLocationOutline, IoSendOutline, IoTimeOutline } from 'react-icons/io5';
import { Heart, HeartOff, Share2, Trash2, User, Clock, MapPin, X, Camera } from 'lucide-react';
import { supabase, deleteMoment } from '../../api/supabase';
import { containsProfanity } from '../../utils/badWordsHU';
import { FadeUp } from '../../components/AppleMotion';
import { useAdminUnlock } from '../../components/AdminContext';
import { ShieldCheck } from 'lucide-react';

const BUCKET = 'moments';

function timeLeft(expiresAt) {
  const mins = differenceInMinutes(new Date(expiresAt), new Date());
  if (mins < 1) return 'hamarosan lejár';
  if (mins < 60) return `${mins} perc`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} óra`;
}

const MOCK_MOMENTS = [
  { id: 'mock-1', photo_url: 'https://images.unsplash.com/photo-1548777123-e216912df7d8?w=800', caption: 'Hatalmas havazás a Kőszegi-hegységben! ❄️', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 3600000 * 20).toISOString(), lat: 47.3971, lng: 16.546 },
  { id: 'mock-2', photo_url: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800', caption: 'Látványos peremfelhő és villámlások a hegyek felett tegnap este. ⛈️', created_at: new Date(Date.now() - 3600000 * 2).toISOString(), expires_at: new Date(Date.now() + 3600000 * 22).toISOString(), lat: 47.3971, lng: 16.546 },
  { id: 'mock-3', photo_url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800', caption: 'Csodálatos napkelte az Írott-kő kilátóból! 🌅 Magasság: 884 méter.', created_at: new Date(Date.now() - 3600000 * 4).toISOString(), expires_at: new Date(Date.now() + 3600000 * 20).toISOString(), lat: 47.3971, lng: 16.546 }
];

export default function Reels() {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPost, setShowPost] = useState(false);

  // Post form states
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [useLocation, setUseLocation] = useState(false);
  const [coords, setCoords] = useState(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  // Interactive UI states
  const [likedMoments, setLikedMoments] = useState({});
  const [localLikeCounts, setLocalLikeCounts] = useState({});
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);

  // Admin mód: csak PIN után lehet törölni (egyébként a 24 órás automatika törli a képeket).
  // Belépés a (közös) logó 3 mp-es nyomásával → PIN → admin mód.
  const [adminMode, setAdminMode] = useState(false);
  useAdminUnlock(() => setAdminMode(true));

  // 5-second hold-to-delete state (csak admin módban aktív)
  const [deletingId, setDeletingId] = useState(null);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const holdTimer = useRef(null);
  const holdProgressInterval = useRef(null);

  useEffect(() => { 
    document.title = 'Kőszeg Reels – 24 órás pillanatok'; 
    // Load liked moments from localStorage
    try {
      const savedLikes = JSON.parse(localStorage.getItem('koszeg_reels_likes') || '{}');
      setLikedMoments(savedLikes);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchMoments = useCallback(async () => {
    if (!supabase) { setMoments(MOCK_MOMENTS); setLoading(false); return; }
    try {
      const { data } = await supabase.from('city_moments').select('*').order('created_at', { ascending: false }).limit(40);
      // Valódi üres feed esetén az üres állapotot mutatjuk (nem mock havazást).
      if (data) setMoments(data);
    } catch (err) {
      console.error(err);
      setMoments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMoments();
    if (supabase) {
      const channel = supabase
        .channel('realtime_moments_page')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'city_moments' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setMoments((prev) => [payload.new, ...prev].slice(0, 40));
          } else if (payload.eventType === 'DELETE') {
            setMoments((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [fetchMoments]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setPostError('');
  };

  const handleLocationToggle = () => {
    if (!useLocation) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords(null)
      );
    } else {
      setCoords(null);
    }
    setUseLocation(v => !v);
  };

  const handlePost = async () => {
    if (!file) return;
    if ([caption, authorName, placeName].some(t => t && containsProfanity(t))) {
      setPostError('Kérjük, kulturált szöveget írj! 🙏');
      return;
    }
    if (!supabase) { setPostError('Supabase nincs konfigurálva a feltöltéshez.'); return; }

    setPosting(true);
    try {
      // Compress image to standard 1080px resolution for high quality mobile rendering
      const blob = await new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          const scale = Math.min(1, 1080 / img.width);
          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          canvas.toBlob(resolve, 'image/jpeg', 0.85);
        };
        img.src = url;
      });

      const filename = `moment_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(filename, blob, { contentType: 'image/jpeg' });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
      await supabase.from('city_moments').insert({
        photo_url: urlData.publicUrl,
        caption: caption.trim() || null,
        author_name: authorName.trim() || null,
        place_name: placeName.trim() || null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      });
      setShowPost(false);
      setFile(null);
      setPreview(null);
      setCaption('');
      setAuthorName('');
      setPlaceName('');
      setCoords(null);
      setUseLocation(false);
      fetchMoments();
    } catch {
      setPostError('Hiba történt, próbáld újra!');
    } finally {
      setPosting(false);
    }
  };

  const closePost = () => {
    setShowPost(false);
    setFile(null);
    setPreview(null);
    setCaption('');
    setAuthorName('');
    setPlaceName('');
    setPostError('');
  };

  // Like functionality (stored locally)
  const handleLike = (id) => {
    const isLiked = !likedMoments[id];
    const newLiked = { ...likedMoments, [id]: isLiked };
    setLikedMoments(newLiked);
    localStorage.setItem('koszeg_reels_likes', JSON.stringify(newLiked));
    
    // Increment or decrement local count
    const diff = isLiked ? 1 : -1;
    setLocalLikeCounts(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + diff
    }));
  };

  // Share functionality
  const handleShare = async (moment) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kőszeg Reels',
          text: moment.caption || 'Nézd meg ezt a pillanatot Kőszegről!',
          url: window.location.href
        });
      } catch (e) {
        console.log('Megosztás megszakítva');
      }
    } else {
      // Fallback: Copy URL to clipboard
      try {
        await navigator.clipboard.writeText(moment.photo_url);
        alert('Kép linkje vágólapra másolva!');
      } catch (err) {
        alert('Nem sikerült kimásolni a linket.');
      }
    }
  };

  // 5-second long press deletion logic – csak admin módban indul el
  const handleHoldStart = (id) => {
    if (!adminMode) return;
    setDeletingId(id);
    setDeleteProgress(0);
    const start = Date.now();

    holdProgressInterval.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min((elapsed / 5000) * 100, 100);
      setDeleteProgress(progress);
      if (progress >= 100) {
        clearInterval(holdProgressInterval.current);
      }
    }, 100);

    holdTimer.current = setTimeout(async () => {
      try {
        // Trigger deletion on Supabase
        await deleteMoment(id);
        setMoments((prev) => prev.filter((m) => m.id !== id));
        // Reset hold states
        setDeletingId(null);
        setDeleteProgress(0);
      } catch (err) {
        alert('Hiba a törlés során: ' + err.message);
        setDeletingId(null);
        setDeleteProgress(0);
      }
    }, 5000);
  };

  const handleHoldEnd = () => {
    setDeletingId(null);
    setDeleteProgress(0);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (holdProgressInterval.current) clearInterval(holdProgressInterval.current);
  };

  return (
    <div className="pb-12 px-4 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <FadeUp>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Camera className="w-6 h-6 text-cyan2-300" />
              <span>Kőszeg <span className="text-gradient">Reels</span></span>
            </h1>
            <p className="text-xs text-night-200/55 font-semibold mt-0.5">
              Pillanatok amelyek 24 óra múlva eltűnnek · {moments.length} aktív
            </p>
          </div>
          <button onClick={() => setShowPost(true)} className="btn-grad px-4 py-2.5 text-sm">
            <IoCameraOutline className="text-lg" />
            Posztolj!
          </button>
        </div>
      </FadeUp>

      {/* Admin mód jelző */}
      <AnimatePresence>
        {adminMode && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25"
          >
            <div className="flex items-center gap-2.5 text-emerald-200">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold leading-snug">
                Admin mód aktív · tartsd nyomva egy képet 5 mp-ig a törléshez
              </span>
            </div>
            <button
              onClick={() => setAdminMode(false)}
              className="shrink-0 text-[11px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Kilépés
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed */}
      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-[2rem] bg-white/[0.04] animate-pulse border border-white/5" />
          ))}
        </div>
      ) : moments.length === 0 ? (
        <FadeUp>
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-cyan2-300">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Még nincs egy pillanat sem!</h3>
            <p className="text-night-200/55 text-xs font-semibold max-w-xs leading-relaxed">
              Légy te az első, aki megmutatja a város jelenlegi arcát vagy időjárását!
            </p>
            <button onClick={() => setShowPost(true)} className="btn-grad px-6 py-3 text-sm">
              Posztolj most!
            </button>
          </div>
        </FadeUp>
      ) : (
        <div className="space-y-6">
          {moments.map((m, i) => {
            const hasLiked = !!likedMoments[m.id];
            // Mock base likes (based on created timestamp to make it feel alive)
            const seedLikes = Math.abs(m.id.charCodeAt(0) + m.id.charCodeAt(1)) % 15 + 2;
            const currentLikes = seedLikes + (localLikeCounts[m.id] || 0);
            const isThisDeleting = deletingId === m.id;

            return (
              <FadeUp key={m.id} delay={i * 0.02}>
                <div className="glass-card rounded-[2rem] overflow-hidden border border-white/10 relative flex flex-col">
                  
                  {/* Visual overlay for 5 seconds holding deletion process */}
                  {isThisDeleting && (
                    <div className="absolute inset-0 bg-rose-950/80 z-20 flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm pointer-events-none">
                      <div className="w-16 h-16 rounded-full border-4 border-rose-500/20 flex items-center justify-center text-rose-300 relative mb-3 overflow-hidden">
                        <Trash2 className="w-6 h-6 animate-pulse" />
                        <svg className="absolute inset-0 w-16 h-16 -rotate-90">
                          <circle
                            cx="32" cy="32" r="28"
                            fill="none" stroke="#f43f5e" strokeWidth="4"
                            strokeDasharray="176"
                            strokeDashoffset={176 - (176 * deleteProgress) / 100}
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-extrabold text-white uppercase tracking-wider">Fotó Törlése</p>
                      <p className="text-[10px] text-rose-200/60 font-semibold mt-1">Tartsd nyomva a kép törléséhez! (5mp)</p>
                    </div>
                  )}

                  {/* Header: User avatar + Timestamp */}
                  <div className="p-4 flex items-center justify-between border-b border-white/5 bg-[#0a1b1f]/30">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="leading-tight">
                        <h4 className="text-xs font-extrabold text-white">{m.author_name || 'Kőszegi Észlelő'}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-night-200/50" />
                          <span className="text-[10px] font-bold text-night-200/60">
                            {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: hu })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Location or Expiry */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/5">
                      <IoTimeOutline className="text-[10px] text-cyan2-300" />
                      <span className="text-[9px] font-extrabold text-cyan2-200 uppercase tracking-wider">
                        {timeLeft(m.expires_at)}
                      </span>
                    </div>
                  </div>

                  {/* Text Description */}
                  {m.caption && (
                    <div className="px-4 pt-3 pb-2">
                      <p className="text-xs text-night-100/90 leading-relaxed font-semibold">
                        {m.caption}
                      </p>
                    </div>
                  )}

                  {/* Media: Image with click lightbox and 5-sec hold event listeners */}
                  <div 
                    className="relative overflow-hidden cursor-pointer select-none bg-black/40 border-y border-white/5"
                    onClick={() => setActiveLightboxImage(m.photo_url)}
                    onMouseDown={() => handleHoldStart(m.id)}
                    onMouseUp={handleHoldEnd}
                    onMouseLeave={handleHoldEnd}
                    onTouchStart={() => handleHoldStart(m.id)}
                    onTouchEnd={handleHoldEnd}
                    onTouchCancel={handleHoldEnd}
                    title={adminMode ? 'Kattints a nagyításhoz · tartsd nyomva 5 mp-ig a törléshez' : 'Kattints a nagyításhoz'}
                  >
                    <img 
                      src={m.photo_url} 
                      alt="" 
                      className="w-full h-auto max-h-[420px] object-contain block hover:scale-[1.01] transition-transform duration-500" 
                      loading="lazy" 
                    />
                    
                    {(m.place_name || (m.lat && m.lng)) && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-cyan2-200 border border-cyan2-400/20 max-w-[70%]">
                        <MapPin className="w-3 h-3 text-cyan2-300 shrink-0" />
                        <span className="truncate">{m.place_name || 'Kőszeg'}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer: Like and Share buttons (Facebook-style) */}
                  <div className="p-3 flex items-center justify-between border-t border-white/5 bg-[#0a1b1f]/20">
                    <button 
                      onClick={() => handleLike(m.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                        hasLiked ? 'text-rose-400 bg-rose-400/10' : 'text-night-200 hover:bg-white/5'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                      <span className="text-xs font-bold">{currentLikes}</span>
                    </button>

                    <button 
                      onClick={() => handleShare(m)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-night-200 hover:bg-white/5 transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="text-xs font-bold">Megosztás</span>
                    </button>
                  </div>

                </div>
              </FadeUp>
            );
          })}
        </div>
      )}

      {/* --- FULLSCREEN LIGHTBOX MODAL (portál a body-ba, hogy mindent eltakarjon) --- */}
      {createPortal(
        <AnimatePresence>
        {activeLightboxImage && (
          <div
            className="fixed inset-0 z-[400] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
            onClick={() => setActiveLightboxImage(null)}
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setActiveLightboxImage(null)}
              aria-label="Bezárás"
              className="absolute top-5 right-5 w-12 h-12 rounded-full bg-black/70 hover:bg-rose-500 border-2 border-white/40 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all active:scale-90 z-[60]"
            >
              <X className="w-7 h-7" />
            </motion.button>

            {/* Halvány tipp, hogy a háttérre kattintva is bezárható */}
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[55] text-[11px] font-bold text-white/55 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full pointer-events-none">
              Koppints bárhová a bezáráshoz
            </span>

            <motion.img 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              src={activeLightboxImage} 
              alt="Moment nagyítva" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl relative z-10"
              onClick={e => e.stopPropagation()}
            />
          </div>
        )}
        </AnimatePresence>,
        document.body
      )}

      {/* Post modal */}
      <AnimatePresence>
        {showPost && (
          <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4" onClick={closePost}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }} transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
              transition={{ type: 'spring', stiffness: 440, damping: 34, mass: 0.7 }}
              className="relative w-full max-w-md bg-night-800 rounded-[2rem] p-6 flex flex-col gap-4 shadow-2xl border border-white/10"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-cyan2-300" />
                  <span>Pillanat megosztása</span>
                </h3>
                <button onClick={closePost} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                  <IoCloseOutline className="text-xl" />
                </button>
              </div>

              <label className="cursor-pointer">
                {preview ? (
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-white/10">
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <IoCameraOutline className="text-white text-4xl" />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-cyan2-400/40 aspect-[4/3] flex flex-col items-center justify-center gap-3 text-night-200/50 hover:border-cyan2-400 hover:text-cyan2-200 bg-brand-gradient-soft transition-all duration-300">
                    <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center text-white shadow-glow">
                      <IoCameraOutline className="text-3xl" />
                    </div>
                    <div className="text-center px-4">
                      <span className="text-sm font-extrabold text-white block">Kamera megnyitása</span>
                      <span className="text-[10px] font-semibold text-night-200/50 mt-1 block">Kattints ide egy élő fotó készítéséhez!</span>
                    </div>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>

              <input
                type="text"
                value={caption}
                onChange={e => { setCaption(e.target.value.slice(0, 120)); setPostError(''); }}
                placeholder="Rövid felirat... (opcionális)"
                className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-sm font-semibold placeholder:text-night-200/40 focus:outline-none focus:ring-2 focus:ring-cyan2-400/50"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <User className="w-4 h-4 text-cyan2-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={authorName}
                    onChange={e => { setAuthorName(e.target.value.slice(0, 40)); setPostError(''); }}
                    placeholder="Neved (opcionális)"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-sm font-semibold placeholder:text-night-200/40 focus:outline-none focus:ring-2 focus:ring-cyan2-400/50"
                  />
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-cyan2-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={placeName}
                    onChange={e => { setPlaceName(e.target.value.slice(0, 50)); setPostError(''); }}
                    placeholder="Helyszín – hol készült?"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-sm font-semibold placeholder:text-night-200/40 focus:outline-none focus:ring-2 focus:ring-cyan2-400/50"
                  />
                </div>
              </div>

              <button
                onClick={handleLocationToggle}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-bold transition-all ${
                  useLocation ? 'bg-brand-gradient-soft border-cyan2-400/40 text-cyan2-200' : 'border-white/10 text-night-200/50'
                }`}
              >
                <IoLocationOutline className="text-lg" />
                {useLocation && coords ? 'Helyzet hozzáadva ✓' : 'Helyzet hozzáadása (opcionális)'}
              </button>

              {postError && <p className="text-rose-300 text-xs font-extrabold text-center">{postError}</p>}

              <button onClick={handlePost} disabled={!file || posting} className="btn-grad w-full py-4 text-sm disabled:opacity-40">
                {posting ? <span className="animate-pulse">Feltöltés...</span> : <><IoSendOutline className="text-lg" /> Megosztom a pillanatot!</>}
              </button>

              <p className="text-night-200/40 text-[10px] font-semibold text-center">
                A fotód 24 óra múlva automatikusan eltűnik. Semmi személyes adatot nem gyűjtünk.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
