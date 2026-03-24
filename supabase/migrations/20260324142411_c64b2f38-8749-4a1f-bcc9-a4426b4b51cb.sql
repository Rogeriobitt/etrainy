
-- Exercise equivalents mapping table
CREATE TABLE public.exercise_equivalents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_exercise text NOT NULL,
  bodyweight_equivalent text NOT NULL,
  freeweight_equivalent text NOT NULL,
  limited_space_equivalent text
);

-- Seed with common equivalences
INSERT INTO public.exercise_equivalents (original_exercise, bodyweight_equivalent, freeweight_equivalent, limited_space_equivalent) VALUES
('Supino reto com barra', 'Flexão de braço', 'Supino com halteres', 'Flexão de braço'),
('Supino inclinado com halteres', 'Flexão declinada (pés elevados)', 'Supino inclinado com halteres', 'Flexão declinada'),
('Crossover na polia', 'Flexão diamante', 'Crucifixo com halteres', 'Flexão diamante'),
('Tríceps corda na polia', 'Mergulho no banco', 'Tríceps francês com halter', 'Mergulho no banco'),
('Tríceps francês', 'Mergulho entre bancos', 'Tríceps francês com halter', 'Mergulho entre bancos'),
('Tríceps corda', 'Mergulho no banco', 'Tríceps francês com halter', 'Mergulho no banco'),
('Puxada frontal', 'Barra fixa', 'Remada curvada com halteres', 'Barra fixa (porta)'),
('Remada curvada', 'Remada invertida', 'Remada curvada com halteres', 'Remada invertida'),
('Remada unilateral', 'Remada invertida unilateral', 'Remada unilateral com halter', 'Remada invertida'),
('Rosca direta com barra', 'Rosca com peso corporal (toalha)', 'Rosca com halteres', 'Rosca isométrica'),
('Rosca alternada', 'Rosca com peso corporal', 'Rosca alternada com halteres', 'Rosca isométrica'),
('Rosca direta', 'Rosca com peso corporal (toalha)', 'Rosca com halteres', 'Rosca isométrica'),
('Rosca martelo', 'Rosca com toalha (pegada neutra)', 'Rosca martelo com halteres', 'Rosca isométrica neutra'),
('Agachamento livre', 'Agachamento com peso corporal', 'Agachamento com halteres', 'Agachamento com peso corporal'),
('Leg press 45°', 'Agachamento búlgaro', 'Agachamento búlgaro com halteres', 'Agachamento búlgaro'),
('Leg press', 'Agachamento búlgaro', 'Agachamento búlgaro com halteres', 'Agachamento búlgaro'),
('Cadeira extensora', 'Extensão de perna deitado', 'Extensão com elástico', 'Extensão de perna deitado'),
('Mesa flexora', 'Flexão nórdica (auxiliada)', 'Stiff com halteres', 'Ponte com uma perna'),
('Panturrilha em pé', 'Panturrilha em pé (degrau)', 'Panturrilha com halteres', 'Panturrilha no degrau'),
('Abdominal infra', 'Elevação de pernas', 'Elevação de pernas', 'Elevação de pernas'),
('Desenvolvimento com halteres', 'Pike push-up', 'Desenvolvimento com halteres', 'Pike push-up'),
('Desenvolvimento', 'Pike push-up', 'Desenvolvimento com halteres', 'Pike push-up'),
('Elevação lateral', 'Elevação lateral com garrafas', 'Elevação lateral com halteres', 'Elevação lateral com garrafas'),
('Supino reto', 'Flexão de braço', 'Supino com halteres', 'Flexão de braço');

-- Allow all authenticated users to read equivalents
ALTER TABLE public.exercise_equivalents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view equivalents"
  ON public.exercise_equivalents
  FOR SELECT
  TO authenticated
  USING (true);
