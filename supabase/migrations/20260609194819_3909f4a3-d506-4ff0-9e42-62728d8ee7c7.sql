
-- 1) personal_trainers: drop permissive policies
DROP POLICY IF EXISTS "Anyone authenticated can lookup by code" ON public.personal_trainers;
DROP POLICY IF EXISTS "Allow anon and authenticated to insert personal_trainers" ON public.personal_trainers;

-- helper to fetch trainer user_id (used by student-side notification flow)
CREATE OR REPLACE FUNCTION public.get_personal_user_id(_personal_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.personal_trainers WHERE id = _personal_id
$$;
REVOKE ALL ON FUNCTION public.get_personal_user_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_personal_user_id(uuid) TO authenticated;

-- 2) student_invitations: drop broad SELECT, add secure RPCs
DROP POLICY IF EXISTS "Anyone can read invitation by token" ON public.student_invitations;

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token text)
RETURNS TABLE(id uuid, student_email text, student_name text, personal_trainer_id uuid, personal_name text, status text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT si.id, si.student_email, si.student_name, si.personal_trainer_id,
         pt.full_name AS personal_name, si.status
  FROM public.student_invitations si
  LEFT JOIN public.personal_trainers pt ON pt.id = si.personal_trainer_id
  WHERE si.token = _token AND si.status = 'pending'
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_invitation_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_invitation(_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _updated int;
BEGIN
  UPDATE public.student_invitations
  SET status = 'used', used_at = now()
  WHERE token = _token AND status = 'pending';
  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated > 0;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_invitation(text) TO anon, authenticated;

-- 3) notifications: restrict INSERT to self; add validated RPC for cross-user
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert their own notifications"
  ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid, _type text, _title text, _message text, _link text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _allowed boolean := false;
  _new_id uuid;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _caller = _user_id THEN
    _allowed := true;
  ELSE
    -- caller is a personal trainer notifying one of their students
    IF EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.personal_trainers pt ON pt.id = p.personal_trainer_id
      WHERE p.user_id = _user_id AND pt.user_id = _caller
    ) THEN
      _allowed := true;
    END IF;

    -- caller is a student notifying their personal trainer
    IF NOT _allowed AND EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.personal_trainers pt ON pt.id = p.personal_trainer_id
      WHERE p.user_id = _caller AND pt.user_id = _user_id
    ) THEN
      _allowed := true;
    END IF;
  END IF;

  IF NOT _allowed THEN
    RAISE EXCEPTION 'Not allowed to create notification for this user';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, link, read)
  VALUES (_user_id, _type, _title, _message, _link, false)
  RETURNING id INTO _new_id;
  RETURN _new_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text) TO authenticated;

-- 4) Storage: restrict class-videos / class-thumbnails write ops to admins
DROP POLICY IF EXISTS "Authenticated users can upload class videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own class videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own class videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload class thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own class thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own class thumbnails" ON storage.objects;

CREATE POLICY "Admins can upload class videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'class-videos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update class videos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'class-videos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete class videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'class-videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload class thumbnails"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'class-thumbnails' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update class thumbnails"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'class-thumbnails' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete class thumbnails"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'class-thumbnails' AND public.has_role(auth.uid(), 'admin'));
