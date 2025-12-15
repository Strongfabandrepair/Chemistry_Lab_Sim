-- Add Known Chemical Recipes
--
-- This migration adds a table for storing known chemical recipes
-- and populates it with common chemical reactions and mixtures
-- for educational demonstrations.

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT DEFAULT 'beginner',
  ingredients JSONB NOT NULL,
  temperature NUMERIC DEFAULT 298.15,
  pressure NUMERIC DEFAULT 1.0,
  volume NUMERIC DEFAULT 1.0,
  atmosphere TEXT DEFAULT 'air',
  expected_products JSONB,
  safety_notes TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipes are viewable by everyone"
  ON recipes FOR SELECT
  TO authenticated
  USING (true);

-- Insert common chemical recipes
INSERT INTO recipes (name, description, category, difficulty, ingredients, temperature, pressure, atmosphere, expected_products, safety_notes) VALUES
(
  'Water Formation',
  'Combine hydrogen and oxygen to form water. This is a highly exothermic reaction.',
  'Synthesis',
  'intermediate',
  '[{"element_id": 1, "mass": 0.202, "moles": 0.1}, {"element_id": 8, "mass": 1.6, "moles": 0.1}]',
  298.15,
  1.0,
  'air',
  '[{"formula": "H2O", "mass": 1.802, "description": "Water"}]',
  ARRAY['Explosive when ignited', 'Keep away from sparks', 'Use low quantities']
),
(
  'Table Salt Formation',
  'Combine sodium and chlorine to create sodium chloride (table salt).',
  'Synthesis',
  'beginner',
  '[{"element_id": 11, "mass": 2.3, "moles": 0.1}, {"element_id": 17, "mass": 3.545, "moles": 0.1}]',
  298.15,
  1.0,
  'air',
  '[{"formula": "NaCl", "mass": 5.845, "description": "Sodium Chloride"}]',
  ARRAY['Produces bright light', 'Exothermic reaction', 'Sodium is highly reactive']
),
(
  'Iron Rust Formation',
  'Expose iron to oxygen to form iron oxide (rust).',
  'Oxidation',
  'beginner',
  '[{"element_id": 26, "mass": 5.585, "moles": 0.1}, {"element_id": 8, "mass": 2.4, "moles": 0.15}]',
  298.15,
  1.0,
  'air',
  '[{"formula": "Fe2O3", "mass": 7.985, "description": "Iron(III) Oxide"}]',
  ARRAY['Slow reaction at room temperature', 'Increase temperature to speed up']
),
(
  'Ammonia Synthesis',
  'Combine nitrogen and hydrogen to create ammonia via the Haber process.',
  'Synthesis',
  'advanced',
  '[{"element_id": 7, "mass": 2.8, "moles": 0.2}, {"element_id": 1, "mass": 0.606, "moles": 0.6}]',
  673.15,
  200.0,
  'nitrogen',
  '[{"formula": "NH3", "mass": 3.406, "description": "Ammonia"}]',
  ARRAY['Requires high pressure and temperature', 'Use catalyst for better yield']
),
(
  'Carbon Dioxide Formation',
  'Combust carbon in oxygen to produce carbon dioxide.',
  'Combustion',
  'beginner',
  '[{"element_id": 6, "mass": 1.201, "moles": 0.1}, {"element_id": 8, "mass": 3.2, "moles": 0.2}]',
  500.0,
  1.0,
  'oxygen',
  '[{"formula": "CO2", "mass": 4.401, "description": "Carbon Dioxide"}]',
  ARRAY['Exothermic reaction', 'Produces heat']
),
(
  'Copper Oxide Formation',
  'Heat copper in air to form copper(II) oxide.',
  'Oxidation',
  'beginner',
  '[{"element_id": 29, "mass": 6.355, "moles": 0.1}, {"element_id": 8, "mass": 0.8, "moles": 0.05}]',
  600.0,
  1.0,
  'air',
  '[{"formula": "CuO", "mass": 7.155, "description": "Copper(II) Oxide"}]',
  ARRAY['Color change from red to black', 'Moderate temperature required']
),
(
  'Aluminum Oxide Formation',
  'React aluminum with oxygen to create aluminum oxide.',
  'Oxidation',
  'intermediate',
  '[{"element_id": 13, "mass": 5.396, "moles": 0.2}, {"element_id": 8, "mass": 2.4, "moles": 0.15}]',
  800.0,
  1.0,
  'oxygen',
  '[{"formula": "Al2O3", "mass": 7.796, "description": "Aluminum Oxide"}]',
  ARRAY['Very exothermic', 'Produces intense heat and light']
),
(
  'Methane Combustion',
  'Complete combustion of carbon and hydrogen to simulate methane burning.',
  'Combustion',
  'intermediate',
  '[{"element_id": 6, "mass": 1.201, "moles": 0.1}, {"element_id": 1, "mass": 0.404, "moles": 0.4}, {"element_id": 8, "mass": 6.4, "moles": 0.4}]',
  600.0,
  1.0,
  'oxygen',
  '[{"formula": "CO2", "mass": 4.401}, {"formula": "H2O", "mass": 3.604}]',
  ARRAY['Highly exothermic', 'Produces flame', 'Ensure adequate oxygen']
),
(
  'Magnesium Combustion',
  'Burn magnesium in oxygen to produce magnesium oxide.',
  'Combustion',
  'beginner',
  '[{"element_id": 12, "mass": 2.431, "moles": 0.1}, {"element_id": 8, "mass": 0.8, "moles": 0.05}]',
  650.0,
  1.0,
  'oxygen',
  '[{"formula": "MgO", "mass": 3.231, "description": "Magnesium Oxide"}]',
  ARRAY['Produces brilliant white light', 'Do not look directly at flame', 'Very exothermic']
),
(
  'Sulfuric Acid Precursor',
  'Combine sulfur and oxygen to form sulfur dioxide (first step in sulfuric acid production).',
  'Synthesis',
  'intermediate',
  '[{"element_id": 16, "mass": 3.207, "moles": 0.1}, {"element_id": 8, "mass": 3.2, "moles": 0.2}]',
  450.0,
  1.0,
  'oxygen',
  '[{"formula": "SO2", "mass": 6.407, "description": "Sulfur Dioxide"}]',
  ARRAY['Toxic gas produced', 'Use in well-ventilated area', 'Causes acid rain']
)
ON CONFLICT (id) DO NOTHING;