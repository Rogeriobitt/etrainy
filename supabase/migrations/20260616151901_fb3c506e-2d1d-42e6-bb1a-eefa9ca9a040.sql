-- 1) Fix accept_invitation to reject already-used tokens
CREATE OR REPLACE FUNCTION public.accept_invitation(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _caller uuid := auth.uid();
  _inv RECORD;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, personal_trainer_id, status
  INTO _inv
  FROM public.student_invitations
  WHERE token = _token AND status = 'pending'
  LIMIT 1;

  IF _inv.id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or already used';
  END IF;

  INSERT INTO public.profiles (user_id, personal_trainer_id, has_personal)
  VALUES (_caller, _inv.personal_trainer_id, true)
  ON CONFLICT (user_id) DO UPDATE
    SET personal_trainer_id = EXCLUDED.personal_trainer_id,
        has_personal = true,
        updated_at = now();

  UPDATE public.student_invitations
  SET status = 'used', used_at = COALESCE(used_at, now())
  WHERE id = _inv.id AND status = 'pending';

  RETURN _inv.personal_trainer_id;
END;
$function$;

-- 2) Restrict video_classes writes to admins only
DROP POLICY IF EXISTS "Authenticated users can insert video classes" ON public.video_classes;
DROP POLICY IF EXISTS "Users can insert video classes" ON public.video_classes;
DROP POLICY IF EXISTS "Creators can insert video classes" ON public.video_classes;
DROP POLICY IF EXISTS "Users can update their video classes" ON public.video_classes;
DROP POLICY IF EXISTS "Creators can update video classes" ON public.video_classes;
DROP POLICY IF EXISTS "Users can delete their video classes" ON public.video_classes;
DROP POLICY IF EXISTS "Creators can delete video classes" ON public.video_classes;

CREATE POLICY "Admins can insert video classes"
  ON public.video_classes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update video classes"
  ON public.video_classes
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete video classes"
  ON public.video_classes
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));