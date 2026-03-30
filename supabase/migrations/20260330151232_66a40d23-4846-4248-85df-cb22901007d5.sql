
CREATE POLICY "Allow anon and authenticated to insert personal_trainers"
ON public.personal_trainers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
