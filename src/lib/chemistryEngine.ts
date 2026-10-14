import type { Element, Compound } from './supabase';

const R = 8.314462618; // J mol−1 K−1
const R_ATM = 0.082057366; // L atm mol−1 K−1
export interface MixtureState {
  /** Amounts are moles of atoms for elemental inputs, not moles of H2 / O2. */
  components: Array<{ element?: Element; compound?: Compound; mass: number; moles: number }>;
  temperature: number;
  pressure: number;
  volume: number;
  atmosphere: string;
}
export interface VisualEffect {
  type: 'color_change' | 'gas_evolution' | 'precipitate' | 'heat' | 'light' | 'explosion';
  intensity: number;
  color?: string;
  duration: number;
}
export interface ReactionProduct {
  formula: string;
  mass: number;
  moles: number;
  color: string;
  description?: string;
}
export interface ReactionResult {
  status: 'reacted' | 'conditions-not-met' | 'unsupported' | 'no-reaction';
  message: string;
  equation?: string;
  products: ReactionProduct[];
  remaining: ReactionProduct[];
  /** Total kJ for the modeled extent, using standard formation enthalpies. */
  energy_change: number;
  /** Isothermal model: the temperature setpoint is held constant. */
  temperature_change: number;
  phase_transitions: Array<{ substance: string; from: string; to: string }>;
  hazards: string[];
  visual_effects: VisualEffect[];
}
export interface BondingInfo {
  bond_type: 'ionic' | 'covalent' | 'metallic' | 'none';
  bond_strength: number;
  polarity: number;
}
interface ReactionModel {
  atoms: [string, number, string, number];
  formula: string;
  name: string;
  equation: string;
  minTemperature: number;
  enthalpy: number;
  color: string;
}
/** Limited, idealized complete-conversion models, not kinetics or equilibrium predictions.
 * ΔfH° values in kJ/mol (298 K): common tabulated reference values.
 * Thresholds are educational activation gates, not experimentally predicted ignition points.
 */
export const reactionModels: ReactionModel[] = [
  {
    atoms: ['H', 2, 'O', 1],
    formula: 'H2O',
    name: 'Water vapor',
    equation: '2 H₂ + O₂ → 2 H₂O',
    minTemperature: 773.15,
    enthalpy: -241.826,
    color: '#98c8e8',
  },
  {
    atoms: ['Na', 1, 'Cl', 1],
    formula: 'NaCl',
    name: 'Sodium chloride',
    equation: '2 Na + Cl₂ → 2 NaCl',
    minTemperature: 298.15,
    enthalpy: -411.12,
    color: '#e4edf0',
  },
  {
    atoms: ['C', 1, 'O', 2],
    formula: 'CO2',
    name: 'Carbon dioxide',
    equation: 'C + O₂ → CO₂',
    minTemperature: 873.15,
    enthalpy: -393.51,
    color: '#a3bbc8',
  },
  {
    atoms: ['Mg', 1, 'O', 1],
    formula: 'MgO',
    name: 'Magnesium oxide',
    equation: '2 Mg + O₂ → 2 MgO',
    minTemperature: 923.15,
    enthalpy: -601.6,
    color: '#e7e8ee',
  },
  {
    atoms: ['Fe', 2, 'O', 3],
    formula: 'Fe2O3',
    name: 'Iron(III) oxide',
    equation: '4 Fe + 3 O₂ → 2 Fe₂O₃',
    minTemperature: 573.15,
    enthalpy: -824.2,
    color: '#b86449',
  },
  {
    atoms: ['Cu', 1, 'O', 1],
    formula: 'CuO',
    name: 'Copper(II) oxide',
    equation: '2 Cu + O₂ → 2 CuO',
    minTemperature: 573.15,
    enthalpy: -155.2,
    color: '#49494f',
  },
  {
    atoms: ['Al', 2, 'O', 3],
    formula: 'Al2O3',
    name: 'Aluminum oxide',
    equation: '4 Al + 3 O₂ → 2 Al₂O₃',
    minTemperature: 1200,
    enthalpy: -1675.7,
    color: '#d9e1e5',
  },
];

export function validateMixture(mixture: MixtureState): void {
  for (const [name, value] of Object.entries({
    temperature: mixture.temperature,
    pressure: mixture.pressure,
    volume: mixture.volume,
  })) {
    if (!Number.isFinite(value) || value <= 0)
      throw new Error(`${name} must be a finite number greater than zero.`);
  }
  for (const c of mixture.components) {
    if (!Number.isFinite(c.mass) || !Number.isFinite(c.moles) || c.mass <= 0 || c.moles <= 0) {
      throw new Error('Component mass and amount must be finite and greater than zero.');
    }
    const molarMass = c.element?.atomic_mass ?? c.compound?.molecular_mass;
    if (!molarMass || Math.abs(c.mass - c.moles * molarMass) > Math.max(1e-6, c.mass * 1e-5)) {
      throw new Error('Component mass and amount are inconsistent.');
    }
  }
}

export class ChemistryEngine {
  predictReaction(mixture: MixtureState): ReactionResult {
    validateMixture(mixture);
    const components = mixture.components;
    const remaining = components.map((c) => ({
      formula: c.element?.symbol ?? c.compound?.formula ?? '?',
      mass: c.mass,
      moles: c.moles,
      color: c.element?.color ?? 'gray',
      description: c.element?.name ?? c.compound?.name,
    }));
    const hazards = components.flatMap((c) => {
      const el = c.element;
      if (!el) return c.compound?.hazards ?? [];
      return [
        ...(el.is_radioactive ? [`${el.name} is radioactive.`] : []),
        ...(['F', 'Cl', 'Br', 'Hg', 'Pb', 'As', 'Cd'].includes(el.symbol)
          ? [`${el.name} presents serious toxicity or corrosivity hazards.`]
          : []),
        ...(el.group_number === 1 && el.symbol !== 'H'
          ? [`${el.name} is a highly reactive alkali metal.`]
          : []),
      ];
    });
    const base: ReactionResult = {
      status: components.length < 2 ? 'no-reaction' : 'unsupported',
      message:
        components.length < 2
          ? 'Add a second element to explore a reaction.'
          : 'No validated model for this mixture. Inputs are unchanged; this does not imply chemical inertness.',
      products: [],
      remaining,
      energy_change: 0,
      temperature_change: 0,
      phase_transitions: this.checkPhaseTransitions(mixture),
      hazards,
      visual_effects: [],
    };
    // Exactly two distinct elemental inputs: no fabricated multi-reactant products.
    if (components.length !== 2 || components.some((c) => !c.element)) return base;
    const model = reactionModels.find(
      (m) =>
        m.atoms[0] !== m.atoms[2] &&
        components.some((c) => c.element?.symbol === m.atoms[0]) &&
        components.some((c) => c.element?.symbol === m.atoms[2]),
    );
    if (!model) return base;
    base.equation = model.equation;
    if (mixture.temperature < model.minTemperature) {
      return {
        ...base,
        status: 'conditions-not-met',
        message: `This educational model requires a temperature of at least ${model.minTemperature.toFixed(2)} K. No conversion was applied.`,
      };
    }
    const first = components.find((c) => c.element?.symbol === model.atoms[0])!;
    const second = components.find((c) => c.element?.symbol === model.atoms[2])!;
    const extent = Math.min(first.moles / model.atoms[1], second.moles / model.atoms[3]);
    const productMass =
      extent *
      (first.element!.atomic_mass * model.atoms[1] + second.element!.atomic_mass * model.atoms[3]);
    const leftovers = remaining
      .map((c) => {
        const input = components.find((x) => x.element?.symbol === c.formula)!;
        const coefficient = c.formula === model.atoms[0] ? model.atoms[1] : model.atoms[3];
        const moles = Math.max(0, c.moles - coefficient * extent);
        return { ...c, moles, mass: moles * input.element!.atomic_mass };
      })
      .filter((c) => c.moles > 1e-12);
    return {
      ...base,
      status: 'reacted',
      message:
        'Idealized complete conversion of the limiting reactant. Temperature is held constant; kinetics and equilibrium are not modeled.',
      products: [
        {
          formula: model.formula,
          description: model.name,
          mass: productMass,
          moles: extent,
          color: model.color,
        },
      ],
      remaining: leftovers,
      energy_change: extent * model.enthalpy,
      hazards: [
        ...hazards,
        'Exothermic reaction: heat release may be hazardous.',
        ...(model.formula === 'H2O' ? ['Hydrogen–oxygen mixtures can explode when ignited.'] : []),
      ],
      visual_effects: [{ type: 'heat', intensity: 0.5, duration: 1500 }],
    };
  }

  checkPhaseTransitions(mixture: MixtureState) {
    return mixture.components.flatMap((c) => {
      if (!c.element) return [];
      const el = c.element;
      // Reference phase only: pressure-dependent phase equilibria are not modeled.
      const to =
        mixture.temperature >= el.boiling_point
          ? 'gas'
          : mixture.temperature >= el.melting_point
            ? 'liquid'
            : 'solid';
      return to !== el.phase_at_stp ? [{ substance: el.symbol, from: el.phase_at_stp, to }] : [];
    });
  }

  /** Treats component amounts as gas-particle moles supplied by the caller. */
  calculateIdealGasProperties(mixture: MixtureState) {
    validateMixture(mixture);
    const moles = mixture.components.reduce((sum, c) => sum + c.moles, 0);
    const mass = mixture.components.reduce((sum, c) => sum + c.mass, 0);
    return {
      pressure: (moles * R_ATM * mixture.temperature) / mixture.volume,
      volume: mixture.volume,
      density: mass / mixture.volume,
      moles,
    };
  }
  /** Enthalpy in kJ/mol, entropy in J/(mol K), result in kJ/mol. */
  calculateGibbsFreeEnergy(enthalpy: number, entropy: number, temperature: number) {
    return enthalpy - (temperature * entropy) / 1000;
  }
  predictSpontaneity(gibbsEnergy: number) {
    return gibbsEnergy < 0;
  }
  calculateEquilibriumConstant(gibbsEnergy: number, temperature: number) {
    if (!Number.isFinite(temperature) || temperature <= 0)
      throw new Error('Temperature must be positive.');
    return Math.exp((-gibbsEnergy * 1000) / (R * temperature));
  }
  predictBonding(a: Element, b: Element): BondingInfo {
    if (a.electronegativity === null || b.electronegativity === null)
      return { bond_type: 'none', bond_strength: 0, polarity: 0 };
    const difference = Math.abs(a.electronegativity - b.electronegativity);
    return {
      bond_type: difference > 1.7 ? 'ionic' : 'covalent',
      bond_strength: 0,
      polarity: Math.min(1, difference / 1.7),
    };
  }
}
export const chemistryEngine = new ChemistryEngine();
