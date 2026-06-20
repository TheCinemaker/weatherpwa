import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { hu } from 'date-fns/locale';
import { IoCameraOutline, IoCloseOutline, IoLocationOutline, IoSendOutline, IoTimeOutline } from 'react-icons/io5';
import { supabase } from '../../api/supabase';
import { containsProfanity } from '../../utils/badWordsHU';
import { FadeUp } from '../../components/AppleMotion';

const BUCKET = 'moments';

function timeLeft(expiresAt) {
  const mins = differenceInMinutes(new Date(expiresAt), new Date());
  if (mins < 1) return 'hamarosan eltűnik';
  if (mins < 60) return `${mins} perc`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} óra`;
}

function compressImage(file, maxW = 1080) {
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
      canvas.toBlob(resolve, 'image/jpeg', 0.82);
    };
    img.src = url;
  });
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

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [useLocation, setUseLocation] = useState(false);
  const [coords, setCoords] = useState(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  useEffect(() => { document.title = 'Kőszeg Reels – 24 órás pillanatok'; }, []);

  const fetchMoments = useCallback(async () => {
    if (!supabase) { setMoments(MOCK_MOMENTS); setLoading(false); return; }
    try {
      const { data } = await supabase.from('city_moments').select('*').order('created_at', { ascending: false }).limit(40);
      if (data) setMoments(data.length > 0 ? data : MOCK_MOMENTS);
    } catch (err) {
      console.error(err);
      setMoments(MOCK_MOMENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMoments();
    if (supabase) {
      const channel = supabase
        .channel('realtime_moments_page')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'city_moments' }, (payload) => {
          setMoments((prev) => [payload.new, ...prev].slice(0, 40));
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
    if (caption && containsProfanity(caption)) { setPostError('Kérjük, kulturált szöveget írj! 🙏'); return; }
    if (!supabase) { setPostError('Supabase nincs konfigurálva a feltöltéshez.'); return; }

    setPosting(true);
    try {
      const blob = await compressImage(file);
      const filename = `moment_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(filename, blob, { contentType: 'image/jpeg' });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
      await supabase.from('city_moments').insert({
        photo_url: urlData.publicUrl,
        caption: caption.trim() || null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      });
      setShowPost(false);
      setFile(null);
      setPreview(null);
      setCaption('');
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
    setPostError('');
  };

  return (
    <div className="pb-12 px-4 max-w-4xl mx-auto">
      {/* Header */}
      <FadeUp>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              📸 Kőszeg <span className="text-gradient">Reels</span>
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

      {/* Feed */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-3xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : moments.length === 0 ? (
        <FadeUp>
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="text-6xl">📸</div>
            <h3 className="text-xl font-extrabold text-white">Még nincs egy pillanat sem!</h3>
            <p className="text-night-200/55 text-sm font-semibold max-w-xs">Légy te az első aki megmutatja milyen most Kőszeg!</p>
            <button onClick={() => setShowPost(true)} className="btn-grad px-6 py-3 text-sm">Posztolj most!</button>
          </div>
        </FadeUp>
      ) : (
        <div className="columns-2 sm:columns-3 gap-3 space-y-3">
          {moments.map((m, i) => (
            <FadeUp key={m.id} delay={i * 0.04}>
              <div className="break-inside-avoid rounded-2xl overflow-hidden relative group shadow-card border border-white/10 bg-white/[0.04]">
                <img src={m.photo_url} alt="" className="w-full object-cover block group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/45 backdrop-blur-sm text-white text-[10px] font-extrabold">
                  <IoTimeOutline className="text-xs" />
                  {timeLeft(m.expires_at)}
                </div>

                {m.lat && m.lng && (
                  <div className="absolute top-2 left-2 p-1.5 rounded-full bg-black/45 backdrop-blur-sm text-cyan2-200">
                    <IoLocationOutline className="text-xs" />
                  </div>
                )}

                {m.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{m.caption}</p>
                    <p className="text-white/60 text-[9px] font-bold mt-1">
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: hu })}
                    </p>
                  </div>
                )}
              </div>
            </FadeUp>
          ))}
        </div>
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
                <h3 className="text-lg font-extrabold text-white">📸 Pillanat megosztása</h3>
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
                      <span className="text-[10px] font-semibold text-night-200/50 mt-1 block">Kattints ide egy élő fotó készítéséhez! 📸</span>
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
