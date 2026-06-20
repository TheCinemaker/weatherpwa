-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule a cron job to delete expired moments from the database every hour
SELECT cron.schedule(
    'delete-expired-moments',
    '0 * * * *', -- Runs every hour at minute 0
    $$ DELETE FROM public.city_moments WHERE expires_at < now() $$
);
