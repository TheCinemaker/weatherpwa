-- ============================================================
-- Migration 15: Create push_subscriptions table
-- Used to store Web Push subscription data for clients.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint   TEXT        NOT NULL UNIQUE,
    p256dh     TEXT        NOT NULL,
    auth       TEXT        NOT NULL,
    user_agent TEXT,
    platform   TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- Enable Row Level Security (RLS)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow public insert (clients can subscribe)
CREATE POLICY "Allow public insert to push_subscriptions"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (true);

-- Allow public select (clients can check their subscription status)
CREATE POLICY "Allow public select of push_subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (true);

-- Allow public delete (clients can unsubscribe)
CREATE POLICY "Allow public delete from push_subscriptions"
ON public.push_subscriptions
FOR DELETE
USING (true);
