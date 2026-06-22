-- Allow public delete access to city_moments
-- This enables Laci to delete inappropriate posts by holding down on them for 5 seconds
CREATE POLICY "Allow public delete access to city_moments" 
ON public.city_moments 
FOR DELETE 
USING (true);
