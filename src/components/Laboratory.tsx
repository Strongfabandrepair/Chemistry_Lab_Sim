import { useState, useEffect, useMemo } from 'react';
import { FlaskConical, Play, RotateCcw, AlertTriangle } from 'lucide-react';
import { PeriodicTable } from './PeriodicTable';
import { VisualizationCanvas } from './VisualizationCanvas';
import { ParameterControls } from './ParameterControls';
import { RecipesBook } from './RecipesBook';
import { Element, supabase } from '../lib/supabase';
import { chemistryEngine, MixtureState } from '../lib/chemistryEngine';
import { VisualizationEngine } from '../lib/visualizationEngine';

interface SelectedComponent {
  element: Element;
  mass: number;
  moles: number;
}

export function Laboratory() {
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponent[]>([]);
  const [temperature, setTemperature] = useState(298.15);
  const [pressure, setPressure] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [atmosphere, setAtmosphere] = useState('air');
  const [results, setResults] = useState<any>(null);
  const [hazards, setHazards] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const visualizationEngine = useMemo(() => new VisualizationEngine(), []);

  useEffect(() => {
    if (selectedComponents.length > 0) {
      const particles = visualizationEngine.createParticles(
        selectedComponents.map(c => ({
          element: c.element,
          mass: c.mass,
          moles: c.moles
        })),
        volume,
        temperature
      );

      visualizationEngine.setState({
        particles,
        bonds: [],
        effects: [],
        temperature,
        phase: temperature > 1000 ? 'gas' : temperature > 373 ? 'liquid' : 'solid'
      });
    } else {
      visualizationEngine.setState({
        particles: [],
        bonds: [],
        effects: [],
        temperature,
        phase: 'solid'
      });
    }
  }, [selectedComponents, temperature, volume, visualizationEngine]);

  const handleElementSelect = (element: Element) => {
    const defaultMass = element.atomic_mass || 1;
    const defaultMoles = 0.1;

    setSelectedComponents(prev => {
      const existing = prev.find(c => c.element.id === element.id);
      if (existing) {
        return prev.filter(c => c.element.id !== element.id);
      }
      return [...prev, { element, mass: defaultMass * defaultMoles, moles: defaultMoles }];
    });
  };

  const updateComponentMass = (elementId: number, mass: number) => {
    setSelectedComponents(prev =>
      prev.map(c =>
        c.element.id === elementId
          ? { ...c, mass, moles: mass / (c.element.atomic_mass || 1) }
          : c
      )
    );
  };

  const runSimulation = () => {
    setIsSimulating(true);
    setHazards([]);

    const mixture: MixtureState = {
      components: selectedComponents.map(c => ({
        element: c.element,
        mass: c.mass,
        moles: c.moles
      })),
      temperature,
      pressure,
      volume,
      atmosphere
    };

    const result = chemistryEngine.predictReaction(mixture);

    setResults(result);
    setHazards(result.hazards);

    const particles = visualizationEngine.createParticles(
      mixture.components,
      volume,
      temperature + result.temperature_change
    );

    visualizationEngine.setState({
      particles,
      effects: [],
      temperature: temperature + result.temperature_change,
      phase: result.phase_transitions.length > 0 ? result.phase_transitions[0].to : 'solid'
    });

    result.visual_effects.forEach(effect => {
      visualizationEngine.addEffect(effect);
    });

    if (result.temperature_change !== 0) {
      setTemperature(prev => prev + result.temperature_change);
    }

    setTimeout(() => setIsSimulating(false), 500);
  };

  const resetLaboratory = () => {
    setSelectedComponents([]);
    setTemperature(298.15);
    setPressure(1.0);
    setVolume(1.0);
    setAtmosphere('air');
    setResults(null);
    setHazards([]);
    visualizationEngine.setState({
      particles: [],
      effects: [],
      temperature: 298.15,
      phase: 'solid'
    });
  };

  const loadRecipe = async (recipe: any) => {
    console.log('Loading recipe:', recipe.name);
    resetLaboratory();

    try {
      const elementPromises = recipe.ingredients.map(async (ingredient: any) => {
        const { data, error } = await supabase
          .from('elements')
          .select('*')
          .eq('id', ingredient.element_id)
          .maybeSingle();

        if (error || !data) {
          console.error('Error loading element:', ingredient.element_id, error);
          return null;
        }

        return {
          element: data as Element,
          mass: ingredient.mass,
          moles: ingredient.moles
        };
      });

      const components = (await Promise.all(elementPromises)).filter(c => c !== null) as SelectedComponent[];

      console.log('Loaded components:', components);

      setSelectedComponents(components);
      setTemperature(recipe.temperature);
      setPressure(recipe.pressure);
      setVolume(recipe.volume || 1.0);
      setAtmosphere(recipe.atmosphere);

      console.log('Recipe loaded successfully');
    } catch (error) {
      console.error('Error loading recipe:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">Quantum Chemistry Laboratory</h1>
              <p className="text-sm text-gray-400">Research-Grade Molecular Simulator</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-gray-900/50 backdrop-blur rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Interactive Periodic Table</h2>
              <PeriodicTable
                onElementSelect={handleElementSelect}
                selectedElements={selectedComponents.map(c => c.element.id)}
              />
            </div>

            <div className="bg-gray-900/50 backdrop-blur rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Molecular Visualization</h2>
              <VisualizationCanvas engine={visualizationEngine} width={800} height={500} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-900/50 backdrop-blur rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Selected Components</h2>
              {selectedComponents.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  Select elements from the periodic table
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedComponents.map(component => (
                    <div
                      key={component.element.id}
                      className="bg-gray-800 rounded-lg p-3 border border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{component.element.symbol}</span>
                          <span className="text-sm text-gray-400">{component.element.name}</span>
                        </div>
                        <button
                          onClick={() => handleElementSelect(component.element)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-400">Mass (g)</label>
                          <input
                            type="number"
                            min="0.001"
                            step="0.1"
                            value={component.mass.toFixed(3)}
                            onChange={(e) =>
                              updateComponentMass(component.element.id, parseFloat(e.target.value))
                            }
                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          {component.moles.toFixed(4)} moles
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <RecipesBook onLoadRecipe={loadRecipe} />

            <ParameterControls
              temperature={temperature}
              pressure={pressure}
              volume={volume}
              atmosphere={atmosphere}
              onTemperatureChange={setTemperature}
              onPressureChange={setPressure}
              onVolumeChange={setVolume}
              onAtmosphereChange={setAtmosphere}
            />

            <div className="flex gap-3">
              <button
                onClick={runSimulation}
                disabled={selectedComponents.length === 0 || isSimulating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-5 h-5" />
                {isSimulating ? 'Simulating...' : 'Run Simulation'}
              </button>
              <button
                onClick={resetLaboratory}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {hazards.length > 0 && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-red-400 mb-2">Safety Warnings</h3>
                    <ul className="space-y-1 text-sm text-red-300">
                      {hazards.map((hazard, i) => (
                        <li key={i}>{hazard}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {results && results.products.length > 0 && (
              <div className="bg-gray-900/50 backdrop-blur rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold mb-3">Simulation Results</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Products Formed</h4>
                    {results.products.map((product: any, i: number) => (
                      <div key={i} className="bg-gray-800 rounded p-3 mb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-mono text-lg">{product.formula}</div>
                            {product.description && (
                              <div className="text-sm text-blue-300 mb-1">
                                {product.description}
                              </div>
                            )}
                            <div className="text-xs text-gray-400">
                              Mass: {product.mass.toFixed(3)} g
                            </div>
                            <div className="text-xs text-gray-400">
                              Amount: {product.moles.toFixed(4)} moles
                            </div>
                          </div>
                          <div
                            className="w-8 h-8 rounded border border-gray-600 flex-shrink-0 ml-3"
                            style={{ backgroundColor: product.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {results.energy_change !== 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-1">Energy Change</h4>
                      <div className={`text-lg font-mono ${results.energy_change < 0 ? 'text-blue-400' : 'text-red-400'}`}>
                        {results.energy_change > 0 ? '+' : ''}{results.energy_change.toFixed(2)} kJ/mol
                      </div>
                      <div className="text-xs text-gray-500">
                        {results.energy_change < 0 ? 'Exothermic (releases heat)' : 'Endothermic (absorbs heat)'}
                      </div>
                    </div>
                  )}

                  {results.temperature_change !== 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-1">Temperature Change</h4>
                      <div className="text-lg font-mono text-orange-400">
                        {results.temperature_change > 0 ? '+' : ''}{results.temperature_change.toFixed(2)} K
                      </div>
                    </div>
                  )}

                  {results.phase_transitions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-1">Phase Transitions</h4>
                      {results.phase_transitions.map((transition: any, i: number) => (
                        <div key={i} className="text-sm">
                          {transition.substance}: {transition.from} → {transition.to}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
