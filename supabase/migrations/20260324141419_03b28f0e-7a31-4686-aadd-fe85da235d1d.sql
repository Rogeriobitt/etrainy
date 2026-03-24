
-- Personal trainers can update their students' workout plans (to approve/edit)
CREATE POLICY "Personals can update student plans"
ON public.workout_plans
FOR UPDATE
TO authenticated
USING (personal_trainer_id IN (
  SELECT id FROM personal_trainers WHERE user_id = auth.uid()
));

-- Personal trainers can insert workout days for their students' plans
CREATE POLICY "Personals can insert student workout days"
ON public.workout_days
FOR INSERT
TO authenticated
WITH CHECK (workout_plan_id IN (
  SELECT id FROM workout_plans
  WHERE personal_trainer_id IN (
    SELECT id FROM personal_trainers WHERE user_id = auth.uid()
  )
));

-- Personal trainers can update student workout days
CREATE POLICY "Personals can update student workout days"
ON public.workout_days
FOR UPDATE
TO authenticated
USING (workout_plan_id IN (
  SELECT id FROM workout_plans
  WHERE personal_trainer_id IN (
    SELECT id FROM personal_trainers WHERE user_id = auth.uid()
  )
));

-- Personal trainers can delete student workout days
CREATE POLICY "Personals can delete student workout days"
ON public.workout_days
FOR DELETE
TO authenticated
USING (workout_plan_id IN (
  SELECT id FROM workout_plans
  WHERE personal_trainer_id IN (
    SELECT id FROM personal_trainers WHERE user_id = auth.uid()
  )
));

-- Personal trainers can insert exercises for their students
CREATE POLICY "Personals can insert student exercises"
ON public.workout_exercises
FOR INSERT
TO authenticated
WITH CHECK (workout_day_id IN (
  SELECT wd.id FROM workout_days wd
  JOIN workout_plans wp ON wd.workout_plan_id = wp.id
  WHERE wp.personal_trainer_id IN (
    SELECT id FROM personal_trainers WHERE user_id = auth.uid()
  )
));

-- Personal trainers can update student exercises
CREATE POLICY "Personals can update student exercises"
ON public.workout_exercises
FOR UPDATE
TO authenticated
USING (workout_day_id IN (
  SELECT wd.id FROM workout_days wd
  JOIN workout_plans wp ON wd.workout_plan_id = wp.id
  WHERE wp.personal_trainer_id IN (
    SELECT id FROM personal_trainers WHERE user_id = auth.uid()
  )
));

-- Personal trainers can delete student exercises
CREATE POLICY "Personals can delete student exercises"
ON public.workout_exercises
FOR DELETE
TO authenticated
USING (workout_day_id IN (
  SELECT wd.id FROM workout_days wd
  JOIN workout_plans wp ON wd.workout_plan_id = wp.id
  WHERE wp.personal_trainer_id IN (
    SELECT id FROM personal_trainers WHERE user_id = auth.uid()
  )
));

-- Personal trainers can insert workout plans for their students
CREATE POLICY "Personals can insert student plans"
ON public.workout_plans
FOR INSERT
TO authenticated
WITH CHECK (
  personal_trainer_id IN (
    SELECT id FROM personal_trainers WHERE user_id = auth.uid()
  )
  AND user_id IN (
    SELECT p.user_id FROM profiles p
    WHERE p.personal_trainer_id IN (
      SELECT id FROM personal_trainers WHERE user_id = auth.uid()
    )
  )
);

-- Personals can view student profiles
CREATE POLICY "Personals can view student profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  personal_trainer_id IN (
    SELECT id FROM personal_trainers WHERE user_id = auth.uid()
  )
);
