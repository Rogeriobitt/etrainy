ALTER TABLE public.student_invitations ADD COLUMN IF NOT EXISTS personal_name text;

CREATE INDEX IF NOT EXISTS idx_student_invitations_personal_trainer_id
  ON public.student_invitations(personal_trainer_id);

CREATE OR REPLACE FUNCTION public.get_personal_public_info(_personal_id uuid)
RETURNS TABLE(id uuid, full_name text, personal_code text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, full_name, personal_code
  FROM public.personal_trainers
  WHERE id = _personal_id
$$;

CREATE OR REPLACE FUNCTION public.get_personal_by_code(_code text)
RETURNS TABLE(id uuid, full_name text, personal_code text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, full_name, personal_code
  FROM public.personal_trainers
  WHERE personal_code = _code
$$;

GRANT EXECUTE ON FUNCTION public.get_personal_public_info(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_personal_by_code(text) TO anon, authenticated;