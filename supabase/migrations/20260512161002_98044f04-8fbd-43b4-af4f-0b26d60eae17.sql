UPDATE public.profiles p
SET full_name = si.student_name
FROM public.student_invitations si
WHERE (p.full_name IS NULL OR p.full_name = '')
  AND p.personal_trainer_id IS NOT NULL
  AND p.personal_trainer_id = si.personal_trainer_id
  AND lower(p.email) = lower(si.student_email);

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.email IS NULL
  AND p.user_id = u.id;

UPDATE public.profiles p
SET full_name = si.student_name
FROM public.student_invitations si
JOIN auth.users u ON lower(u.email) = lower(si.student_email)
WHERE (p.full_name IS NULL OR p.full_name = '')
  AND p.user_id = u.id
  AND p.personal_trainer_id = si.personal_trainer_id;