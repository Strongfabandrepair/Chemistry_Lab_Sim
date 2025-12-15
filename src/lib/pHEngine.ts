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

interface TitrationPoint {
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

export class pHEngine {
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
      isNeutral: Math.abs(pH - 7) < 0.1
    };
  }

  calculateWeakAcidpH(
    concentration: number,
    Ka: number
  ): number {
    const hydroniumConcentration = Math.sqrt(Ka * concentration);
    return this.calculatepH(hydroniumConcentration);
  }

  calculateWeakBasepH(
    concentration: number,
    Kb: number
  ): number {
    const hydroxideConcentration = Math.sqrt(Kb * concentration);
    const pOH = this.calculatepOH(hydroxideConcentration);
    return 14 - pOH;
  }

  calculateBufferpH(
    acidConcentration: number,
    conjugateBaseConcentration: number,
    pKa: number
  ): number {
    return pKa + Math.log10(conjugateBaseConcentration / acidConcentration);
  }

  simulateTitration(
    acidConcentration: number,
    acidVolume: number,
    baseConcentration: number,
    maxBaseVolume: number,
    pKa: number = 4.76,
    steps: number = 100
  ): TitrationPoint[] {
    const points: TitrationPoint[] = [];

    const equivalenceVolume = (acidConcentration * acidVolume) / baseConcentration;

    for (let i = 0; i <= steps; i++) {
      const baseVolume = (maxBaseVolume * i) / steps;
      const totalVolume = acidVolume + baseVolume;

      let pH: number;

      if (baseVolume < equivalenceVolume * 0.99) {
        const remainingAcid = (acidConcentration * acidVolume - baseConcentration * baseVolume) / totalVolume;
        const formedConjugateBase = (baseConcentration * baseVolume) / totalVolume;

        if (remainingAcid > 0 && formedConjugateBase > 0) {
          pH = this.calculateBufferpH(remainingAcid, formedConjugateBase, pKa);
        } else {
          pH = this.calculateWeakAcidpH(remainingAcid, Math.pow(10, -pKa));
        }
      } else if (baseVolume > equivalenceVolume * 1.01) {
        const excessBase = (baseConcentration * baseVolume - acidConcentration * acidVolume) / totalVolume;
        const pOH = this.calculatepOH(excessBase);
        pH = 14 - pOH;
      } else {
        pH = 7 + (pKa / 2);
      }

      points.push({
        volumeAdded: baseVolume,
        pH: Math.max(0, Math.min(14, pH)),
        isEquivalencePoint: Math.abs(baseVolume - equivalenceVolume) < maxBaseVolume / steps
      });
    }

    return points;
  }

  predictpKa(molecule: Molecule): number | null {
    if (molecule.properties.pka) {
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

  calculateIonicStrength(
    ionConcentrations: number[],
    ionCharges: number[]
  ): number {
    let ionicStrength = 0;

    for (let i = 0; i < ionConcentrations.length; i++) {
      ionicStrength += ionConcentrations[i] * Math.pow(ionCharges[i], 2);
    }

    return 0.5 * ionicStrength;
  }

  predictStandardReductionPotential(element: Element): number {
    const potentials: Record<string, number> = {
      'Li': -3.04,
      'K': -2.93,
      'Na': -2.71,
      'Mg': -2.37,
      'Al': -1.66,
      'Zn': -0.76,
      'Fe': -0.44,
      'Ni': -0.25,
      'H': 0.00,
      'Cu': 0.34,
      'Ag': 0.80,
      'Hg': 0.85,
      'Au': 1.50,
      'F': 2.87,
      'Cl': 1.36,
      'Br': 1.07,
      'I': 0.54,
      'O': 0.40
    };

    return potentials[element.symbol] || 0;
  }

  calculateCellPotential(
    cathodeElement: Element,
    anodeElement: Element
  ): number {
    const cathodePotential = this.predictStandardReductionPotential(cathodeElement);
    const anodePotential = this.predictStandardReductionPotential(anodeElement);

    return cathodePotential - anodePotential;
  }

  predictRedoxReaction(
    oxidizingAgent: Element,
    reducingAgent: Element
  ): RedoxReaction {
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
      electronTransfer: 1
    };
  }

  calculateNernstPotential(
    standardPotential: number,
    temperature: number,
    electronTransfer: number,
    reactionQuotient: number
  ): number {
    const R = 8.314;
    const F = 96485;

    return standardPotential - (R * temperature / (electronTransfer * F)) * Math.log(reactionQuotient);
  }

  calculateGibbsFreeEnergy(
    cellPotential: number,
    electronTransfer: number
  ): number {
    const F = 96485;
    return -electronTransfer * F * cellPotential / 1000;
  }

  predictSolubility(molecule: Molecule, pH: number): 'soluble' | 'sparingly_soluble' | 'insoluble' {
    if (molecule.functional_groups.includes('hydroxyl') ||
        molecule.functional_groups.includes('carboxylic_acid')) {
      return 'soluble';
    }

    if (molecule.functional_groups.includes('aromatic') &&
        molecule.functional_groups.length === 1) {
      return 'sparingly_soluble';
    }

    if (molecule.molecular_weight < 100 &&
        (molecule.functional_groups.includes('carbonyl') ||
         molecule.functional_groups.includes('amine'))) {
      return 'soluble';
    }

    if (molecule.molecular_weight > 300) {
      return 'insoluble';
    }

    return 'sparingly_soluble';
  }

  calculateEquilibriumConstant(
    standardGibbsEnergy: number,
    temperature: number
  ): number {
    const R = 8.314;
    return Math.exp(-standardGibbsEnergy * 1000 / (R * temperature));
  }
}

export const pHEngine = new pHEngine();