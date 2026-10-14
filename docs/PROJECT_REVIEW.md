# Project review · October 13, 2026

## Findings addressed

| Finding                                                                                                         | Implementation                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App throws before mounting when Supabase is not configured                                                      | Optional client, SQL-derived local datasets, bounded remote-query fallback                                                                                                                  |
| Type checking failed, including duplicate `pHEngine` identifiers and lowercase JSX                              | Fixed PHEngine class/instance and PHSimulator component naming; resolved unused declarations and unsafe `any` types                                                                         |
| Pairwise randomized predictions could fabricate formulas, reuse consumed reactants, and discard excess material | Seven deterministic, explicit two-element models; validated inputs; limiting-reactant conversion and leftover material                                                                      |
| Energy/temperature calculations mixed units and mutated the input setpoint                                      | Explicit kJ totals from reference formation enthalpies; isothermal conditions; corrected ideal-gas and Gibbs unit conventions                                                               |
| Running a reaction overwrote scene effects via temperature state changes                                        | Input and output state separated; stable result-driven geometry; no implicit temperature mutation                                                                                           |
| Negative/NaN inputs could propagate into calculations                                                           | Editable numeric drafts with finite bounds and validation in the engine                                                                                                                     |
| Unbounded particle allocation and hard-coded canvas sizing                                                      | Bounded representative scene, ResizeObserver, capped device pixel ratio, frame-delta cap, hidden-page pause                                                                                 |
| Large undifferentiated panels made workflow unclear                                                             | Persistent navigation, experiment/results/notes tabs, side-by-side controls, recipe onboarding, exports and feedback                                                                        |
| pH endpoint indexing returned neutral pH and equivalence ignored concentration                                  | Continuous charge-balance solver, explicit endpoint evaluation, regression coverage                                                                                                         |
| Spectra incorrectly used the unrelated laboratory mixture                                                       | Composition derived from the chosen molecule; relative absorption/normalized intensity labels; reversed IR/NMR axes                                                                         |
| Anonymous tutorial saves used invalid guest IDs for a UUID-backed cloud table                                   | Browser-local completion with visible feedback and graceful storage failure handling                                                                                                        |
| Low accessibility of interactive controls                                                                       | Native help dialog, labels, tab keyboard navigation, selectable tutorial buttons, reduced motion, touch and keyboard viewport controls, mobile navigation and horizontally scrollable table |
| Development toolchain had known advisories                                                                      | Updated Vite, React plugin, test tooling, and compatible dependencies; production dependency audit clean                                                                                    |

## Verification

- `npm run check`: TypeScript, ESLint, unit tests, and production build.
- Unit coverage: all supported reaction models, mass conservation, limiting reactants, repeatability, selection order, unsupported mixtures, invalid input rejection, unit conversions, ideal gas pressure, Gibbs energy, titration start/half-equivalence/equivalence/endpoint, spectrum independence, offline data, and bounded representative geometry.
- Playwright coverage: credential-free boot, table filtering and selection, clear/reset behavior, recipe loading, reaction result/export flows, stale-result invalidation, invalid numbers, unit changes, camera controls, navigation state, notes persistence, native dialog, working secondary tools, and mobile overflow/navigation.
- Desktop (1440 px) and mobile (390 px) rendering reviewed in Chromium. Browser testing exposed and fixed an unreachable sidebar help button on short screens.
- `npm audit --omit=dev`: no known production dependency vulnerabilities at the time of this review.

## Intentional limits / follow-up work

1. **Educational scope:** complete-conversion stoichiometry, representative geometry, and synthetic spectra are not validated research predictions. Do not reintroduce a “research-grade” label without an independently validated scientific model and data provenance.
2. **Broader chemistry:** expand the curated reaction catalog only with explicit equations, reference values, conditions, conservation tests, and confidence/uncertainty documentation. Arbitrary multi-reactant outcomes remain unsupported.
3. **Reference accuracy:** independently audit existing migration datasets, especially estimated heavy-element properties and legacy tutorial instructions. Current guides are readings, not integrated graded experiments.
4. **Persistence:** experiments export to JSON but do not yet import or synchronize to accounts. Notes and guide completion are browser-local only.
5. **Dependency maintenance:** the full audit retains development-only advisories in Tailwind 3's parsing/globbing chain. Migrate Tailwind separately and validate legacy utility-styled panels rather than applying a breaking automated audit fix.
6. **Further accessibility:** automated keyboard/mobile tests are not a complete WCAG audit. Further screen-reader and contrast testing across all secondary views is recommended.
