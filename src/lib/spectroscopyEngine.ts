import { Molecule, Element, SpectroscopyData } from './supabase';
import { quantumEngine } from './quantumEngine';

interface Peak {
  position: number;
  intensity: number;
  width: number;
  assignment?: string;
}

interface Spectrum {
  type: 'uv_vis' | 'ir' | 'nmr' | 'mass_spec';
  peaks: Peak[];
  xAxis: { label: string; unit: string };
  yAxis: { label: string; unit: string };
  range: { min: number; max: number };
}

export class SpectroscopyEngine {
  predictUVVisSpectrum(molecule: Molecule, elements: Element[]): Spectrum {
    const peaks: Peak[] = [];

    const hasConjugation = molecule.functional_groups.some(g =>
      ['aromatic', 'alkene', 'alkyne', 'carbonyl'].includes(g)
    );

    const hasAromatic = molecule.functional_groups.includes('aromatic');
    const hasCarbonyl = molecule.functional_groups.includes('carbonyl');

    if (hasAromatic) {
      peaks.push({
        position: 254,
        intensity: 0.9,
        width: 20,
        assignment: 'π→π* (aromatic)'
      });

      if (molecule.functional_groups.length > 1) {
        peaks.push({
          position: 280,
          intensity: 0.7,
          width: 25,
          assignment: 'π→π* (extended conjugation)'
        });
      }
    }

    if (hasCarbonyl && !hasAromatic) {
      peaks.push({
        position: 280,
        intensity: 0.6,
        width: 30,
        assignment: 'n→π* (C=O)'
      });
    }

    if (hasConjugation && peaks.length === 0) {
      peaks.push({
        position: 200,
        intensity: 0.8,
        width: 25,
        assignment: 'π→π*'
      });
    }

    if (peaks.length === 0) {
      peaks.push({
        position: 180,
        intensity: 0.5,
        width: 15,
        assignment: 'σ→σ*'
      });
    }

    return {
      type: 'uv_vis',
      peaks,
      xAxis: { label: 'Wavelength', unit: 'nm' },
      yAxis: { label: 'Absorbance', unit: 'A.U.' },
      range: { min: 180, max: 800 }
    };
  }

  predictIRSpectrum(molecule: Molecule, elements: Element[]): Spectrum {
    const peaks: Peak[] = [];

    const functionalGroups = molecule.functional_groups;

    if (functionalGroups.includes('hydroxyl') || functionalGroups.includes('alcohol')) {
      peaks.push({
        position: 3350,
        intensity: 0.9,
        width: 300,
        assignment: 'O-H stretch'
      });

      peaks.push({
        position: 1050,
        intensity: 0.8,
        width: 50,
        assignment: 'C-O stretch'
      });
    }

    if (functionalGroups.includes('carbonyl') || functionalGroups.includes('ketone') ||
        functionalGroups.includes('aldehyde')) {
      const position = functionalGroups.includes('carboxylic_acid') ? 1710 : 1715;
      peaks.push({
        position,
        intensity: 1.0,
        width: 30,
        assignment: 'C=O stretch'
      });
    }

    if (functionalGroups.includes('carboxylic_acid')) {
      peaks.push({
        position: 3000,
        intensity: 0.95,
        width: 500,
        assignment: 'O-H stretch (acid)'
      });
    }

    if (functionalGroups.includes('amine')) {
      peaks.push({
        position: 3300,
        intensity: 0.7,
        width: 100,
        assignment: 'N-H stretch'
      });

      peaks.push({
        position: 1600,
        intensity: 0.6,
        width: 40,
        assignment: 'N-H bend'
      });
    }

    if (functionalGroups.includes('alkene') || functionalGroups.includes('double_bond')) {
      peaks.push({
        position: 1650,
        intensity: 0.7,
        width: 30,
        assignment: 'C=C stretch'
      });

      peaks.push({
        position: 3080,
        intensity: 0.5,
        width: 40,
        assignment: '=C-H stretch'
      });
    }

    if (functionalGroups.includes('alkyne') || functionalGroups.includes('triple_bond')) {
      peaks.push({
        position: 2150,
        intensity: 0.6,
        width: 20,
        assignment: 'C≡C stretch'
      });

      peaks.push({
        position: 3300,
        intensity: 0.7,
        width: 30,
        assignment: '≡C-H stretch'
      });
    }

    if (functionalGroups.includes('aromatic')) {
      peaks.push({
        position: 3030,
        intensity: 0.5,
        width: 40,
        assignment: 'aromatic C-H stretch'
      });

      peaks.push({
        position: 1600,
        intensity: 0.7,
        width: 30,
        assignment: 'aromatic C=C stretch'
      });

      peaks.push({
        position: 1500,
        intensity: 0.7,
        width: 30,
        assignment: 'aromatic C=C stretch'
      });
    }

    const hasCarbon = elements.some(e => e.symbol === 'C');
    const hasHydrogen = elements.some(e => e.symbol === 'H');

    if (hasCarbon && hasHydrogen && peaks.filter(p => p.position > 2800 && p.position < 3000).length === 0) {
      peaks.push({
        position: 2960,
        intensity: 0.8,
        width: 50,
        assignment: 'C-H stretch'
      });
    }

    return {
      type: 'ir',
      peaks,
      xAxis: { label: 'Wavenumber', unit: 'cm⁻¹' },
      yAxis: { label: 'Transmittance', unit: '%' },
      range: { min: 400, max: 4000 }
    };
  }

  predictNMRSpectrum(molecule: Molecule, elements: Element[]): Spectrum {
    const peaks: Peak[] = [];

    const hasCarbon = elements.some(e => e.symbol === 'C');
    const hasHydrogen = elements.some(e => e.symbol === 'H');

    if (!hasHydrogen) {
      return {
        type: 'nmr',
        peaks: [],
        xAxis: { label: 'Chemical Shift', unit: 'ppm' },
        yAxis: { label: 'Intensity', unit: 'A.U.' },
        range: { min: 0, max: 14 }
      };
    }

    const functionalGroups = molecule.functional_groups;

    if (functionalGroups.includes('alkane') && peaks.length === 0) {
      peaks.push({
        position: 0.9,
        intensity: 1.0,
        width: 0.1,
        assignment: 'CH3'
      });

      if (molecule.formula.includes('C2') || molecule.formula.includes('C3')) {
        peaks.push({
          position: 1.3,
          intensity: 0.8,
          width: 0.1,
          assignment: 'CH2'
        });
      }
    }

    if (functionalGroups.includes('alcohol') || functionalGroups.includes('hydroxyl')) {
      if (molecule.name === 'Ethanol') {
        peaks.push({
          position: 1.2,
          intensity: 0.9,
          width: 0.05,
          assignment: 'CH3 (triplet)'
        });

        peaks.push({
          position: 3.7,
          intensity: 0.6,
          width: 0.08,
          assignment: 'CH2 (quartet)'
        });

        peaks.push({
          position: 5.4,
          intensity: 0.3,
          width: 0.15,
          assignment: 'OH'
        });
      } else {
        peaks.push({
          position: 3.5,
          intensity: 0.7,
          width: 0.1,
          assignment: 'CH-OH'
        });
      }
    }

    if (functionalGroups.includes('carbonyl') || functionalGroups.includes('ketone')) {
      if (molecule.name === 'Acetone') {
        peaks.push({
          position: 2.1,
          intensity: 1.0,
          width: 0.05,
          assignment: 'CH3 (singlet)'
        });
      } else {
        peaks.push({
          position: 2.0,
          intensity: 0.8,
          width: 0.1,
          assignment: 'CH3-CO'
        });
      }
    }

    if (functionalGroups.includes('aromatic')) {
      if (molecule.name === 'Benzene') {
        peaks.push({
          position: 7.3,
          intensity: 1.0,
          width: 0.05,
          assignment: 'aromatic H (singlet)'
        });
      } else {
        peaks.push({
          position: 7.2,
          intensity: 0.8,
          width: 0.2,
          assignment: 'aromatic H'
        });
      }
    }

    if (functionalGroups.includes('carboxylic_acid')) {
      peaks.push({
        position: 11.5,
        intensity: 0.5,
        width: 0.5,
        assignment: 'COOH'
      });

      peaks.push({
        position: 2.1,
        intensity: 0.7,
        width: 0.1,
        assignment: 'CH3-COOH'
      });
    }

    if (functionalGroups.includes('aldehyde')) {
      peaks.push({
        position: 9.7,
        intensity: 0.6,
        width: 0.1,
        assignment: 'CHO'
      });
    }

    if (functionalGroups.includes('alkene')) {
      peaks.push({
        position: 5.3,
        intensity: 0.7,
        width: 0.15,
        assignment: '=CH'
      });
    }

    return {
      type: 'nmr',
      peaks,
      xAxis: { label: 'Chemical Shift', unit: 'ppm' },
      yAxis: { label: 'Intensity', unit: 'A.U.' },
      range: { min: 0, max: 14 }
    };
  }

  predictMassSpectrum(molecule: Molecule, elements: Element[]): Spectrum {
    const peaks: Peak[] = [];

    const molecularWeight = molecule.molecular_weight;

    peaks.push({
      position: molecularWeight,
      intensity: 1.0,
      width: 1,
      assignment: 'M+ (molecular ion)'
    });

    const fragmentPatterns: Record<string, number[]> = {
      'alcohol': [molecularWeight - 18, molecularWeight - 17],
      'carbonyl': [molecularWeight - 28, molecularWeight - 29],
      'aromatic': [77, 51],
      'carboxylic_acid': [molecularWeight - 45, molecularWeight - 17]
    };

    for (const group of molecule.functional_groups) {
      const fragments = fragmentPatterns[group];
      if (fragments) {
        fragments.forEach((mass, idx) => {
          if (mass > 0 && mass < molecularWeight) {
            peaks.push({
              position: mass,
              intensity: 0.8 - idx * 0.2,
              width: 1,
              assignment: `fragment`
            });
          }
        });
      }
    }

    if (peaks.length === 1 && molecularWeight > 30) {
      peaks.push({
        position: Math.floor(molecularWeight / 2),
        intensity: 0.6,
        width: 1,
        assignment: 'fragment'
      });

      peaks.push({
        position: Math.floor(molecularWeight * 0.7),
        intensity: 0.4,
        width: 1,
        assignment: 'fragment'
      });
    }

    return {
      type: 'mass_spec',
      peaks,
      xAxis: { label: 'm/z', unit: 'Da' },
      yAxis: { label: 'Relative Intensity', unit: '%' },
      range: { min: 0, max: molecularWeight + 10 }
    };
  }

  generateSpectrumData(spectrum: Spectrum, resolution: number = 500): { x: number[]; y: number[] } {
    const x: number[] = [];
    const y: number[] = [];

    const step = (spectrum.range.max - spectrum.range.min) / resolution;

    for (let i = 0; i <= resolution; i++) {
      const xVal = spectrum.range.min + i * step;
      let yVal = 0;

      for (const peak of spectrum.peaks) {
        const gaussian = peak.intensity * Math.exp(
          -Math.pow(xVal - peak.position, 2) / (2 * Math.pow(peak.width, 2))
        );
        yVal += gaussian;
      }

      if (spectrum.type === 'ir') {
        yVal = 100 - yVal * 100;
      }

      x.push(xVal);
      y.push(yVal);
    }

    return { x, y };
  }

  analyzeSpectrum(spectrum: Spectrum): {
    peakCount: number;
    strongestPeak: Peak | null;
    characteristicPeaks: Peak[];
  } {
    const sortedPeaks = [...spectrum.peaks].sort((a, b) => b.intensity - a.intensity);

    return {
      peakCount: spectrum.peaks.length,
      strongestPeak: sortedPeaks[0] || null,
      characteristicPeaks: sortedPeaks.slice(0, 3)
    };
  }
}

export const spectroscopyEngine = new SpectroscopyEngine();