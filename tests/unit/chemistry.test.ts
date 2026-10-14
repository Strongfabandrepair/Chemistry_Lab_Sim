import { describe, it, expect } from 'vitest';
import { chemistryEngine, reactionModels, type MixtureState } from '../../src/lib/chemistryEngine';
import {
  localElements,
  localMolecules,
  getElements,
  getMolecules,
} from '../../src/lib/referenceData';
import { pHEngine } from '../../src/lib/pHEngine';
import { spectroscopyEngine } from '../../src/lib/spectroscopyEngine';
import { VisualizationEngine } from '../../src/lib/visualizationEngine';
import { pressureUnits, temperatureUnits, volumeUnits } from '../../src/lib/unitConversions';

function mixture(entries: [string, number][], temperature = 1000): MixtureState {
  return {
    components: entries.map(([symbol, moles]) => {
      const element = localElements.find((el) => el.symbol === symbol)!;
      return { element, moles, mass: element.atomic_mass * moles };
    }),
    temperature,
    pressure: 1,
    volume: 1,
    atmosphere: 'argon',
  };
}
const outputMass = (result: ReturnType<typeof chemistryEngine.predictReaction>) =>
  [...result.products, ...result.remaining].reduce((sum, p) => sum + p.mass, 0);

describe('reference data', () => {
  it('works without credentials and includes all 118 unique elements', async () => {
    expect((await getElements()).length).toBe(118);
    expect(new Set(localElements.map((e) => e.id)).size).toBe(118);
    expect((await getMolecules()).length).toBeGreaterThan(0);
  });
  it('has internally consistent masses and positions', () => {
    expect(localElements.every((e) => e.atomic_mass > 0 && e.period >= 1 && e.period <= 7)).toBe(
      true,
    );
    expect(localElements.at(-1)?.symbol).toBe('Og');
  });
});
describe('deterministic, mass-conserving stoichiometry', () => {
  it.each(reactionModels)('conserves mass for $formula and respects input order', (model) => {
    const input = mixture(
      [
        [model.atoms[0], model.atoms[1] * 0.2],
        [model.atoms[2], model.atoms[3] * 0.1],
      ],
      model.minTemperature,
    );
    const result = chemistryEngine.predictReaction(input);
    expect(result.status).toBe('reacted');
    expect(result.products[0].formula).toBe(model.formula);
    expect(result.products[0].moles).toBeCloseTo(0.1, 10);
    expect(outputMass(result)).toBeCloseTo(
      input.components.reduce((sum, c) => sum + c.mass, 0),
      10,
    );
    expect(result.energy_change).toBeCloseTo(0.1 * model.enthalpy, 10);
    expect(result.temperature_change).toBe(0);
    const reversed = chemistryEngine.predictReaction({
      ...input,
      components: [...input.components].reverse(),
    });
    expect(reversed.products).toEqual(result.products);
    expect(chemistryEngine.predictReaction(input)).toEqual(result);
  });
  it('does not mutate input or manufacture reactions below the model gate', () => {
    const input = mixture(
      [
        ['H', 0.2],
        ['O', 0.1],
      ],
      298.15,
    );
    const snapshot = structuredClone(input);
    const result = chemistryEngine.predictReaction(input);
    expect(result.status).toBe('conditions-not-met');
    expect(result.products).toEqual([]);
    expect(outputMass(result)).toBeCloseTo(1.8015, 10);
    expect(input).toEqual(snapshot);
  });
  it('does not fabricate arbitrary or competing products', () => {
    for (const input of [
      mixture([
        ['He', 1],
        ['Ne', 1],
      ]),
      mixture([
        ['H', 1],
        ['O', 1],
        ['Na', 1],
      ]),
    ]) {
      expect(chemistryEngine.predictReaction(input).status).toBe('unsupported');
      expect(chemistryEngine.predictReaction(input).products).toEqual([]);
    }
  });
  it('handles zero components and single elements', () => {
    expect(chemistryEngine.predictReaction(mixture([])).status).toBe('no-reaction');
    expect(chemistryEngine.predictReaction(mixture([['H', 1]])).remaining).toHaveLength(1);
  });
  it.each([0, -1, NaN, Infinity])('rejects invalid parameters %s', (invalid) => {
    for (const key of ['temperature', 'pressure', 'volume'] as const) {
      expect(() =>
        chemistryEngine.predictReaction({ ...mixture([['H', 1]]), [key]: invalid }),
      ).toThrow();
    }
  });
  it('rejects inconsistent and invalid component amounts', () => {
    const input = mixture([['H', 1]]);
    input.components[0].mass = -1;
    expect(() => chemistryEngine.predictReaction(input)).toThrow();
    input.components[0].mass = 5;
    expect(() => chemistryEngine.predictReaction(input)).toThrow(/inconsistent/);
  });
});
describe('thermodynamic units', () => {
  it('uses L atm for ideal gas properties', () => {
    const input = { ...mixture([['He', 1]], 273.15), volume: 22.414 };
    expect(chemistryEngine.calculateIdealGasProperties(input).pressure).toBeCloseTo(1, 4);
  });
  it('converts kJ enthalpy and J entropy correctly', () => {
    expect(chemistryEngine.calculateGibbsFreeEnergy(-100, -100, 300)).toBe(-70);
    expect(chemistryEngine.calculateEquilibriumConstant(-5, 300)).toBeCloseTo(7.422, 2);
    expect(() => chemistryEngine.calculateEquilibriumConstant(5, 0)).toThrow();
  });
  it('round-trips all display units', () => {
    Object.values(temperatureUnits).forEach((u) =>
      expect(u.toKelvin(u.fromKelvin(298.15))).toBeCloseTo(298.15),
    );
    Object.values(pressureUnits).forEach((u) => expect(u.toAtm(u.fromAtm(1))).toBeCloseTo(1));
    Object.values(volumeUnits).forEach((u) => expect(u.toL(u.fromL(1))).toBeCloseTo(1));
  });
});
describe('acid/base model', () => {
  it('has a smooth monotonic titration curve and a basic endpoint', () => {
    const points = pHEngine.simulateTitration(0.1, 50, 0.1, 100, 4.76, 100);
    expect(points).toHaveLength(101);
    expect(points[0].pH).toBeCloseTo(2.88, 2);
    expect(points[25].pH).toBeCloseTo(4.76, 2);
    expect(points[50].pH).toBeCloseTo(8.73, 2);
    expect(points[100].pH).toBeCloseTo(12.52, 2);
    expect(points.every((p, i) => i === 0 || p.pH >= points[i - 1].pH)).toBe(true);
    expect(points.filter((p) => p.isEquivalencePoint)).toHaveLength(1);
  });
  it('handles strong acids and rejects invalid amounts', () => {
    expect(pHEngine.calculateTitrationpH(0.1, 50, 0.1, 50, -6)).toBeCloseTo(7, 2);
    expect(() => pHEngine.simulateTitration(0.1, 50, 0, 100)).toThrow();
    expect(() => pHEngine.simulateTitration(0.1, 50, 0.1, 100, 4.76, 0)).toThrow();
  });
});
describe('molecular tools', () => {
  it('bases spectra on the molecule, not unrelated mixture elements', () => {
    const ethanol = localMolecules.find((m) => m.name === 'Ethanol')!;
    const a = spectroscopyEngine.predictIRSpectrum(ethanol, []);
    const b = spectroscopyEngine.predictIRSpectrum(ethanol, [localElements[1]]);
    expect(a).toEqual(b);
    expect(a.peaks.length).toBeGreaterThan(0);
    expect(spectroscopyEngine.predictNMRSpectrum(ethanol, []).peaks.length).toBeGreaterThan(0);
  });
  it('bounds representative particles even with large quantities', () => {
    const engine = new VisualizationEngine();
    engine.setScene([{ element: localElements[0], moles: 1000000 }], null);
    expect(engine.getAtomCount()).toBeLessThanOrEqual(80);
    engine.setScene([], null);
    expect(engine.getAtomCount()).toBe(0);
  });
});
