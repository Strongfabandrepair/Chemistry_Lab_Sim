# Quantum Chemistry Laboratory

An interactive **educational** chemistry workspace built with React and TypeScript. Explore all 118 elements, assemble mixtures, run supported stoichiometric reaction models, and inspect representative molecular geometry.

> This is not a research-grade predictor, molecular-dynamics solver, or laboratory safety tool. Never use simulation recipes or outputs as real-world experimental instructions.

## Quick start

Requires **Node.js 22.12+** and npm.

```bash
npm ci
npm run dev
```

Open the URL printed by Vite (port 5173 by default). No account, credentials, or backend is required. The development and preview servers bind to `0.0.0.0` and allow Arena's `.e2b.app` preview hosts.

```bash
npm run check       # TypeScript, ESLint, unit tests, and production build
npm run test        # Calculation and reference-data regression tests
npm run test:e2e     # Browser interaction tests (install Chromium first)
npm run preview     # Serve the production build
npm run format      # Format application, tests, and configuration
```

Install the test browser with `npx playwright install --with-deps chromium`. If using an existing compatible Chromium executable, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Browser tests can reuse the running Vite server or start it automatically.

## The workspace

- **Laboratory:** searchable, category-filtered periodic table; keyboard-accessible element selection; editable masses; temperature, pressure, and volume unit conversion; atmosphere metadata.
- **Molecular viewport:** responsive high-DPI canvas with depth projection, shaded spheres, representative bonds, perspective workplane, orbit/zoom/reset controls, labels, pause, and space-filling mode. Drag or use arrow keys to orbit; `+`/`−` to zoom. Animation honors reduced-motion settings.
- **Results:** supported reaction equation, products, excess reactants, total mass balance, reference enthalpy estimate, and safety observations. Input changes invalidate stale results.
- **Recipes:** seven supported, balanced starting mixtures with explicit model activation gates.
- **Lab notes and exports:** notes persist in this browser; export the input snapshot, results, and notes as JSON. Notes are workspace-wide, not separate per experiment. Experiment inputs themselves are not automatically persisted.
- **Molecule library:** searchable organic/inorganic reference molecules with a selection carried into spectroscopy.
- **Spectroscopy:** qualitative synthetic UV–Vis, IR, proton NMR, and mass spectra based on the selected molecule, independent of unrelated laboratory inputs.
- **pH analysis:** a monoprotic-acid/strong-base titration model at 25 °C, using electroneutrality and water autoionization for a continuous curve through equivalence.
- **Learning guides:** self-guided readings with locally stored completion indicators. Completion is not a graded assessment, and suggested activities are not enforced by the simulator.

The initial H/O mixture is a preview at room temperature. To see modeled conversion, use **Load a recipe → Water vapor formation → Run simulation**. Running the room-temperature preview reports that the model's activation gate has not been met.

## Chemistry conventions and limitations

### Supported reaction models

| Product          | Model equation        | Activation gate (K) | ΔfH° (kJ/mol of product) |
| ---------------- | --------------------- | ------------------: | -----------------------: |
| Water vapor      | 2 H₂ + O₂ → 2 H₂O     |              773.15 |                 −241.826 |
| Sodium chloride  | 2 Na + Cl₂ → 2 NaCl   |              298.15 |                  −411.12 |
| Carbon dioxide   | C + O₂ → CO₂          |              873.15 |                  −393.51 |
| Magnesium oxide  | 2 Mg + O₂ → 2 MgO     |              923.15 |                   −601.6 |
| Iron(III) oxide  | 4 Fe + 3 O₂ → 2 Fe₂O₃ |              573.15 |                   −824.2 |
| Copper(II) oxide | 2 Cu + O₂ → 2 CuO     |              573.15 |                   −155.2 |
| Aluminum oxide   | 4 Al + 3 O₂ → 2 Al₂O₃ |                1200 |                  −1675.7 |

The gates are **pedagogical conditions, not predicted ignition temperatures**. Above a gate, the model assumes complete conversion of the limiting input. It does not calculate conversion rates or equilibrium yield.

- **Elemental input amounts are moles of atoms.** For example, 0.2 mol of H atoms and 0.1 mol of O atoms give 0.1 mol of H₂O. Molecular equations retain conventional diatomic notation.
- Products plus remaining reactants conserve input mass. The same input always produces the same output; order of selection does not affect conversion.
- The main reaction model accepts exactly two distinct supported elements. Other mixtures return an explicit unsupported/no-conversion result, **not a claim of chemical inertness**.
- **Temperature is held constant.** The result reports total reference energy in **kJ**, not kJ/mol. Standard formation enthalpies at 298 K are used without heat-capacity corrections.
- Pressure, volume, and atmosphere are recorded, but do not change stoichiometric conversion. Atmospheric reactants, catalysts, pressure-dependent phase equilibria, competing reactions, kinetics, and quantum mechanics are not modeled.
- The ideal-gas utility uses L·atm/(mol·K), with caller-provided gas-particle moles. It is not applied to atomic input mixtures automatically. Gibbs calculations use kJ/mol for enthalpy and J/(mol·K) for entropy.
- The molecular viewport is a bounded representative illustration, not an atom count or physically simulated trajectory. Only water and CO₂ have explicit molecular geometry; other structures are schematic formula-unit arrangements, not crystal lattices.
- Spectroscopy uses simplified functional-group rules and Gaussian peaks, not measured spectra. IR is displayed as relative absorption, with IR and NMR axes descending by convention.
- Titration assumes a monoprotic acid, strong base, ideal activities, and Kw = 10⁻¹⁴. It does not model polyprotic acids, temperature-dependent dissociation, or non-ideal solutions.

The older `quantumEngine.ts` and `mlReactionPredictor.ts` helpers are experimental heuristics and are **not** used for the laboratory's reaction predictions.

## Reference data and optional Supabase

The checked-in SQL migrations supply 118 elements, 15 molecules, and six learning guides. JSON reference snapshots in `src/data/` allow credential-free operation. They are copied from the existing project datasets, **not newly independently validated reference measurements**. Superheavy-element properties in particular may be estimates.

Regenerate snapshots after deliberately changing the seed migrations:

```bash
python3 scripts/export_seed.py
```

To use an existing Supabase reference database, copy `.env.example` to `.env` and set:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

Never expose a service-role key. The optional client reads public reference tables. Missing/invalid configuration uses bundled data; unavailable queries fall back after a five-second timeout. Missing remote elements are filled from the bundled table. This UI does not implement accounts, cloud experiment saving, or multi-user synchronization. The legacy SQL recipes remain in the repository; the current lab recipes are defined alongside the supported reaction models.

## Project layout

```text
src/
  components/        Workspace, controls, periodic table, and analysis tools
  data/              Bundled SQL-derived reference snapshots
  lib/
    chemistryEngine.ts       Validated deterministic reaction models
    visualizationEngine.ts   Bounded projected-3D canvas renderer
    referenceData.ts         Optional remote reads and local fallbacks
    pHEngine.ts              Acid/base calculations and titration solver
    spectroscopyEngine.ts    Qualitative spectrum generation
    supabase.ts              Optional client and domain types
  App.tsx            Persistent workspace navigation
  index.css          Responsive dark/mint design system
scripts/export_seed.py       Reproducible reference-data exporter
tests/unit/                  Chemistry, units, pH, data, and renderer tests
tests/e2e/                   Desktop/mobile user-flow tests
```

## Review and verification

See [docs/PROJECT_REVIEW.md](docs/PROJECT_REVIEW.md) for findings, changes, and remaining limitations. Production dependencies currently pass `npm audit --omit=dev`; the full audit still reports advisories in the Tailwind 3 development dependency chain. A Tailwind 4 migration is intentionally separate from this workspace/logic revision.

## License

MIT. See [LICENSE](LICENSE).
