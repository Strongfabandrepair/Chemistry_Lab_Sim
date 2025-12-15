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
