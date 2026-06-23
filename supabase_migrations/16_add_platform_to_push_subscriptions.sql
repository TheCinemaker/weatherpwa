-- ============================================================
-- Migration 16: Add user_agent and platform to push_subscriptions
-- Allows tracking which device/browser subscribed.
-- ============================================================

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS platform   TEXT;
