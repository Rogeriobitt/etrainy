-- Add image_url to exercises catalog
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS image_url text;

-- Create public bucket for exercise images
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-images', 'exercise-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies
CREATE POLICY "Exercise images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'exercise-images');

CREATE POLICY "Admins can upload exercise images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'exercise-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update exercise images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'exercise-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete exercise images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'exercise-images' AND has_role(auth.uid(), 'admin'::app_role));