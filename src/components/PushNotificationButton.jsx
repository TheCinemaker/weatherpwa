import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { supabase } from '../api/supabase';

/**
 * Converts a base64 URL-encoded VAPID public key string to a Uint8Array
 * as required by PushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Saves a push subscription to Supabase, upserting on endpoint conflict.
 */
async function saveSubscriptionToSupabase(sub) {
  if (!supabase) return;
  const subJson = sub.toJSON();
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        endpoint: sub.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      },
      { onConflict: 'endpoint' }
    );
  if (error) throw error;
}

/**
 * Removes a push subscription from Supabase by endpoint.
 */
async function removeSubscriptionFromSupabase(endpoint) {
  if (!supabase) return;
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint);
  if (error) throw error;
}

/**
 * PushNotificationButton — manages browser Web Push subscription lifecycle.
 *
 * Props:
 *   mode: 'desktop' (default) — renders a full-width button + description text
 *         'mobile'            — renders a compact icon-only button for the top bar
 */
export default function PushNotificationButton({ mode = 'desktop' }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [loading, setLoading] = useState(true);

  // Check if push is already active on mount
  useEffect(() => {
    async function checkSubscription() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsSupported(false);
        setLoading(false);
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } catch (e) {
        console.error('[PushButton] Error checking subscription:', e);
      } finally {
        setLoading(false);
      }
    }
    checkSubscription();
  }, []);

  const handleToggle = async () => {
    if (!isSupported) {
      alert('Ez a böngésző nem támogatja a push értesítéseket.\nPWA-ként telepített alkalmazásban működik.');
      return;
    }

    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const existingSub = await reg.pushManager.getSubscription();

      if (existingSub) {
        // --- UNSUBSCRIBE ---
        await existingSub.unsubscribe();
        await removeSubscriptionFromSupabase(existingSub.endpoint);
        setIsSubscribed(false);
      } else {
        // --- SUBSCRIBE ---
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Az értesítések engedélyezése szükséges a viharjelzések fogadásához.\nKérjük, engedélyezd a böngésző beállításaiban.');
          setLoading(false);
          return;
        }

        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          throw new Error('VITE_VAPID_PUBLIC_KEY nincs beállítva a .env fájlban.');
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        await saveSubscriptionToSupabase(sub);
        setIsSubscribed(true);

        // Confirmation notification
        new Notification('Kőszegi Időjárás', {
          body: 'Sikeresen feliratkoztál a viharjelzésekre!',
          icon: '/favicon.png',
        });
      }
    } catch (err) {
      console.error('[PushButton] Error toggling subscription:', err);
      alert('Hiba történt a feliratkozás módosításakor:\n' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- MOBILE icon-button variant ---
  if (mode === 'mobile') {
    return (
      <button
        onClick={handleToggle}
        disabled={loading || !isSupported}
        title={isSubscribed ? 'Viharjelzések aktívak — koppints a leiratkozáshoz' : 'Feliratkozás viharjelzésekre'}
        className={`w-9 h-9 flex items-center justify-center rounded-apple-inner transition-all disabled:opacity-40 ${
          isSubscribed
            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
            : 'bg-white/10 text-white/70'
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isSubscribed ? (
          <Bell className="w-4 h-4 text-emerald-400" />
        ) : (
          <BellOff className="w-4 h-4" />
        )}
      </button>
    );
  }

  // --- DESKTOP full-width variant ---
  return (
    <div className="space-y-1.5">
      <button
        onClick={handleToggle}
        disabled={loading || !isSupported}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-apple-inner text-xs font-bold transition-all disabled:opacity-40 ${
          isSubscribed
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
            : 'bg-white/5 border border-white/10 text-night-200/80 hover:bg-white/10 hover:text-white'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Betöltés…</span>
          </>
        ) : isSubscribed ? (
          <>
            <Bell className="w-4 h-4 text-emerald-400" />
            <span>Értesítések aktívak</span>
          </>
        ) : (
          <>
            <BellOff className="w-4 h-4 text-night-300" />
            <span>Kérem a viharjelzéseket</span>
          </>
        )}
      </button>
      <p className="text-[10px] font-semibold text-white/50 leading-relaxed px-0.5">
        {!isSupported
          ? 'Telepített PWA szükséges a push értesítésekhez.'
          : isSubscribed
          ? 'Viharjelzést kapsz a háttérben, ha az app nincs nyitva.'
          : 'Az értesítés a megnyitott app böngészőjén keresztül érkezik.'}
      </p>
    </div>
  );
}
