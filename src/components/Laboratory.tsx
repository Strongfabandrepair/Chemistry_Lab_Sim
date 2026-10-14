import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  Play,
  RotateCcw,
  Plus,
  X,
  FlaskConical,
  ChevronRight,
  ArrowUpRight,
  Download,
  Check,
  Info,
  FileText,
  Activity,
  AlertTriangle,
  ArrowRight,
  Layers3,
  Atom,
} from 'lucide-react';
import { PeriodicTable } from './PeriodicTable';
import { categoryColors, elementCategory } from '../lib/elementCategories';
import { VisualizationCanvas } from './VisualizationCanvas';
import { ParameterControls, NumberField } from './ParameterControls';
import { MoleculeLibrary } from './MoleculeLibrary';
import { SpectroscopyViewer } from './SpectroscopyViewer';
import { PHSimulator } from './pHSimulator';
import { TutorialMode } from './TutorialMode';
import type { Element, Molecule } from '../lib/supabase';
import { getElements, getMolecules, localElements, localMolecules } from '../lib/referenceData';
import { chemistryEngine, reactionModels, type ReactionResult } from '../lib/chemistryEngine';

export type LabView = 'lab' | 'molecules' | 'spectroscopy' | 'ph' | 'recipes' | 'tutorials';
interface SelectedComponent {
  element: Element;
  mass: number;
  moles: number;
}
const makeComponent = (element: Element, moles: number): SelectedComponent => ({
  element,
  moles,
  mass: element.atomic_mass * moles,
});
const initialComponents = () => [
  makeComponent(localElements[0], 0.2),
  makeComponent(localElements[7], 0.1),
];
const formatFormula = (formula: string) => formula.replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)]);
const viewTitles = {
  lab: 'Your ideas. A world of reactions.',
  molecules: 'Meet the molecules.',
  spectroscopy: 'See beyond the visible.',
  ph: 'Find the right balance.',
  recipes: 'A starting point for discovery.',
  tutorials: 'Build your chemistry intuition.',
};

export function Laboratory({
  view,
  onViewChange,
}: {
  view: LabView;
  onViewChange: (view: LabView) => void;
}) {
  const [elements, setElements] = useState(localElements);
  const [molecules, setMolecules] = useState(localMolecules);
  const [components, setComponents] = useState<SelectedComponent[]>(initialComponents);
  const [temperature, setTemperature] = useState(298.15);
  const [pressure, setPressure] = useState(1);
  const [volume, setVolume] = useState(1);
  const [atmosphere, setAtmosphere] = useState('air');
  const [results, setResults] = useState<ReactionResult | null>(null);
  const [tab, setTab] = useState<'experiment' | 'results' | 'notes'>('experiment');
  const [experimentName, setExperimentName] = useState('Untitled experiment');
  const [selectedMolecule, setSelectedMolecule] = useState<Molecule | null>(localMolecules[0]);
  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem('quantum-lab-notes') ?? '';
    } catch {
      return '';
    }
  });
  const [notice, setNotice] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const resultsPanel = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    let active = true;
    void getElements().then((data) => {
      if (active) setElements(data);
    });
    void getMolecules().then((data) => {
      if (active) {
        setMolecules(data);
        setSelectedMolecule(
          (previous) => data.find((m) => m.formula === previous?.formula) ?? data[0] ?? null,
        );
      }
    });
    return () => {
      active = false;
      clearTimeout(timer.current);
      clearTimeout(noticeTimer.current);
    };
  }, []);
  useEffect(() => {
    if (!results) return;
    resultsPanel.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
    resultsPanel.current?.focus({ preventScroll: true });
  }, [results]);
  const notify = (text: string) => {
    clearTimeout(noticeTimer.current);
    setNotice(text);
    noticeTimer.current = setTimeout(() => setNotice(''), 4000);
  };
  const invalidate = () => {
    setResults(null);
    setError('');
    clearTimeout(timer.current);
    setRunning(false);
  };
  const selectElement = (element: Element) => {
    invalidate();
    setComponents((prev) =>
      prev.some((c) => c.element.id === element.id)
        ? prev.filter((c) => c.element.id !== element.id)
        : [...prev, makeComponent(element, 0.1)],
    );
  };
  const reset = () => {
    invalidate();
    setComponents([]);
    setTemperature(298.15);
    setPressure(1);
    setVolume(1);
    setAtmosphere('air');
    setExperimentName('Untitled experiment');
    setTab('experiment');
    notify('New experiment ready. Select elements to begin.');
  };
  const run = () => {
    if (!components.length || running) return;
    setRunning(true);
    setError('');
    timer.current = setTimeout(() => {
      try {
        setResults(
          chemistryEngine.predictReaction({
            components,
            temperature,
            pressure,
            volume,
            atmosphere,
          }),
        );
        setTab('results');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'The simulation could not be completed.');
      } finally {
        setRunning(false);
      }
    }, 350);
  };
  const loadModel = (formula: string) => {
    const model = reactionModels.find((m) => m.formula === formula)!;
    const first = elements.find((el) => el.symbol === model.atoms[0])!;
    const second = elements.find((el) => el.symbol === model.atoms[2])!;
    invalidate();
    setComponents([
      makeComponent(first, model.atoms[1] * 0.1),
      makeComponent(second, model.atoms[3] * 0.1),
    ]);
    setTemperature(model.minTemperature);
    setPressure(1);
    setVolume(1);
    setAtmosphere('argon');
    setExperimentName(`${model.name} formation`);
    setTab('experiment');
    onViewChange('lab');
    notify('Recipe loaded. Review the conditions, then run your simulation.');
  };
  const exportResults = () => {
    const report = {
      title: experimentName,
      exportedAt: new Date().toISOString(),
      model:
        'Educational, isothermal, complete conversion; elemental amounts in mol of atoms; energy in kJ.',
      inputs: {
        components: components.map((c) => ({
          symbol: c.element.symbol,
          mass_g: c.mass,
          atomic_moles: c.moles,
        })),
        temperature_K: temperature,
        pressure_atm: pressure,
        volume_L: volume,
        atmosphere,
      },
      results,
      notes,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quantum-lab-experiment.json';
    link.click();
    URL.revokeObjectURL(url);
    notify('Experiment exported as JSON.');
  };
  const totalMass = components.reduce((sum, c) => sum + c.mass, 0);
  return (
    <main id="workspace" className="workspace-main">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="tiny-dot" /> VIRTUAL CHEMISTRY LABORATORY
          </div>
          <h1>{viewTitles[view]}</h1>
          <p>Explore elements, build mixtures, and discover the chemistry between them.</p>
        </div>
        <button
          className="secondary-button new-experiment"
          onClick={() => {
            reset();
            onViewChange('lab');
          }}
        >
          <Plus size={16} /> New experiment
        </button>
      </div>
      <div hidden={view !== 'lab'}>
        <div className="experiment-toolbar">
          <div className="experiment-title">
            <span className="experiment-icon">
              <FlaskConical size={16} />
            </span>
            <input
              aria-label="Experiment name"
              value={experimentName}
              maxLength={80}
              onChange={(e) => setExperimentName(e.target.value)}
            />
            <span className="draft-tag">{results ? 'Completed' : 'Draft'}</span>
          </div>
          <button className="text-button" onClick={() => onViewChange('recipes')}>
            <Layers3 size={14} /> Load a recipe <ChevronRight size={14} />
          </button>
        </div>
        <div
          className="workspace-tabs"
          onKeyDown={(e) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
            e.preventDefault();
            const tabs = ['experiment', 'results', 'notes'] as const;
            const index = tabs.indexOf(tab);
            const next =
              e.key === 'Home'
                ? 0
                : e.key === 'End'
                  ? 2
                  : (index + (e.key === 'ArrowRight' ? 1 : 2)) % 3;
            setTab(tabs[next]);
            document.getElementById(`tab-${tabs[next]}`)?.focus();
          }}
          role="tablist"
          aria-label="Experiment panels"
        >
          {(
            [
              { id: 'experiment', label: 'Experiment', icon: FlaskConical },
              { id: 'results', label: 'Results & analysis', icon: Activity },
              { id: 'notes', label: 'Lab notes', icon: FileText },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              tabIndex={tab === id ? 0 : -1}
              id={`tab-${id}`}
              aria-controls={`panel-${id}`}
              aria-selected={tab === id}
              className={tab === id ? 'active' : ''}
              onClick={() => setTab(id)}
            >
              <Icon size={15} />
              {label}
              {id === 'results' && results && <span className="tiny-dot" />}
            </button>
          ))}
          <span className="workspace-tab-hint">
            <span className="tiny-dot" /> Local model ready
          </span>
        </div>
        <div className="lab-grid">
          <div className="lab-primary">
            <div
              role="tabpanel"
              id="panel-experiment"
              aria-labelledby="tab-experiment"
              hidden={tab !== 'experiment'}
            >
              <PeriodicTable
                elements={elements}
                onElementSelect={selectElement}
                selectedElements={components.map((c) => c.element.id)}
              />
            </div>
            <div
              role="tabpanel"
              ref={resultsPanel}
              tabIndex={-1}
              id="panel-results"
              aria-labelledby="tab-results"
              hidden={tab !== 'results'}
              className="panel results-panel"
            >
              <div className="panel-heading">
                <div>
                  <h2>Results & analysis</h2>
                  <p>Stoichiometric predictions · isothermal model</p>
                </div>
                <button className="text-button" onClick={exportResults}>
                  <Download size={14} /> Export
                </button>
              </div>
              {!results ? (
                <div className="results-empty">
                  <Activity size={30} />
                  <h3>A little chemistry is all it takes.</h3>
                  <p>
                    Add your elements and run a simulation to see products,
                    <br />
                    limiting-reactant conversion, and energy estimates.
                  </p>
                  <button className="secondary-button" onClick={() => setTab('experiment')}>
                    Build your experiment <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="results-content">
                  <div className={`result-status ${results.status === 'reacted' ? 'success' : ''}`}>
                    {results.status === 'reacted' ? <Check size={16} /> : <Info size={16} />}
                    <strong>
                      {results.status === 'reacted'
                        ? 'Reaction complete'
                        : results.status === 'conditions-not-met'
                          ? 'Activation conditions not met'
                          : results.status === 'unsupported'
                            ? 'Outside the supported model'
                            : 'No reaction modeled'}
                    </strong>
                  </div>
                  {results.equation && <div className="reaction-equation">{results.equation}</div>}
                  <p className="result-description">{results.message}</p>
                  {results.status === 'conditions-not-met' && (
                    <button className="text-button" onClick={() => onViewChange('recipes')}>
                      Load a supported starting condition <ArrowRight size={14} />
                    </button>
                  )}
                  {results.products.map((product) => (
                    <div className="product-row" key={product.formula}>
                      <span className="product-symbol">{formatFormula(product.formula)}</span>
                      <div>
                        <strong>{product.description}</strong>
                        <small>Product formed</small>
                      </div>
                      <div>
                        <strong>
                          {product.mass.toFixed(4)} <small>g</small>
                        </strong>
                        <small>{product.moles.toFixed(4)} mol</small>
                      </div>
                    </div>
                  ))}
                  <div className="result-metrics">
                    <div>
                      <span>
                        Energy change <small>ΔH° estimate</small>
                      </span>
                      <strong>
                        {results.energy_change.toFixed(2)} <small>kJ</small>
                      </strong>
                    </div>
                    <div>
                      <span>Mass balance</span>
                      <strong>
                        {(
                          results.products.reduce((sum, p) => sum + p.mass, 0) +
                          results.remaining.reduce((sum, p) => sum + p.mass, 0)
                        ).toFixed(4)}{' '}
                        <small>g</small>
                      </strong>
                    </div>
                    <div>
                      <span>Temperature</span>
                      <strong>
                        {temperature.toFixed(2)} <small>K · held</small>
                      </strong>
                    </div>
                  </div>
                  {results.remaining.length > 0 && (
                    <div className="remaining">
                      <h3>Unreacted material</h3>
                      {results.remaining.map((p, i) => (
                        <span key={i}>
                          {p.formula} <strong>{p.mass.toFixed(4)} g</strong>
                        </span>
                      ))}
                    </div>
                  )}
                  {results.hazards.length > 0 && (
                    <div className="safety-warning">
                      <AlertTriangle size={16} />
                      <div>
                        <strong>Safety observations</strong>
                        {results.hazards.map((h) => (
                          <p key={h}>{h}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="model-note">
                    Reference enthalpies at 298 K. No heat-capacity corrections, kinetics,
                    catalysts, or equilibrium calculations. Never use this output as a real-world
                    procedure.
                  </p>
                </div>
              )}
            </div>
            <div
              role="tabpanel"
              id="panel-notes"
              aria-labelledby="tab-notes"
              hidden={tab !== 'notes'}
              className="panel notes-panel"
            >
              <div className="panel-heading">
                <div>
                  <h2>Lab notes</h2>
                  <p>Your observations, questions, and next discoveries</p>
                </div>
                <span className="draft-tag">This browser only</span>
              </div>
              <label htmlFor="lab-notes" className="sr-only">
                Lab notes
              </label>
              <textarea
                id="lab-notes"
                value={notes}
                placeholder="What do you expect to happen? Record your observations here…"
                onChange={(e) => {
                  setNotes(e.target.value);
                  try {
                    localStorage.setItem('quantum-lab-notes', e.target.value);
                  } catch {
                    notify('Browser storage is unavailable. Export your notes to keep them.');
                  }
                }}
              />
              <div className="notes-footer">
                Notes are shared across experiments in this browser.
                <button className="text-button" onClick={exportResults}>
                  <Download size={14} /> Export notes & experiment
                </button>
              </div>
            </div>
            <VisualizationCanvas
              active={view === 'lab'}
              components={components}
              result={results}
              temperature={temperature}
            />
            <div className="discovery-tip">
              <span>
                <Info size={16} />
              </span>
              <p>
                <strong>Curiosity looks good on you.</strong> Start with a recipe to explore a
                supported reaction, or mix your own elements.
              </p>
              <button onClick={() => onViewChange('recipes')} aria-label="Explore recipes">
                <ArrowUpRight size={17} />
              </button>
            </div>
          </div>
          <aside className="panel experiment-controls" aria-label="Experiment controls">
            <div className="panel-heading">
              <h2>Experiment setup</h2>
              <span className="settings-badge">01</span>
            </div>
            <section className="mixture-section">
              <div className="section-heading">
                <h3>
                  <Atom size={15} /> Your mixture{' '}
                  <span className="count-tag">{components.length.toString().padStart(2, '0')}</span>
                </h3>
                <button
                  className="text-button"
                  disabled={!components.length}
                  onClick={() => {
                    invalidate();
                    setComponents([]);
                  }}
                >
                  Clear
                </button>
              </div>
              {!components.length ? (
                <div className="mixture-empty">
                  <Plus size={21} />
                  <p>Select elements from the periodic table to get started.</p>
                  <button className="text-button" onClick={() => setTab('experiment')}>
                    Open periodic table <ArrowRight size={13} />
                  </button>
                </div>
              ) : (
                <div className="component-list">
                  {components.map((c) => (
                    <div className="component-item" key={c.element.id}>
                      <span
                        className="component-symbol"
                        style={
                          {
                            '--element-color': categoryColors[elementCategory(c.element)],
                          } as CSSProperties
                        }
                      >
                        <small>{c.element.id}</small>
                        {c.element.symbol}
                      </span>
                      <div className="component-details">
                        <strong>{c.element.name}</strong>
                        <span>{c.moles.toFixed(4)} mol atoms</span>
                        <div className="mass-input">
                          <NumberField
                            label={`${c.element.name} mass in grams`}
                            min={0.00001}
                            max={10000}
                            value={c.mass}
                            onChange={(mass) => {
                              invalidate();
                              setComponents((prev) =>
                                prev.map((item) =>
                                  item.element.id === c.element.id
                                    ? { ...item, mass, moles: mass / item.element.atomic_mass }
                                    : item,
                                ),
                              );
                            }}
                          />
                          <span>g</span>
                        </div>
                      </div>
                      <button
                        className="icon-button remove-component"
                        aria-label={`Remove ${c.element.name}`}
                        onClick={() => selectElement(c.element)}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mixture-total">
                <span>Total mass</span>
                <strong>
                  {totalMass.toFixed(4)} <small>g</small>
                </strong>
              </div>
            </section>
            <ParameterControls
              temperature={temperature}
              pressure={pressure}
              volume={volume}
              atmosphere={atmosphere}
              onTemperatureChange={(v) => {
                invalidate();
                setTemperature(v);
              }}
              onPressureChange={(v) => {
                invalidate();
                setPressure(v);
              }}
              onVolumeChange={(v) => {
                invalidate();
                setVolume(v);
              }}
              onAtmosphereChange={(v) => {
                invalidate();
                setAtmosphere(v);
              }}
            />
            <div className="run-section">
              <button
                className="primary-button run-button"
                onClick={run}
                disabled={!components.length || running}
              >
                {running ? (
                  <span className="button-spinner" />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
                {running ? 'Calculating…' : 'Run simulation'}
                <span>↵</span>
              </button>
              <button className="reset-button" onClick={reset}>
                <RotateCcw size={13} /> Reset experiment
              </button>
              <p>
                <span className="tiny-dot" /> Isothermal · Educational model
              </p>
              {error && (
                <div role="alert" className="input-error">
                  {error}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
      {view === 'molecules' && (
        <div className="advanced-workspace">
          <MoleculeLibrary
            selectedMoleculeId={selectedMolecule?.id}
            onSelectMolecule={(m) => {
              setSelectedMolecule(m);
              notify(`${m.name} selected for spectroscopy.`);
            }}
          />
          <button className="primary-button" onClick={() => onViewChange('spectroscopy')}>
            Analyze {selectedMolecule?.name ?? 'selected molecule'} <ArrowRight size={16} />
          </button>
        </div>
      )}
      {view === 'spectroscopy' && (
        <div className="advanced-workspace">
          <div className="analysis-picker">
            <label htmlFor="spectrum-molecule">Molecule to analyze</label>
            <select
              id="spectrum-molecule"
              value={selectedMolecule?.id ?? ''}
              onChange={(e) =>
                setSelectedMolecule(molecules.find((m) => m.id === e.target.value) ?? null)
              }
            >
              {molecules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.formula}
                </option>
              ))}
            </select>
            <span>Synthetic spectra · qualitative estimates</span>
          </div>
          <SpectroscopyViewer
            molecule={selectedMolecule}
            elements={components.map((c) => c.element)}
          />
        </div>
      )}
      {view === 'ph' && (
        <div className="advanced-workspace">
          <p className="model-banner">
            <Info size={15} /> Simplified acid–base equilibrium at 25°C. For educational exploration
            only.
          </p>
          <PHSimulator molecules={molecules} />
        </div>
      )}
      {view === 'recipes' && (
        <>
          <div className="recipe-intro">
            <span className="count-tag">7 GUIDED EXPERIMENTS</span>
            <p>Balanced starting mixtures. Clear outcomes. Plenty to discover.</p>
          </div>
          <div className="recipe-grid">
            {reactionModels.map((model, i) => (
              <article className="panel recipe-card" key={model.formula}>
                <div className="recipe-card-top">
                  <span className="recipe-index">EXPERIMENT {String(i + 1).padStart(2, '0')}</span>
                  <span className="draft-tag">Guided</span>
                </div>
                <div className="recipe-formula">{formatFormula(model.formula)}</div>
                <h2>{model.name} formation</h2>
                <p>{model.equation}</p>
                <div className="recipe-meta">
                  <span>{model.minTemperature.toFixed(0)} K</span>
                  <span>1 atm</span>
                  <span>2 elements</span>
                </div>
                <button className="secondary-button" onClick={() => loadModel(model.formula)}>
                  Load experiment <ArrowUpRight size={15} />
                </button>
              </article>
            ))}
          </div>
          <p className="model-note">
            Recipes are simulation presets, not laboratory instructions. Activation temperatures are
            illustrative model gates. Real reactions may require different conditions and specialist
            safety controls.
          </p>
        </>
      )}
      {view === 'tutorials' && (
        <div className="advanced-workspace">
          <TutorialMode onClose={() => onViewChange('lab')} />
        </div>
      )}
      <div className={`toast ${notice ? 'visible' : ''}`} role="status" aria-live="polite">
        <Check size={16} />
        {notice}
      </div>
    </main>
  );
}
