ALTER TABLE public.workout_plans
  ADD COLUMN IF NOT EXISTS validity_months integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS expiry_warning_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS expired_notified_at timestamptz;

ALTER TABLE public.workout_plans
  ADD CONSTRAINT workout_plans_validity_months_check CHECK (validity_months IN (1,2,3));

CREATE INDEX IF NOT EXISTS idx_workout_plans_expires_at ON public.workout_plans(expires_at);

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;