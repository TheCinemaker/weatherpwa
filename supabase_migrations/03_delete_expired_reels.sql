-- Create a function that deletes expired moments (expires_at in the past)
CREATE OR REPLACE FUNCTION delete_expired_moments()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.city_moments WHERE expires_at < now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that runs after every insert to clean up expired moments
DROP TRIGGER IF EXISTS cleanup_expired_moments_trigger ON public.city_moments;
CREATE TRIGGER cleanup_expired_moments_trigger
AFTER INSERT ON public.city_moments
FOR EACH STATEMENT
EXECUTE FUNCTION delete_expired_moments();
