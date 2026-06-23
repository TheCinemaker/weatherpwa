/**
 * Netlify Function: send-push-alert
 *
 * Broadcasts a Web Push notification to all active subscribers.
 * Automatically removes expired (410) or gone (404) subscriptions.
 *
 * Method: POST
 * Body JSON:
 *   { title?: string, body: string, url?: string }
 *
 * Required environment variables (set in Netlify panel):
 *   VAPID_PUBLIC_KEY        — VAPID public key (same as VITE_VAPID_PUBLIC_KEY)
 *   VAPID_PRIVATE_KEY       — VAPID private key (NEVER expose in client code)
 *   SUPABASE_URL            — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Supabase service role key (bypasses RLS for reading all subs)
 */

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const CONTACT_EMAIL = 'mailto:avar.szilveszter@gmail.com';

export async function handler(event, context) {
  // --- CORS Preflight ---
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  // --- Parse request body ---
  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  const { title = 'Kőszegi Időjárás', body, url = '/' } = payload;

  if (!body || body.trim().length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing or empty notification "body" field' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  // --- VAPID configuration ---
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    console.error('[send-push-alert] VAPID keys are missing from environment.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'VAPID keys not configured on server.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  webpush.setVapidDetails(CONTACT_EMAIL, publicKey, privateKey);

  // --- Supabase client (server-side, service role) ---
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[send-push-alert] Supabase credentials missing.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Supabase not configured on server.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // --- Fetch all active subscriptions ---
  const { data: subscriptions, error: fetchError } = await supabase
    .from('push_subscriptions')
    .select('*');

  if (fetchError) {
    console.error('[send-push-alert] Supabase fetch error:', fetchError);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch subscriptions: ' + fetchError.message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  if (!subscriptions || subscriptions.length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'No subscribers found. 0 notifications sent.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  // --- Build push payload ---
  const notificationPayload = JSON.stringify({ title, body, url });

  // --- Send to all subscribers, collect results ---
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, notificationPayload);
        return { success: true, id: sub.id };
      } catch (err) {
        // 410 Gone or 404 Not Found → subscription expired, remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.warn(`[send-push-alert] Removing expired subscription: ${sub.endpoint}`);
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
          return { success: false, id: sub.id, deleted: true, reason: `HTTP ${err.statusCode}` };
        }
        console.error(`[send-push-alert] Push failed for ${sub.endpoint}:`, err.message);
        return { success: false, id: sub.id, deleted: false, reason: err.message };
      }
    })
  );

  const sent = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
  const deleted = results.filter((r) => r.status === 'fulfilled' && r.value.deleted).length;
  const failed = results.length - sent - deleted;

  console.log(`[send-push-alert] Done. sent=${sent}, deleted=${deleted}, failed=${failed}`);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Push broadcast complete.',
      total: subscriptions.length,
      sent,
      deleted,
      failed,
    }),
    headers: { 'Content-Type': 'application/json' },
  };
}
