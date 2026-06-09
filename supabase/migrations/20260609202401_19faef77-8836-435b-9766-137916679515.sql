CREATE OR REPLACE FUNCTION public.accept_invitation(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  WHERE token = _token
  LIMIT 1;

  IF _inv.id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  -- Ensure a profile row exists for the caller (handle_new_user trigger normally creates it)
  INSERT INTO public.profiles (user_id, personal_trainer_id, has_personal)
  VALUES (_caller, _inv.personal_trainer_id, true)
  ON CONFLICT (user_id) DO UPDATE
    SET personal_trainer_id = EXCLUDED.personal_trainer_id,
        has_personal = true,
        updated_at = now();

  -- Mark invitation as used (idempotent)
  UPDATE public.student_invitations
  SET status = 'used', used_at = COALESCE(used_at, now())
  WHERE id = _inv.id AND status = 'pending';

  RETURN _inv.personal_trainer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;