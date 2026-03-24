CREATE OR REPLACE FUNCTION public.nextval_personal_code()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nextval('personal_code_seq');
$$;