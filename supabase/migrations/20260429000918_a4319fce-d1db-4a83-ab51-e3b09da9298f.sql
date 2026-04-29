-- Reset total: apaga professores, alunos e dados vinculados, mantendo admins e catálogo
DELETE FROM public.workout_exercises;
DELETE FROM public.workout_days;
DELETE FROM public.workout_plans;
DELETE FROM public.progress_entries;
DELETE FROM public.bioimpedance_uploads;
DELETE FROM public.student_invitations;
DELETE FROM public.notifications;
DELETE FROM public.personal_trainers;

DELETE FROM public.profiles
  WHERE user_id NOT IN (SELECT user_id FROM public.user_roles WHERE role = 'admin');

DELETE FROM public.user_roles WHERE role <> 'admin';

DELETE FROM auth.users
  WHERE id NOT IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  );

ALTER SEQUENCE public.personal_code_seq RESTART WITH 1;