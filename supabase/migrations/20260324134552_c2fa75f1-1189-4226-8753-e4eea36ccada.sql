-- Personal trainers table
CREATE TABLE public.personal_trainers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  personal_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text,
  gym_name text,
  experience text,
  cref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_trainers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personals can view their own record"
ON public.personal_trainers FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Personals can insert their own record"
ON public.personal_trainers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Personals can update their own record"
ON public.personal_trainers FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow students to look up their personal trainer by code
CREATE POLICY "Anyone authenticated can lookup by code"
ON public.personal_trainers FOR SELECT
TO authenticated
USING (true);

-- Add personal_trainer_id to profiles so students can reference their PT
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS personal_trainer_id uuid REFERENCES public.personal_trainers(id);

-- Trigger to update updated_at
CREATE TRIGGER update_personal_trainers_updated_at
  BEFORE UPDATE ON public.personal_trainers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Sequence for generating PT codes
CREATE SEQUENCE IF NOT EXISTS personal_code_seq START 10001;