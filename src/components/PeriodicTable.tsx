import { useEffect, useState } from 'react';
import { Element, supabase } from '../lib/supabase';
import { getElementColorRGB } from '../lib/elementColors';

interface PeriodicTableProps {
  onElementSelect: (element: Element) => void;
  selectedElements: number[];
}

export function PeriodicTable({ onElementSelect, selectedElements }: PeriodicTableProps) {
  const [elements, setElements] = useState<Element[]>([]);
  const [hoveredElement, setHoveredElement] = useState<Element | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadElements();
  }, []);

  async function loadElements() {
    console.log('Loading elements from database...');
    try {
      const { data, error } = await supabase
        .from('elements')
        .select('*')
        .order('id');

      if (error) {
        console.error('Error loading elements:', error);
        setError(error.message);
        setLoading(false);
        return;
      }

      console.log('Loaded elements:', data?.length);
      setElements(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Exception loading elements:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }

  const getElementPosition = (element: Element) => {
    const id = element.id;
    let row = element.period;
    let col = element.group_number;

    if (id >= 57 && id <= 71) {
      row = 8;
      col = id - 54;
    } else if (id >= 89 && id <= 103) {
      row = 9;
      col = id - 86;
    } else if (id === 57 || id === 89) {
      col = 3;
    }

    if (col === null || col === undefined) {
      if (id >= 58 && id <= 71) {
        row = 8;
        col = id - 54;
      } else if (id >= 90 && id <= 103) {
        row = 9;
        col = id - 86;
      }
    }

    return { row, col: col || 1 };
  };

  const getColorByBlock = (block: string) => {
    switch (block) {
      case 's': return 'bg-red-900/30 border-red-500/50';
      case 'p': return 'bg-blue-900/30 border-blue-500/50';
      case 'd': return 'bg-yellow-900/30 border-yellow-500/50';
      case 'f': return 'bg-green-900/30 border-green-500/50';
      default: return 'bg-gray-900/30 border-gray-500/50';
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'solid': return 'text-gray-200';
      case 'liquid': return 'text-blue-400';
      case 'gas': return 'text-green-400';
      default: return 'text-white';
    }
  };

  if (loading) {
    return <div className="text-white text-center p-8">Loading periodic table...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-400 mb-2">Error loading periodic table</div>
        <div className="text-gray-400 text-sm">{error}</div>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            loadElements();
          }}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (elements.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="text-yellow-400 mb-2">No elements found</div>
        <div className="text-gray-400 text-sm">The periodic table database appears to be empty</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="grid gap-0.5 p-4" style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}>
        {elements.map((element) => {
          const { row, col } = getElementPosition(element);
          const isSelected = selectedElements.includes(element.id);

          return (
            <button
              key={element.id}
              onClick={() => onElementSelect(element)}
              onMouseEnter={() => setHoveredElement(element)}
              onMouseLeave={() => setHoveredElement(null)}
              className={`
                ${getColorByBlock(element.group_block)}
                ${isSelected ? 'ring-2 ring-white scale-110 z-10' : 'hover:scale-105'}
                relative border rounded transition-all duration-200
                flex flex-col items-center justify-center
                p-1 min-h-[60px] cursor-pointer
              `}
              style={{
                gridRow: row,
                gridColumn: col || 1
              }}
            >
              <div className="text-[8px] text-gray-400 absolute top-0.5 left-0.5">{element.id}</div>

              <div className="relative mb-1">
                <div
                  className="w-8 h-8 rounded-full border-2 shadow-lg mx-auto"
                  style={{
                    backgroundColor: getElementColorRGB(element.color),
                    borderColor: element.phase_at_stp === 'gas' ? '#4ADE80' : element.phase_at_stp === 'liquid' ? '#60A5FA' : '#9CA3AF'
                  }}
                  title={element.color}
                />
              </div>

              <div className={`text-xl font-bold ${getPhaseColor(element.phase_at_stp)}`}>
                {element.symbol}
              </div>
              <div className="text-[9px] text-gray-400 truncate max-w-full">{element.name}</div>
              <div className="text-[8px] text-gray-500">{element.atomic_mass?.toFixed(2)}</div>
            </button>
          );
        })}
      </div>

      {hoveredElement && (
        <div className="absolute top-4 right-4 bg-gray-900/95 border border-gray-700 rounded-lg p-4 w-72 shadow-2xl z-50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-4xl font-bold text-white">{hoveredElement.symbol}</div>
              <div className="text-sm text-gray-400">{hoveredElement.name}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Atomic Number</div>
              <div className="text-2xl font-bold text-white">{hoveredElement.id}</div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-500">Atomic Mass</div>
                <div className="text-white">{hoveredElement.atomic_mass?.toFixed(3)} u</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Phase at STP</div>
                <div className={getPhaseColor(hoveredElement.phase_at_stp)}>
                  {hoveredElement.phase_at_stp}
                </div>
              </div>
            </div>

            {hoveredElement.electronegativity && (
              <div>
                <div className="text-xs text-gray-500">Electronegativity</div>
                <div className="text-white">{hoveredElement.electronegativity}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-500">Melting Point</div>
                <div className="text-white">{hoveredElement.melting_point?.toFixed(1)} K</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Boiling Point</div>
                <div className="text-white">{hoveredElement.boiling_point?.toFixed(1)} K</div>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Electron Configuration</div>
              <div className="text-white text-xs">{hoveredElement.electron_config}</div>
            </div>

            {hoveredElement.oxidation_states && hoveredElement.oxidation_states.length > 0 && (
              <div>
                <div className="text-xs text-gray-500">Oxidation States</div>
                <div className="text-white">{hoveredElement.oxidation_states.join(', ')}</div>
              </div>
            )}

            <div>
              <div className="text-xs text-gray-500">Color</div>
              <div className="text-white">{hoveredElement.color}</div>
            </div>

            {hoveredElement.is_radioactive && (
              <div className="bg-yellow-900/30 border border-yellow-500/50 rounded p-2 text-yellow-400 text-xs">
                Radioactive Element
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-4 p-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-900/30 border border-red-500/50 rounded"></div>
          <span className="text-gray-400">s-block</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-900/30 border border-blue-500/50 rounded"></div>
          <span className="text-gray-400">p-block</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-900/30 border border-yellow-500/50 rounded"></div>
          <span className="text-gray-400">d-block</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-900/30 border border-green-500/50 rounded"></div>
          <span className="text-gray-400">f-block</span>
        </div>
      </div>
    </div>
  );
}
