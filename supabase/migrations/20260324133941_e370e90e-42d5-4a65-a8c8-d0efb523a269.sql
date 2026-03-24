ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS sex text,
ADD COLUMN IF NOT EXISTS experience_level text,
ADD COLUMN IF NOT EXISTS training_days text,
ADD COLUMN IF NOT EXISTS training_location text,
ADD COLUMN IF NOT EXISTS has_injury boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS injury_description text,
ADD COLUMN IF NOT EXISTS has_personal boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS personal_code text;