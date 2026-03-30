
CREATE TABLE public.student_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_trainer_id uuid NOT NULL REFERENCES public.personal_trainers(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  student_name text NOT NULL,
  student_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz
);

ALTER TABLE public.student_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personals can view their own invitations"
  ON public.student_invitations FOR SELECT TO authenticated
  USING (personal_trainer_id IN (
    SELECT id FROM public.personal_trainers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Personals can insert their own invitations"
  ON public.student_invitations FOR INSERT TO authenticated
  WITH CHECK (personal_trainer_id IN (
    SELECT id FROM public.personal_trainers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Personals can update their own invitations"
  ON public.student_invitations FOR UPDATE TO authenticated
  USING (personal_trainer_id IN (
    SELECT id FROM public.personal_trainers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Anyone can read invitation by token"
  ON public.student_invitations FOR SELECT TO anon, authenticated
  USING (true);
