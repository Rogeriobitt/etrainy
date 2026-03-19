
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can manage roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Create bioimpedance_uploads table
CREATE TABLE public.bioimpedance_uploads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    notes text,
    uploaded_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bioimpedance_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own uploads"
ON public.bioimpedance_uploads FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own uploads"
ON public.bioimpedance_uploads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploads"
ON public.bioimpedance_uploads FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for bioimpedance PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('bioimpedance', 'bioimpedance', false);

CREATE POLICY "Users can upload their own bioimpedance files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bioimpedance' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own bioimpedance files"
ON storage.objects FOR SELECT
USING (bucket_id = 'bioimpedance' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own bioimpedance files"
ON storage.objects FOR DELETE
USING (bucket_id = 'bioimpedance' AND auth.uid()::text = (storage.foldername(name))[1]);
