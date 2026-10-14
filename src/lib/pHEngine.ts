import { Element, Molecule } from './supabase';

interface AcidBaseProperties {
  pH: number;
  pOH: number;
  hydroniumConcentration: number;
  hydroxideConcentration: number;
  isAcidic: boolean;
  isBasic: boolean;
  isNeutral: boolean;
}

export interface TitrationPoint {
  volumeAdded: number;
  pH: number;
  isEquivalencePoint: boolean;
}

interface RedoxReaction {
  oxidationHalf: string;
  reductionHalf: string;
  overallReaction: string;
  cellPotential: number;
  spontaneous: boolean;
  electronTransfer: number;
}

export class PHEngine {
  private readonly KW = 1e-14;

  calculatepH(hydroniumConcentration: number): number {
    if (hydroniumConcentration <= 0) return 7;
    return -Math.log10(hydroniumConcentration);
  }

  calculatepOH(hydroxideConcentration: number): number {
    if (hydroxideConcentration <= 0) return 7;
    return -Math.log10(hydroxideConcentration);
  }

  calculateHydroniumFrompH(pH: number): number {
    return Math.pow(10, -pH);
  }

  calculateHydroxideFrompOH(pOH: number): number {
    return Math.pow(10, -pOH);
  }

  analyzeAcidBase(pH: number): AcidBaseProperties {
    const hydroniumConcentration = this.calculateHydroniumFrompH(pH);
    const hydroxideConcentration = this.KW / hydroniumConcentration;
    const pOH = this.calculatepOH(hydroxideConcentration);

    return {
      pH,
      pOH,
      hydroniumConcentration,
      hydroxideConcentration,
      isAcidic: pH < 7,
      isBasic: pH > 7,
      isNeutral: Math.abs(pH - 7) < 0.1,
    };
  }

  calculateWeakAcidpH(concentration: number, Ka: number): number {
    const hydroniumConcentration = Math.sqrt(Ka * concentration);
    return this.calculatepH(hydroniumConcentration);
  }

  calculateWeakBasepH(concentration: number, Kb: number): number {
    const hydroxideConcentration = Math.sqrt(Kb * concentration);
    const pOH = this.calculatepOH(hydroxideConcentration);
    return 14 - pOH;
  }

  calculateBufferpH(
    acidConcentration: number,
    conjugateBaseConcentration: number,
    pKa: number,
  ): number {
    return pKa + Math.log10(conjugateBaseConcentration / acidConcentration);
  }

  simulateTitration(
    acidConcentration: number,
    acidVolume: number,
    baseConcentration: number,
    maxBaseVolume: number,
    pKa: number = 4.76,
    steps: number = 100,
  ): TitrationPoint[] {
    if (
      !Number.isInteger(steps) ||
      steps < 1 ||
      steps > 10000 ||
      !Number.isFinite(maxBaseVolume) ||
      maxBaseVolume < 0
    ) {
      throw new Error('Invalid titration range or step count.');
    }
    const equivalenceVolume = (acidConcentration * acidVolume) / baseConcentration;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const volumeAdded = (maxBaseVolume * i) / steps;
      return {
        volumeAdded,
        pH: this.calculateTitrationpH(
          acidConcentration,
          acidVolume,
          baseConcentration,
          volumeAdded,
          pKa,
        ),
        isEquivalencePoint: Math.abs(volumeAdded - equivalenceVolume) < 1e-8,
      };
    });
  }

  /** Monoprotic acid titrated with a strong base at 25°C. Volumes in mL.
   * Solve electroneutrality, including water autoionization, rather than switching
   * between discontinuous approximations around the equivalence point.
   */
  calculateTitrationpH(
    acidConcentration: number,
    acidVolume: number,
    baseConcentration: number,
    baseVolume: number,
    pKa = 4.76,
  ): number {
    if (
      ![acidConcentration, acidVolume, baseConcentration].every(
        (v) => Number.isFinite(v) && v > 0,
      ) ||
      !Number.isFinite(baseVolume) ||
      baseVolume < 0 ||
      !Number.isFinite(pKa)
    ) {
      throw new Error(
        'Concentrations and acid volume must be positive; added base volume cannot be negative.',
      );
    }
    const totalVolume = acidVolume + baseVolume;
    const acid = (acidConcentration * acidVolume) / totalVolume;
    const sodium = (baseConcentration * baseVolume) / totalVolume;
    const Ka = 10 ** -pKa;
    let low = -3,
      high = 17;
    for (let i = 0; i < 90; i++) {
      const mid = (low + high) / 2;
      const h = 10 ** -mid;
      const balance = h + sodium - this.KW / h - (acid * Ka) / (Ka + h);
      if (balance > 0) low = mid;
      else high = mid;
    }
    return (low + high) / 2;
  }

  predictpKa(molecule: Molecule): number | null {
    if (typeof molecule.properties.pka === 'number') {
      return molecule.properties.pka;
    }

    if (molecule.functional_groups.includes('carboxylic_acid')) {
      return 4.76;
    }

    if (molecule.functional_groups.includes('phenol')) {
      return 9.95;
    }

    if (molecule.functional_groups.includes('alcohol')) {
      return 15.5;
    }

    if (molecule.functional_groups.includes('amine')) {
      return 9.5;
    }

    return null;
  }

  calculateIonicStrength(ionConcentrations: number[], ionCharges: number[]): number {
    let ionicStrength = 0;

    for (let i = 0; i < ionConcentrations.length; i++) {
      ionicStrength += ionConcentrations[i] * Math.pow(ionCharges[i], 2);
    }

    return 0.5 * ionicStrength;
  }

  predictStandardReductionPotential(element: Element): number {
    const potentials: Record<string, number> = {
      Li: -3.04,
      K: -2.93,
      Na: -2.71,
      Mg: -2.37,
      Al: -1.66,
      Zn: -0.76,
      Fe: -0.44,
      Ni: -0.25,
      H: 0.0,
      Cu: 0.34,
      Ag: 0.8,
      Hg: 0.85,
      Au: 1.5,
      F: 2.87,
      Cl: 1.36,
      Br: 1.07,
      I: 0.54,
      O: 0.4,
    };

    return potentials[element.symbol] || 0;
  }

  calculateCellPotential(cathodeElement: Element, anodeElement: Element): number {
    const cathodePotential = this.predictStandardReductionPotential(cathodeElement);
    const anodePotential = this.predictStandardReductionPotential(anodeElement);

    return cathodePotential - anodePotential;
  }

  predictRedoxReaction(oxidizingAgent: Element, reducingAgent: Element): RedoxReaction {
    const cellPotential = this.calculateCellPotential(oxidizingAgent, reducingAgent);

    const oxidationHalf = `${reducingAgent.symbol} → ${reducingAgent.symbol}⁺ + e⁻`;
    const reductionHalf = `${oxidizingAgent.symbol}⁺ + e⁻ → ${oxidizingAgent.symbol}`;
    const overallReaction = `${reducingAgent.symbol} + ${oxidizingAgent.symbol}⁺ → ${reducingAgent.symbol}⁺ + ${oxidizingAgent.symbol}`;

    return {
      oxidationHalf,
      reductionHalf,
      overallReaction,
      cellPotential,
      spontaneous: cellPotential > 0,
      electronTransfer: 1,
    };
  }

  calculateNernstPotential(
    standardPotential: number,
    temperature: number,
    electronTransfer: number,
    reactionQuotient: number,
  ): number {
    const R = 8.314;
    const F = 96485;

    return (
      standardPotential - ((R * temperature) / (electronTransfer * F)) * Math.log(reactionQuotient)
    );
  }

  calculateGibbsFreeEnergy(cellPotential: number, electronTransfer: number): number {
    const F = 96485;
    return (-electronTransfer * F * cellPotential) / 1000;
  }

  predictSolubility(
    molecule: Molecule,
    _pH: number,
  ): 'soluble' | 'sparingly_soluble' | 'insoluble' {
    if (
      molecule.functional_groups.includes('hydroxyl') ||
      molecule.functional_groups.includes('carboxylic_acid')
    ) {
      return 'soluble';
    }

    if (
      molecule.functional_groups.includes('aromatic') &&
      molecule.functional_groups.length === 1
    ) {
      return 'sparingly_soluble';
    }

    if (
      molecule.molecular_weight < 100 &&
      (molecule.functional_groups.includes('carbonyl') ||
        molecule.functional_groups.includes('amine'))
    ) {
      return 'soluble';
    }

    if (molecule.molecular_weight > 300) {
      return 'insoluble';
    }

    return 'sparingly_soluble';
  }

  calculateEquilibriumConstant(standardGibbsEnergy: number, temperature: number): number {
    const R = 8.314;
    return Math.exp((-standardGibbsEnergy * 1000) / (R * temperature));
  }
}

export const pHEngine = new PHEngine();
