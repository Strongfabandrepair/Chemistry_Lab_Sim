import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Element {
  id: number;
  symbol: string;
  name: string;
  atomic_mass: number;
  electron_config: string;
  electronegativity: number | null;
  ionization_energy: number;
  electron_affinity: number;
  atomic_radius: number;
  melting_point: number;
  boiling_point: number;
  density: number;
  specific_heat: number;
  thermal_conductivity: number;
  oxidation_states: number[];
  crystal_structure: string;
  magnetic_properties: string;
  color: string;
  phase_at_stp: 'solid' | 'liquid' | 'gas';
  group_block: 's' | 'p' | 'd' | 'f';
  period: number;
  group_number: number | null;
  is_radioactive: boolean;
  half_life: number | null;
}

export interface Compound {
  id: string;
  formula: string;
  name: string;
  molecular_mass: number;
  structure: any;
  melting_point: number;
  boiling_point: number;
  density: number;
  enthalpy_formation: number;
  entropy: number;
  gibbs_energy: number;
  solubility: Record<string, number>;
  color: string;
  hazards: string[];
  created_at: string;
}

export interface Reaction {
  id: string;
  reaction_type: string;
  reactants: Array<{ formula: string; coefficient: number }>;
  products: Array<{ formula: string; coefficient: number }>;
  conditions: {
    temperature?: number;
    pressure?: number;
    catalyst?: string;
  };
  enthalpy_change: number;
  entropy_change: number;
  activation_energy: number;
  rate_constant: number;
  equilibrium_constant: number;
  is_reversible: boolean;
  created_at: string;
}

export interface Experiment {
  id: string;
  user_id: string;
  title: string;
  description: string;
  temperature: number;
  pressure: number;
  volume: number;
  atmosphere: string;
  results: any;
  visual_state: any;
  created_at: string;
  updated_at: string;
}

export interface MixtureComponent {
  id: string;
  experiment_id: string;
  element_id?: number;
  compound_id?: string;
  mass: number;
  moles: number;
  added_at: string;
  sequence: number;
}

export interface Molecule {
  id: string;
  name: string;
  iupac_name: string | null;
  formula: string;
  smiles: string | null;
  molecular_weight: number;
  structure_type: 'organic' | 'inorganic' | 'coordination';
  geometry: string | null;
  bond_angles: any[];
  functional_groups: string[];
  properties: {
    boiling_point?: number;
    melting_point?: number;
    polarity?: string;
    soluble_in_water?: boolean;
    pka?: number;
    [key: string]: any;
  };
  safety_info: {
    hazards?: string[];
    toxicity?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface MolecularOrbital {
  id: string;
  molecule_id: string;
  orbital_type: 'bonding' | 'antibonding' | 'nonbonding';
  energy_level: number;
  orbital_name: string;
  electron_count: number;
  visualization_data: any;
}

export interface SpectroscopyData {
  id: string;
  molecule_id: string;
  spectrum_type: 'uv_vis' | 'ir' | 'nmr' | 'mass_spec';
  peaks: Array<{
    wavelength?: number;
    wavenumber?: number;
    chemical_shift?: number;
    intensity: number | string;
    assignment?: string;
    [key: string]: any;
  }>;
  conditions: {
    solvent?: string;
    temperature?: number;
    [key: string]: any;
  };
}

export interface Tutorial {
  id: string;
  title: string;
  description: string | null;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  steps: Array<{
    step: number;
    title: string;
    content: string;
    action: string;
    [key: string]: any;
  }>;
  objectives: string[];
  prerequisites: string[];
  estimated_time: number;
  order_index: number;
}

export interface UserProgress {
  id: string;
  user_id: string;
  tutorial_id: string;
  completed_steps: number[];
  completed: boolean;
  score: number | null;
  started_at: string;
  completed_at: string | null;
}
