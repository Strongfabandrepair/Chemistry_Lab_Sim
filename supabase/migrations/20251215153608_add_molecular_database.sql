/*
  # Molecular Database Schema

  1. New Tables
    - `molecules` - Comprehensive molecular database with organic/inorganic compounds
    - `molecular_orbitals` - Quantum orbital information
    - `spectroscopy_data` - UV-Vis, IR, NMR, Mass Spec data
    - `tutorials` - Educational tutorials
    - `user_progress` - Tutorial completion tracking

  2. Modifications to existing tables
    - Add columns to existing reactions table for mechanism and energy profiles
    - Add columns to existing experiments table for collaboration features

  3. Security
    - Enable RLS on all new tables
    - Add public read policies for educational content
*/

CREATE TABLE IF NOT EXISTS molecules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  iupac_name text,
  formula text NOT NULL,
  smiles text,
  molecular_weight numeric NOT NULL,
  structure_type text DEFAULT 'organic',
  geometry text,
  bond_angles jsonb DEFAULT '[]'::jsonb,
  functional_groups text[] DEFAULT ARRAY[]::text[],
  properties jsonb DEFAULT '{}'::jsonb,
  safety_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS molecular_orbitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  molecule_id uuid REFERENCES molecules(id) ON DELETE CASCADE,
  orbital_type text NOT NULL,
  energy_level numeric NOT NULL,
  orbital_name text NOT NULL,
  electron_count integer DEFAULT 0,
  visualization_data jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS spectroscopy_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  molecule_id uuid REFERENCES molecules(id) ON DELETE CASCADE,
  spectrum_type text NOT NULL,
  peaks jsonb DEFAULT '[]'::jsonb,
  conditions jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS tutorials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  difficulty_level text DEFAULT 'beginner',
  category text NOT NULL,
  steps jsonb DEFAULT '[]'::jsonb,
  objectives text[] DEFAULT ARRAY[]::text[],
  prerequisites text[] DEFAULT ARRAY[]::text[],
  estimated_time integer DEFAULT 30,
  order_index integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  tutorial_id uuid REFERENCES tutorials(id) ON DELETE CASCADE,
  completed_steps integer[] DEFAULT ARRAY[]::integer[],
  completed boolean DEFAULT false,
  score numeric,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reactions' AND column_name = 'mechanism'
  ) THEN
    ALTER TABLE reactions ADD COLUMN mechanism jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reactions' AND column_name = 'energy_profile'
  ) THEN
    ALTER TABLE reactions ADD COLUMN energy_profile jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reactions' AND column_name = 'name'
  ) THEN
    ALTER TABLE reactions ADD COLUMN name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'experiments' AND column_name = 'shared_with'
  ) THEN
    ALTER TABLE experiments ADD COLUMN shared_with text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'experiments' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE experiments ADD COLUMN is_public boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'experiments' AND column_name = 'experiment_type'
  ) THEN
    ALTER TABLE experiments ADD COLUMN experiment_type text DEFAULT 'general';
  END IF;
END $$;

ALTER TABLE molecules ENABLE ROW LEVEL SECURITY;
ALTER TABLE molecular_orbitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE spectroscopy_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to molecules"
  ON molecules FOR SELECT
  USING (true);

CREATE POLICY "Public read access to molecular orbitals"
  ON molecular_orbitals FOR SELECT
  USING (true);

CREATE POLICY "Public read access to spectroscopy data"
  ON spectroscopy_data FOR SELECT
  USING (true);

CREATE POLICY "Public read access to tutorials"
  ON tutorials FOR SELECT
  USING (true);

CREATE POLICY "Public can insert progress"
  ON user_progress FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view all progress"
  ON user_progress FOR SELECT
  USING (true);

CREATE POLICY "Public can update progress"
  ON user_progress FOR UPDATE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_molecules_formula ON molecules(formula);
CREATE INDEX IF NOT EXISTS idx_molecules_structure_type ON molecules(structure_type);
CREATE INDEX IF NOT EXISTS idx_molecular_orbitals_molecule_id ON molecular_orbitals(molecule_id);
CREATE INDEX IF NOT EXISTS idx_spectroscopy_data_molecule_id ON spectroscopy_data(molecule_id);
CREATE INDEX IF NOT EXISTS idx_spectroscopy_data_type ON spectroscopy_data(spectrum_type);
CREATE INDEX IF NOT EXISTS idx_tutorials_category ON tutorials(category);
CREATE INDEX IF NOT EXISTS idx_tutorials_difficulty ON tutorials(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_tutorial_id ON user_progress(tutorial_id);