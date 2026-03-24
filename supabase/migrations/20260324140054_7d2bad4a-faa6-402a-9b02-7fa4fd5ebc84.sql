
-- Workout plans table
CREATE TABLE public.workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  objective text NOT NULL,
  level text NOT NULL,
  days_per_week int NOT NULL,
  division text NOT NULL,
  training_location text,
  status text NOT NULL DEFAULT 'aguardando_revisao_personal',
  personal_trainer_id uuid REFERENCES public.personal_trainers(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plans" ON public.workout_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own plans" ON public.workout_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own plans" ON public.workout_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own plans" ON public.workout_plans FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Personals can view their students plans" ON public.workout_plans FOR SELECT TO authenticated USING (personal_trainer_id IN (SELECT id FROM public.personal_trainers WHERE user_id = auth.uid()));

-- Workout days table
CREATE TABLE public.workout_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id uuid NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  name text NOT NULL,
  muscle_groups text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.workout_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workout days" ON public.workout_days FOR SELECT USING (
  workout_plan_id IN (SELECT id FROM public.workout_plans WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert their own workout days" ON public.workout_days FOR INSERT WITH CHECK (
  workout_plan_id IN (SELECT id FROM public.workout_plans WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update their own workout days" ON public.workout_days FOR UPDATE USING (
  workout_plan_id IN (SELECT id FROM public.workout_plans WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete their own workout days" ON public.workout_days FOR DELETE USING (
  workout_plan_id IN (SELECT id FROM public.workout_plans WHERE user_id = auth.uid())
);
CREATE POLICY "Personals can view student workout days" ON public.workout_days FOR SELECT TO authenticated USING (
  workout_plan_id IN (SELECT id FROM public.workout_plans WHERE personal_trainer_id IN (SELECT id FROM public.personal_trainers WHERE user_id = auth.uid()))
);

-- Workout exercises table
CREATE TABLE public.workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_day_id uuid NOT NULL REFERENCES public.workout_days(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  sets text NOT NULL,
  reps text NOT NULL,
  notes text,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exercises" ON public.workout_exercises FOR SELECT USING (
  workout_day_id IN (SELECT id FROM public.workout_days WHERE workout_plan_id IN (SELECT id FROM public.workout_plans WHERE user_id = auth.uid()))
);
CREATE POLICY "Users can insert their own exercises" ON public.workout_exercises FOR INSERT WITH CHECK (
  workout_day_id IN (SELECT id FROM public.workout_days WHERE workout_plan_id IN (SELECT id FROM public.workout_plans WHERE user_id = auth.uid()))
);
CREATE POLICY "Users can update their own exercises" ON public.workout_exercises FOR UPDATE USING (
  workout_day_id IN (SELECT id FROM public.workout_days WHERE workout_plan_id IN (SELECT id FROM public.workout_plans WHERE user_id = auth.uid()))
);
CREATE POLICY "Users can delete their own exercises" ON public.workout_exercises FOR DELETE USING (
  workout_day_id IN (SELECT id FROM public.workout_days WHERE workout_plan_id IN (SELECT id FROM public.workout_plans WHERE user_id = auth.uid()))
);
CREATE POLICY "Personals can view student exercises" ON public.workout_exercises FOR SELECT TO authenticated USING (
  workout_day_id IN (SELECT id FROM public.workout_days WHERE workout_plan_id IN (SELECT id FROM public.workout_plans WHERE personal_trainer_id IN (SELECT id FROM public.personal_trainers WHERE user_id = auth.uid())))
);

-- Trigger for updated_at on workout_plans
CREATE TRIGGER update_workout_plans_updated_at BEFORE UPDATE ON public.workout_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
