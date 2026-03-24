
-- Create exercises table
CREATE TABLE public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  muscle_group text NOT NULL,
  equipment_type text NOT NULL,
  suggested_level text NOT NULL DEFAULT 'Iniciante',
  short_description text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read
CREATE POLICY "Anyone authenticated can view exercises"
  ON public.exercises FOR SELECT TO authenticated
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage exercises"
  ON public.exercises FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
