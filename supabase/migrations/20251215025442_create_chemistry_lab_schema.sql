-- Chemistry Laboratory Simulator - Core Schema
--
-- Research-grade chemistry simulator database for storing elemental data,
-- compounds, reactions, and experimental results.
--
-- Tables:
-- 1. elements: Complete periodic table with comprehensive properties
-- 2. compounds: Database of known chemical compounds
-- 3. reactions: Known chemical reactions and patterns
-- 4. experiments: User-created experiments and simulations
-- 5. mixture_components: Components added to each experiment
--
-- Security: RLS enabled on all tables with appropriate access policies

-- Elements table: All 118 elements with research-grade properties
CREATE TABLE IF NOT EXISTS elements (
  id INTEGER PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  atomic_mass NUMERIC,
  electron_config TEXT,
  electronegativity NUMERIC,
  ionization_energy NUMERIC,
  electron_affinity NUMERIC,
  atomic_radius NUMERIC,
  melting_point NUMERIC,
  boiling_point NUMERIC,
  density NUMERIC,
  specific_heat NUMERIC,
  thermal_conductivity NUMERIC,
  oxidation_states JSONB DEFAULT '[]',
  crystal_structure TEXT,
  magnetic_properties TEXT,
  color TEXT,
  phase_at_stp TEXT,
  group_block TEXT,
  period INTEGER,
  group_number INTEGER,
  is_radioactive BOOLEAN DEFAULT false,
  half_life NUMERIC
);

-- Compounds table: Known chemical compounds with properties
CREATE TABLE IF NOT EXISTS compounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formula TEXT NOT NULL,
  name TEXT NOT NULL,
  molecular_mass NUMERIC,
  structure JSONB,
  melting_point NUMERIC,
  boiling_point NUMERIC,
  density NUMERIC,
  enthalpy_formation NUMERIC,
  entropy NUMERIC,
  gibbs_energy NUMERIC,
  solubility JSONB,
  color TEXT,
  hazards JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reactions table: Known chemical reactions
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reaction_type TEXT NOT NULL,
  reactants JSONB NOT NULL,
  products JSONB NOT NULL,
  conditions JSONB,
  enthalpy_change NUMERIC,
  entropy_change NUMERIC,
  activation_energy NUMERIC,
  rate_constant NUMERIC,
  equilibrium_constant NUMERIC,
  is_reversible BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Experiments table: User-created simulations
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  temperature NUMERIC DEFAULT 298.15,
  pressure NUMERIC DEFAULT 1.0,
  volume NUMERIC DEFAULT 1.0,
  atmosphere TEXT DEFAULT 'air',
  results JSONB,
  visual_state JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Mixture components: What's in each experiment
CREATE TABLE IF NOT EXISTS mixture_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  element_id INTEGER REFERENCES elements(id),
  compound_id UUID REFERENCES compounds(id),
  mass NUMERIC NOT NULL,
  moles NUMERIC NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  sequence INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_elements_symbol ON elements(symbol);
CREATE INDEX IF NOT EXISTS idx_compounds_formula ON compounds(formula);
CREATE INDEX IF NOT EXISTS idx_experiments_user ON experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_mixture_experiment ON mixture_components(experiment_id);

-- Enable Row Level Security
ALTER TABLE elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE compounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mixture_components ENABLE ROW LEVEL SECURITY;

-- RLS Policies for elements (public read access)
CREATE POLICY "Elements are viewable by everyone"
  ON elements FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for compounds (public read, authenticated create)
CREATE POLICY "Compounds are viewable by everyone"
  ON compounds FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create compounds"
  ON compounds FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for reactions (public read, authenticated create)
CREATE POLICY "Reactions are viewable by everyone"
  ON reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create reactions"
  ON reactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for experiments (users can CRUD their own)
CREATE POLICY "Users can view own experiments"
  ON experiments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own experiments"
  ON experiments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own experiments"
  ON experiments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own experiments"
  ON experiments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for mixture_components (cascade from experiments)
CREATE POLICY "Users can view own mixture components"
  ON mixture_components FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM experiments
      WHERE experiments.id = mixture_components.experiment_id
      AND experiments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own mixture components"
  ON mixture_components FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM experiments
      WHERE experiments.id = mixture_components.experiment_id
      AND experiments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own mixture components"
  ON mixture_components FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM experiments
      WHERE experiments.id = mixture_components.experiment_id
      AND experiments.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM experiments
      WHERE experiments.id = mixture_components.experiment_id
      AND experiments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own mixture components"
  ON mixture_components FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM experiments
      WHERE experiments.id = mixture_components.experiment_id
      AND experiments.user_id = auth.uid()
    )
  );