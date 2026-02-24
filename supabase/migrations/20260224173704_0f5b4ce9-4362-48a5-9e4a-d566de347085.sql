
-- Create video_classes table
CREATE TABLE public.video_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT NOT NULL,
  calories TEXT,
  tag TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_classes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view
CREATE POLICY "Authenticated users can view video classes"
ON public.video_classes FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only creator can insert
CREATE POLICY "Users can insert their own video classes"
ON public.video_classes FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Only creator can update
CREATE POLICY "Users can update their own video classes"
ON public.video_classes FOR UPDATE
USING (auth.uid() = created_by);

-- Only creator can delete
CREATE POLICY "Users can delete their own video classes"
ON public.video_classes FOR DELETE
USING (auth.uid() = created_by);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('class-videos', 'class-videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('class-thumbnails', 'class-thumbnails', true);

-- Storage policies for class-videos
CREATE POLICY "Public can view class videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'class-videos');

CREATE POLICY "Authenticated users can upload class videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'class-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own class videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'class-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own class videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'class-videos' AND auth.uid() IS NOT NULL);

-- Storage policies for class-thumbnails
CREATE POLICY "Public can view class thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'class-thumbnails');

CREATE POLICY "Authenticated users can upload class thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'class-thumbnails' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own class thumbnails"
ON storage.objects FOR UPDATE
USING (bucket_id = 'class-thumbnails' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own class thumbnails"
ON storage.objects FOR DELETE
USING (bucket_id = 'class-thumbnails' AND auth.uid() IS NOT NULL);
