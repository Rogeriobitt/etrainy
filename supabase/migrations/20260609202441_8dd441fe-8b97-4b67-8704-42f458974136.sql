UPDATE public.profiles
SET personal_trainer_id = '968abdcc-4cc1-4fb2-a133-0a6d8e3ada04',
    has_personal = true,
    updated_at = now()
WHERE user_id = 'f9a8f88b-fd27-4b13-9b6e-46c4110a1371'
  AND personal_trainer_id IS NULL;