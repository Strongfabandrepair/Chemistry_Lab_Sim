import { Element, MolecularOrbital } from './supabase';

interface ElectronConfiguration {
  orbital: string;
  electrons: number;
  energy: number;
}

interface MolecularGeometry {
  type: string;
  bondAngles: number[];
  bondLengths: number[];
}

export class QuantumEngine {
  private readonly PLANCK_CONSTANT = 6.62607015e-34;
  private readonly SPEED_OF_LIGHT = 2.99792458e8;

  calculateElectronConfiguration(atomicNumber: number): ElectronConfiguration[] {
    const orbitals = [
      { name: '1s', maxElectrons: 2, energy: -13.6 },
      { name: '2s', maxElectrons: 2, energy: -3.4 },
      { name: '2p', maxElectrons: 6, energy: -3.4 },
      { name: '3s', maxElectrons: 2, energy: -1.51 },
      { name: '3p', maxElectrons: 6, energy: -1.51 },
      { name: '4s', maxElectrons: 2, energy: -0.85 },
      { name: '3d', maxElectrons: 10, energy: -0.85 },
      { name: '4p', maxElectrons: 6, energy: -0.85 },
      { name: '5s', maxElectrons: 2, energy: -0.54 },
      { name: '4d', maxElectrons: 10, energy: -0.54 },
      { name: '5p', maxElectrons: 6, energy: -0.54 }
    ];

    const config: ElectronConfiguration[] = [];
    let remainingElectrons = atomicNumber;

    for (const orbital of orbitals) {
      if (remainingElectrons === 0) break;

      const electronsInOrbital = Math.min(remainingElectrons, orbital.maxElectrons);
      config.push({
        orbital: orbital.name,
        electrons: electronsInOrbital,
        energy: orbital.energy
      });

      remainingElectrons -= electronsInOrbital;
    }

    return config;
  }

  calculateMolecularOrbitals(
    elements: Element[],
    geometry: string
  ): MolecularOrbital[] {
    if (elements.length < 2) return [];

    const orbitals: Partial<MolecularOrbital>[] = [];
    const totalElectrons = elements.reduce((sum, el) => {
      const config = this.calculateElectronConfiguration(el.id);
      return sum + config.reduce((s, c) => s + c.electrons, 0);
    }, 0);

    const element1 = elements[0];
    const element2 = elements[1];

    const avgEnergy = (element1.ionization_energy + element2.ionization_energy) / 2;
    const enDiff = Math.abs((element1.electronegativity || 0) - (element2.electronegativity || 0));

    const bondingEnergy = -avgEnergy * 0.8;
    const antibondingEnergy = avgEnergy * 0.4;

    const numBondingOrbitals = Math.ceil(totalElectrons / 2);
    const numAntibondingOrbitals = numBondingOrbitals;

    for (let i = 0; i < numBondingOrbitals; i++) {
      const energyShift = i * 0.5;
      orbitals.push({
        orbital_type: 'bonding',
        energy_level: bondingEnergy + energyShift,
        orbital_name: i === numBondingOrbitals - 1 ? 'HOMO' : `σ${i + 1}`,
        electron_count: Math.min(2, totalElectrons - i * 2),
        visualization_data: {
          phase: enDiff > 1.0 ? 'ionic' : 'covalent',
          symmetry: geometry
        }
      });
    }

    for (let i = 0; i < numAntibondingOrbitals; i++) {
      const energyShift = i * 0.5;
      orbitals.push({
        orbital_type: 'antibonding',
        energy_level: antibondingEnergy + energyShift,
        orbital_name: i === 0 ? 'LUMO' : `σ*${i + 1}`,
        electron_count: 0,
        visualization_data: {
          phase: enDiff > 1.0 ? 'ionic' : 'covalent',
          symmetry: geometry
        }
      });
    }

    return orbitals as MolecularOrbital[];
  }

  predictMolecularGeometry(
    _centralAtom: Element,
    surroundingAtoms: Element[]
  ): MolecularGeometry {
    const electronPairs = surroundingAtoms.length;

    const geometryMap: Record<number, MolecularGeometry> = {
      2: {
        type: 'linear',
        bondAngles: [180],
        bondLengths: [1.0]
      },
      3: {
        type: 'trigonal_planar',
        bondAngles: [120, 120, 120],
        bondLengths: [1.0, 1.0, 1.0]
      },
      4: {
        type: 'tetrahedral',
        bondAngles: [109.5, 109.5, 109.5, 109.5],
        bondLengths: [1.0, 1.0, 1.0, 1.0]
      },
      5: {
        type: 'trigonal_bipyramidal',
        bondAngles: [90, 120, 90, 120, 120],
        bondLengths: [1.0, 1.0, 1.0, 1.0, 1.0]
      },
      6: {
        type: 'octahedral',
        bondAngles: [90, 90, 90, 90, 90, 90],
        bondLengths: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
      }
    };

    return geometryMap[electronPairs] || geometryMap[4];
  }

  calculateBondOrder(
    bondingElectrons: number,
    antibondingElectrons: number
  ): number {
    return (bondingElectrons - antibondingElectrons) / 2;
  }

  calculateWavelengthFromEnergy(energyEV: number): number {
    const energyJoules = energyEV * 1.602176634e-19;
    const wavelength = (this.PLANCK_CONSTANT * this.SPEED_OF_LIGHT) / energyJoules;
    return wavelength * 1e9;
  }

  calculateHOMOLUMOGap(orbitals: MolecularOrbital[]): number {
    const homo = orbitals.find(o => o.orbital_name === 'HOMO');
    const lumo = orbitals.find(o => o.orbital_name === 'LUMO');

    if (!homo || !lumo) return 0;

    return Math.abs(lumo.energy_level - homo.energy_level);
  }

  predictExcitationWavelength(homoLumoGap: number): number {
    return this.calculateWavelengthFromEnergy(homoLumoGap);
  }

  calculateDipoleMoment(
    elements: Element[],
    bondLengths: number[],
    bondAngles: number[]
  ): number {
    if (elements.length < 2) return 0;

    const element1 = elements[0];
    const element2 = elements[1];

    const enDiff = Math.abs(
      (element1.electronegativity || 0) - (element2.electronegativity || 0)
    );

    const avgBondLength = bondLengths.reduce((a, b) => a + b, 0) / bondLengths.length;

    let dipole = enDiff * avgBondLength * 3.336e-30;

    if (bondAngles.length > 1) {
      let vectorSum = 0;
      for (const angle of bondAngles) {
        vectorSum += Math.cos(angle * Math.PI / 180);
      }
      dipole *= Math.abs(vectorSum) / bondAngles.length;
    }

    return dipole * 1e30;
  }

  calculateIonizationEnergy(element: Element): number {
    return element.ionization_energy;
  }

  calculateElectronAffinity(element: Element): number {
    return element.electron_affinity;
  }

  calculateElectronegativity(element: Element): number {
    return element.electronegativity || 0;
  }

  predictHybridization(
    _centralAtom: Element,
    bondCount: number,
    lonePairs: number
  ): string {
    const totalRegions = bondCount + lonePairs;

    const hybridizationMap: Record<number, string> = {
      2: 'sp',
      3: 'sp2',
      4: 'sp3',
      5: 'sp3d',
      6: 'sp3d2'
    };

    return hybridizationMap[totalRegions] || 'unknown';
  }

  calculateMolecularWeight(elements: Element[], stoichiometry: number[]): number {
    return elements.reduce((sum, element, index) => {
      return sum + element.atomic_mass * stoichiometry[index];
    }, 0);
  }

  predictMagneticProperties(
    _totalElectrons: number,
    orbitalOccupancy: number[]
  ): 'diamagnetic' | 'paramagnetic' {
    const unpairedElectrons = orbitalOccupancy.filter(e => e % 2 !== 0).length;
    return unpairedElectrons > 0 ? 'paramagnetic' : 'diamagnetic';
  }

  calculateBondEnergy(
    element1: Element,
    element2: Element,
    bondOrder: number
  ): number {
    const baseEnergy = 350;
    const enDiff = Math.abs(
      (element1.electronegativity || 0) - (element2.electronegativity || 0)
    );

    return baseEnergy * bondOrder * (1 + enDiff * 0.2);
  }

  calculateVibrationalFrequency(
    element1: Element,
    element2: Element,
    bondOrder: number
  ): number {
    const reducedMass = (element1.atomic_mass * element2.atomic_mass) /
      (element1.atomic_mass + element2.atomic_mass);

    const forceConstant = this.calculateBondEnergy(element1, element2, bondOrder) * 100;

    const frequency = (1 / (2 * Math.PI)) * Math.sqrt(forceConstant / reducedMass);

    return frequency * 1e-12;
  }
}

export const quantumEngine = new QuantumEngine();