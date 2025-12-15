import { Element, Compound } from './supabase';

const R = 8.314;

export interface MixtureState {
  components: Array<{
    element?: Element;
    compound?: Compound;
    mass: number;
    moles: number;
  }>;
  temperature: number;
  pressure: number;
  volume: number;
  atmosphere: string;
}

export interface ReactionResult {
  products: Array<{ formula: string; mass: number; moles: number; color: string; description?: string }>;
  energy_change: number;
  temperature_change: number;
  phase_transitions: Array<{ substance: string; from: string; to: string }>;
  hazards: string[];
  visual_effects: VisualEffect[];
}

export interface VisualEffect {
  type: 'color_change' | 'gas_evolution' | 'precipitate' | 'heat' | 'light' | 'explosion';
  intensity: number;
  color?: string;
  duration: number;
}

export interface BondingInfo {
  bond_type: 'ionic' | 'covalent' | 'metallic' | 'none';
  bond_strength: number;
  polarity: number;
}

export class ChemistryEngine {
  private compoundNames: Record<string, string> = {
    'H2O': 'Water',
    'NaCl': 'Sodium Chloride (Table Salt)',
    'Fe2O3': 'Iron(III) Oxide (Rust)',
    'NH3': 'Ammonia',
    'CO2': 'Carbon Dioxide',
    'CuO': 'Copper(II) Oxide',
    'Al2O3': 'Aluminum Oxide',
    'MgO': 'Magnesium Oxide',
    'SO2': 'Sulfur Dioxide',
    'SO3': 'Sulfur Trioxide',
    'H2SO4': 'Sulfuric Acid',
    'HCl': 'Hydrochloric Acid',
    'NaOH': 'Sodium Hydroxide',
    'KCl': 'Potassium Chloride',
    'CaCO3': 'Calcium Carbonate',
    'Ca(OH)2': 'Calcium Hydroxide',
    'FeO': 'Iron(II) Oxide',
    'Fe3O4': 'Iron(II,III) Oxide (Magnetite)',
    'CuO2': 'Copper(II) Peroxide',
    'Cu2O': 'Copper(I) Oxide',
    'ZnO': 'Zinc Oxide',
    'AgCl': 'Silver Chloride',
    'PbO': 'Lead(II) Oxide',
    'TiO2': 'Titanium Dioxide',
    'SiO2': 'Silicon Dioxide (Quartz)',
    'CaO': 'Calcium Oxide (Quicklime)',
    'K2O': 'Potassium Oxide',
    'Na2O': 'Sodium Oxide',
    'Li2O': 'Lithium Oxide',
    'BaO': 'Barium Oxide',
    'SrO': 'Strontium Oxide',
    'MnO2': 'Manganese Dioxide',
    'Cr2O3': 'Chromium(III) Oxide',
    'NiO': 'Nickel(II) Oxide',
    'CoO': 'Cobalt(II) Oxide',
    'SnO2': 'Tin(IV) Oxide',
    'PbO2': 'Lead(IV) Oxide',
    'HgO': 'Mercury(II) Oxide',
    'Ag2O': 'Silver Oxide',
    'CdO': 'Cadmium Oxide',
    'NO': 'Nitric Oxide',
    'NO2': 'Nitrogen Dioxide',
    'N2O': 'Nitrous Oxide (Laughing Gas)',
    'N2O5': 'Dinitrogen Pentoxide',
    'P4O10': 'Phosphorus Pentoxide',
    'P2O5': 'Phosphorus Pentoxide',
    'Cl2O': 'Dichlorine Monoxide',
    'ClO2': 'Chlorine Dioxide',
    'Br2O': 'Dibromine Monoxide',
    'I2O5': 'Diiodine Pentoxide',
    'H2S': 'Hydrogen Sulfide',
    'H3PO4': 'Phosphoric Acid',
    'HNO3': 'Nitric Acid',
    'CH4': 'Methane',
    'C2H6': 'Ethane',
    'C3H8': 'Propane',
    'C6H12O6': 'Glucose',
    'NH4Cl': 'Ammonium Chloride',
    'NH4NO3': 'Ammonium Nitrate',
    'KNO3': 'Potassium Nitrate',
    'NaNO3': 'Sodium Nitrate',
    'BaCl2': 'Barium Chloride',
    'CaCl2': 'Calcium Chloride',
    'MgCl2': 'Magnesium Chloride',
    'FeCl2': 'Iron(II) Chloride',
    'FeCl3': 'Iron(III) Chloride',
    'CuCl2': 'Copper(II) Chloride',
    'ZnCl2': 'Zinc Chloride',
    'AlCl3': 'Aluminum Chloride',
    'LiCl': 'Lithium Chloride',
    'RbCl': 'Rubidium Chloride',
    'CsCl': 'Cesium Chloride',
    'NaBr': 'Sodium Bromide',
    'KBr': 'Potassium Bromide',
    'NaI': 'Sodium Iodide',
    'KI': 'Potassium Iodide',
    'NaF': 'Sodium Fluoride',
    'CaF2': 'Calcium Fluoride',
    'FeS': 'Iron(II) Sulfide',
    'FeS2': 'Iron Disulfide (Pyrite)',
    'ZnS': 'Zinc Sulfide',
    'PbS': 'Lead(II) Sulfide',
    'CuS': 'Copper(II) Sulfide',
    'Ag2S': 'Silver Sulfide',
    'HgS': 'Mercury(II) Sulfide',
    'CdS': 'Cadmium Sulfide',
    'Na2S': 'Sodium Sulfide',
    'K2S': 'Potassium Sulfide',
    'CaS': 'Calcium Sulfide',
    'BaS': 'Barium Sulfide'
  };

  predictBonding(element1: Element, element2: Element): BondingInfo {
    const enDiff = Math.abs(
      (element1.electronegativity || 0) - (element2.electronegativity || 0)
    );

    if (enDiff > 1.7) {
      return {
        bond_type: 'ionic',
        bond_strength: enDiff * 400,
        polarity: 1.0
      };
    } else if (enDiff > 0.4) {
      return {
        bond_type: 'covalent',
        bond_strength: 350 - enDiff * 50,
        polarity: enDiff / 1.7
      };
    } else if (element1.group_block === 'd' && element2.group_block === 'd') {
      return {
        bond_type: 'metallic',
        bond_strength: 200,
        polarity: 0
      };
    }

    return {
      bond_type: 'covalent',
      bond_strength: 300,
      polarity: 0
    };
  }

  predictReaction(mixture: MixtureState): ReactionResult {
    const components = mixture.components;
    const hazards: string[] = [];
    const visual_effects: VisualEffect[] = [];
    const products: Array<{ formula: string; mass: number; moles: number; color: string; description?: string }> = [];

    const elements = components
      .filter(c => c.element)
      .map(c => c.element!);

    if (elements.length < 2) {
      return {
        products: components.map(c => {
          const formula = c.element?.symbol || c.compound?.formula || 'Unknown';
          return {
            formula,
            mass: c.mass,
            moles: c.moles,
            color: c.element?.color || c.compound?.color || 'clear',
            description: c.element?.name || c.compound?.name || this.compoundNames[formula]
          };
        }),
        energy_change: 0,
        temperature_change: 0,
        phase_transitions: this.checkPhaseTransitions(mixture),
        hazards,
        visual_effects
      };
    }

    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const el1 = elements[i];
        const el2 = elements[j];
        const bonding = this.predictBonding(el1, el2);

        if (this.shouldReact(el1, el2, mixture.temperature, bonding)) {
          const reaction = this.simulateReaction(
            el1,
            el2,
            components[i].moles,
            components[j].moles,
            mixture.temperature,
            mixture.pressure,
            bonding
          );

          products.push(...reaction.products);
          hazards.push(...reaction.hazards);
          visual_effects.push(...reaction.visual_effects);
        }
      }
    }

    if (products.length === 0) {
      return {
        products: components.map(c => {
          const formula = c.element?.symbol || c.compound?.formula || 'Unknown';
          return {
            formula,
            mass: c.mass,
            moles: c.moles,
            color: c.element?.color || c.compound?.color || 'clear',
            description: c.element?.name || c.compound?.name || this.compoundNames[formula]
          };
        }),
        energy_change: 0,
        temperature_change: 0,
        phase_transitions: this.checkPhaseTransitions(mixture),
        hazards,
        visual_effects
      };
    }

    const total_energy = this.calculateEnergyChange(components, products, mixture.temperature);
    const temp_change = this.calculateTemperatureChange(total_energy, mixture);

    return {
      products,
      energy_change: total_energy,
      temperature_change: temp_change,
      phase_transitions: this.checkPhaseTransitions({
        ...mixture,
        temperature: mixture.temperature + temp_change
      }),
      hazards,
      visual_effects
    };
  }

  private shouldReact(
    el1: Element,
    el2: Element,
    temperature: number,
    bonding: BondingInfo
  ): boolean {
    if (!el1.electronegativity || !el2.electronegativity) return false;

    const enDiff = Math.abs(el1.electronegativity - el2.electronegativity);
    const activationEnergy = 50 / (enDiff + 0.1);
    const thermalEnergy = R * temperature / 1000;

    const reactionProbability = Math.exp(-activationEnergy / (R * temperature / 1000));

    if (el1.symbol === 'O' || el2.symbol === 'O') return temperature > 400 || Math.random() < 0.7;
    if (el1.symbol === 'F' || el2.symbol === 'F') return true;
    if (el1.symbol === 'Cl' || el2.symbol === 'Cl') return temperature > 300 || Math.random() < 0.5;

    if (el1.group_number === 1 || el2.group_number === 1) return true;
    if (el1.group_number === 2 || el2.group_number === 2) return temperature > 500 || Math.random() < 0.6;

    return thermalEnergy > activationEnergy || Math.random() < reactionProbability;
  }

  private simulateReaction(
    el1: Element,
    el2: Element,
    moles1: number,
    moles2: number,
    temperature: number,
    pressure: number,
    bonding: BondingInfo
  ): {
    products: Array<{ formula: string; mass: number; moles: number; color: string; description?: string }>;
    hazards: string[];
    visual_effects: VisualEffect[];
  } {
    const products: Array<{ formula: string; mass: number; moles: number; color: string; description?: string }> = [];
    const hazards: string[] = [];
    const visual_effects: VisualEffect[] = [];

    const oxidationState1 = this.getStableOxidationState(el1);
    const oxidationState2 = this.getStableOxidationState(el2);

    if (oxidationState1 === null || oxidationState2 === null) {
      return { products, hazards, visual_effects };
    }

    const ratio1 = Math.abs(oxidationState2);
    const ratio2 = Math.abs(oxidationState1);
    const gcd = this.gcd(ratio1, ratio2);
    const simplifiedRatio1 = ratio1 / gcd;
    const simplifiedRatio2 = ratio2 / gcd;

    const limitingMoles = Math.min(
      moles1 / simplifiedRatio1,
      moles2 / simplifiedRatio2
    );

    const productMoles = limitingMoles;
    const formula = this.generateFormula(el1.symbol, simplifiedRatio1, el2.symbol, simplifiedRatio2);
    const productMass = productMoles * (
      el1.atomic_mass * simplifiedRatio1 +
      el2.atomic_mass * simplifiedRatio2
    );

    const productColor = this.predictProductColor(el1, el2, bonding);
    const description = this.compoundNames[formula];

    products.push({
      formula,
      mass: productMass,
      moles: productMoles,
      color: productColor,
      description
    });

    if (el1.symbol === 'Na' && el2.symbol === 'Cl') {
      visual_effects.push({
        type: 'light',
        intensity: 1.2,
        color: 'yellow-orange',
        duration: 3000
      });
      visual_effects.push({
        type: 'heat',
        intensity: 1.0,
        duration: 4000
      });
    }

    if ((el1.symbol === 'H' && el2.symbol === 'O') || (el1.symbol === 'O' && el2.symbol === 'H')) {
      if (moles1 > 0.1 && moles2 > 0.1 && temperature > 500) {
        hazards.push('EXPLOSION RISK: Hydrogen and oxygen mixture above ignition temperature');
        visual_effects.push({
          type: 'explosion',
          intensity: 1.5,
          color: 'white-blue',
          duration: 1000
        });
      }
    }

    if (el1.group_number === 1 || el2.group_number === 1) {
      hazards.push('REACTIVE METAL: May react violently with water or air');
      visual_effects.push({
        type: 'heat',
        intensity: 1.3,
        duration: 5000
      });
    }

    if (bonding.bond_type === 'ionic' && bonding.bond_strength > 600) {
      visual_effects.push({
        type: 'light',
        intensity: 1.0,
        color: 'white',
        duration: 2500
      });
    }

    if (temperature > 1500 && bonding.bond_type === 'metallic') {
      visual_effects.push({
        type: 'light',
        intensity: 0.9,
        color: 'red-orange',
        duration: 10000
      });
    }

    return { products, hazards, visual_effects };
  }

  private getStableOxidationState(element: Element): number | null {
    if (!element.oxidation_states || element.oxidation_states.length === 0) {
      return null;
    }

    const positiveStates = element.oxidation_states.filter(s => s > 0);
    if (positiveStates.length > 0) {
      return positiveStates[positiveStates.length - 1];
    }

    const negativeStates = element.oxidation_states.filter(s => s < 0);
    if (negativeStates.length > 0) {
      return negativeStates[0];
    }

    return element.oxidation_states[0];
  }

  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  private generateFormula(
    symbol1: string,
    ratio1: number,
    symbol2: string,
    ratio2: number
  ): string {
    if (symbol1 < symbol2) {
      return `${symbol1}${ratio1 > 1 ? ratio1 : ''}${symbol2}${ratio2 > 1 ? ratio2 : ''}`;
    } else {
      return `${symbol2}${ratio2 > 1 ? ratio2 : ''}${symbol1}${ratio1 > 1 ? ratio1 : ''}`;
    }
  }

  private predictProductColor(el1: Element, el2: Element, bonding: BondingInfo): string {
    if (el1.symbol === 'Na' && el2.symbol === 'Cl') return 'white';
    if (el1.symbol === 'Cu' || el2.symbol === 'Cu') {
      if (el2.symbol === 'O' || el1.symbol === 'O') return 'black-red';
      return 'blue-green';
    }
    if (el1.symbol === 'Fe' || el2.symbol === 'Fe') {
      if (el2.symbol === 'O' || el1.symbol === 'O') return 'rust-red';
      return 'gray';
    }
    if (el1.symbol === 'Au' || el2.symbol === 'Au') return 'gold';
    if (el1.symbol === 'Ag' || el2.symbol === 'Ag') return 'white-gray';

    if (bonding.bond_type === 'ionic') return 'white';
    if (bonding.bond_type === 'metallic') return 'metallic-gray';

    return 'clear';
  }

  private calculateEnergyChange(
    reactants: MixtureState['components'],
    products: Array<{ formula: string; mass: number; moles: number }>,
    temperature: number
  ): number {
    let totalEnergy = 0;

    for (const reactant of reactants) {
      if (reactant.element) {
        totalEnergy -= reactant.element.ionization_energy * reactant.moles;
      }
    }

    totalEnergy += products.length * 400 * temperature / 298.15;

    return totalEnergy;
  }

  private calculateTemperatureChange(energyChange: number, mixture: MixtureState): number {
    const totalMass = mixture.components.reduce((sum, c) => sum + c.mass, 0);

    if (totalMass === 0) return 0;

    const avgSpecificHeat = 0.5;

    const tempChange = -energyChange / (totalMass * avgSpecificHeat);

    return tempChange;
  }

  checkPhaseTransitions(mixture: MixtureState): Array<{ substance: string; from: string; to: string }> {
    const transitions: Array<{ substance: string; from: string; to: string }> = [];

    for (const component of mixture.components) {
      if (component.element) {
        const el = component.element;
        const currentPhase = this.determinePhase(
          mixture.temperature,
          mixture.pressure,
          el.melting_point,
          el.boiling_point
        );

        if (currentPhase !== el.phase_at_stp) {
          transitions.push({
            substance: el.symbol,
            from: el.phase_at_stp,
            to: currentPhase
          });
        }
      }
    }

    return transitions;
  }

  private determinePhase(
    temperature: number,
    pressure: number,
    meltingPoint: number,
    boilingPoint: number
  ): 'solid' | 'liquid' | 'gas' {
    const pressureFactor = pressure / 1.0;
    const adjustedMelting = meltingPoint * Math.pow(pressureFactor, 0.1);
    const adjustedBoiling = boilingPoint * Math.pow(pressureFactor, 0.15);

    if (temperature < adjustedMelting) return 'solid';
    if (temperature < adjustedBoiling) return 'liquid';
    return 'gas';
  }

  calculateIdealGasProperties(mixture: MixtureState) {
    const totalMoles = mixture.components.reduce((sum, c) => sum + c.moles, 0);

    if (totalMoles === 0) return { pressure: 0, volume: 0, density: 0 };

    const calculatedPressure = (totalMoles * R * mixture.temperature) / mixture.volume;

    const totalMass = mixture.components.reduce((sum, c) => sum + c.mass, 0);
    const density = totalMass / mixture.volume;

    return {
      pressure: calculatedPressure,
      volume: mixture.volume,
      density,
      moles: totalMoles
    };
  }

  calculateGibbsFreeEnergy(
    enthalpy: number,
    entropy: number,
    temperature: number
  ): number {
    return enthalpy - temperature * entropy;
  }

  predictSpontaneity(gibbsEnergy: number): boolean {
    return gibbsEnergy < 0;
  }

  calculateEquilibriumConstant(gibbsEnergy: number, temperature: number): number {
    return Math.exp(-gibbsEnergy / (R * temperature));
  }
}

export const chemistryEngine = new ChemistryEngine();
