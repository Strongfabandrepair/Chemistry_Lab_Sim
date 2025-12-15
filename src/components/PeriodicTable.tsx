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
      row = 9;
      col = id - 54;
    } else if (id >= 89 && id <= 103) {
      row = 10;
      col = id - 86;
    } else if (id === 57) {
      row = 6;
      col = 3;
    } else if (id === 89) {
      row = 7;
      col = 3;
    } else if (element.group_block === 'd') {
      if (col === null || col === undefined) {
        col = id - (row - 1) * 18 - 2;
        if (col < 3) col = 3;
        if (col > 12) col = 12;
      }
    }

    if (col === null || col === undefined) {
      col = 1;
    }

    return { row, col };
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

  const getElementVisualStyle = (element: Element) => {
    const baseColor = getElementColorRGB(element.color);

    if (element.symbol === 'C') {
      return {
        background: `repeating-linear-gradient(0deg, #1a1a1a 0px, #1a1a1a 8px, #2d2d2d 8px, #2d2d2d 16px), repeating-linear-gradient(90deg, #1a1a1a 0px, #1a1a1a 8px, #2d2d2d 8px, #2d2d2d 16px)`,
        backgroundBlendMode: 'multiply',
        pattern: 'graphite',
        description: 'Graphite - layered carbon sheets'
      };
    }

    if (element.symbol === 'S') {
      return {
        background: `radial-gradient(circle at 20% 30%, #ffff00, #e6e600 40%, #cccc00)`,
        pattern: 'crystalline-yellow',
        description: 'Yellow crystalline solid'
      };
    }

    if (element.symbol === 'I') {
      return {
        background: `linear-gradient(135deg, #4a0080 0%, #6a00b0 50%, #3a0060 100%)`,
        pattern: 'crystalline-purple',
        description: 'Purple-black lustrous crystals'
      };
    }

    if (element.symbol === 'Br') {
      return {
        background: `radial-gradient(ellipse at center, #8b4513 0%, #654321 50%, #432110 100%)`,
        pattern: 'liquid-reddish',
        description: 'Reddish-brown fuming liquid'
      };
    }

    if (element.symbol === 'Au') {
      return {
        background: `linear-gradient(135deg, #ffd700 0%, #ffed4e 40%, #ffd700 60%, #daa520 100%)`,
        pattern: 'metallic-gold',
        description: 'Shiny golden metallic'
      };
    }

    if (element.symbol === 'Ag') {
      return {
        background: `linear-gradient(135deg, #e8e8e8 0%, #ffffff 40%, #e8e8e8 60%, #c0c0c0 100%)`,
        pattern: 'metallic-silver',
        description: 'Shiny silver-white metal'
      };
    }

    if (element.symbol === 'Cu') {
      return {
        background: `linear-gradient(135deg, #d87e44 0%, #f0a060 40%, #d87e44 60%, #c06030 100%)`,
        pattern: 'metallic-copper',
        description: 'Reddish-brown metallic'
      };
    }

    if (element.symbol === 'Hg') {
      return {
        background: `radial-gradient(ellipse at center, #c0c0c0 0%, #a8a8a8 30%, #909090 60%, #787878 100%)`,
        pattern: 'liquid-metal',
        description: 'Silvery liquid metal'
      };
    }

    if (element.phase_at_stp === 'gas') {
      return {
        background: `radial-gradient(circle at 30% 30%, ${baseColor}40, ${baseColor}10)`,
        pattern: 'gas',
        description: 'Gaseous form - diffuse particles'
      };
    }

    if (element.phase_at_stp === 'liquid') {
      return {
        background: `linear-gradient(135deg, ${baseColor}80 25%, ${baseColor}40 25%, ${baseColor}40 50%, ${baseColor}80 50%, ${baseColor}80 75%, ${baseColor}40 75%, ${baseColor}40)`,
        backgroundSize: '20px 20px',
        pattern: 'liquid',
        description: 'Liquid form - flowing state'
      };
    }

    if (element.group_block === 'd' || element.symbol === 'Al' || element.symbol === 'Ga' || element.symbol === 'In' || element.symbol === 'Sn' || element.symbol === 'Pb') {
      return {
        background: `linear-gradient(135deg, ${baseColor} 0%, #ffffff30 40%, ${baseColor} 60%, #00000020 100%)`,
        pattern: 'metallic',
        description: 'Metallic solid - lustrous and conductive'
      };
    }

    if (element.group_number === 17) {
      return {
        background: `radial-gradient(circle at 50% 50%, ${baseColor}, ${baseColor}60)`,
        pattern: 'halogen',
        description: 'Halogen - reactive nonmetal'
      };
    }

    if (element.group_number === 18) {
      return {
        background: `radial-gradient(ellipse at center, ${baseColor}20 0%, ${baseColor}05 70%, transparent 100%)`,
        pattern: 'noble-gas',
        description: 'Noble gas - inert and unreactive'
      };
    }

    if (element.crystal_structure?.includes('cubic') || element.crystal_structure?.includes('hexagonal')) {
      return {
        background: `repeating-linear-gradient(45deg, ${baseColor}, ${baseColor} 10px, ${baseColor}80 10px, ${baseColor}80 20px)`,
        pattern: 'crystalline',
        description: `Crystalline solid - ${element.crystal_structure}`
      };
    }

    return {
      background: baseColor,
      pattern: 'solid',
      description: 'Solid form'
    };
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
    <div className="relative w-full">
      <div className="relative min-h-[600px]">
        <div className="grid gap-0.5 p-4" style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))', gridTemplateRows: 'repeat(10, minmax(0, 1fr))' }}>
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
                  ${isSelected ? 'ring-2 ring-white z-20' : 'hover:ring-1 hover:ring-gray-400'}
                  relative border rounded
                  flex flex-col items-center justify-center
                  p-1 min-h-[60px] cursor-pointer transition-colors
                `}
                style={{
                  gridRow: row,
                  gridColumn: col
                }}
              >
                <div className="text-[8px] text-gray-400 absolute top-0.5 left-0.5">{element.id}</div>

                <div className="relative mb-1">
                  <div
                    className="w-7 h-7 rounded-full border-2 shadow-lg mx-auto"
                    style={{
                      backgroundColor: getElementColorRGB(element.color),
                      borderColor: element.phase_at_stp === 'gas' ? '#4ADE80' : element.phase_at_stp === 'liquid' ? '#60A5FA' : '#9CA3AF'
                    }}
                  />
                </div>

                <div className={`text-lg font-bold ${getPhaseColor(element.phase_at_stp)}`}>
                  {element.symbol}
                </div>
                <div className="text-[8px] text-gray-400 text-center leading-tight px-0.5" style={{ maxWidth: '100%', wordBreak: 'break-word' }}>
                  {element.name}
                </div>
                <div className="text-[7px] text-gray-500">{element.atomic_mass?.toFixed(1)}</div>
              </button>
            );
          })}
        </div>

        {hoveredElement && (
          <div
            className="fixed bg-gray-900 border-2 border-gray-600 rounded-lg p-4 shadow-2xl pointer-events-none"
            style={{
              top: '50%',
              right: '20px',
              transform: 'translateY(-50%)',
              width: '300px',
              zIndex: 1000
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-3xl font-bold text-white">{hoveredElement.symbol}</div>
                <div className="text-sm text-gray-300">{hoveredElement.name}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Atomic Number</div>
                <div className="text-2xl font-bold text-white">{hoveredElement.id}</div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-2">Raw Material Appearance</div>
              <div className="relative">
                <div
                  className="w-full h-24 rounded-lg border-2 border-gray-700 overflow-hidden"
                  style={{
                    background: getElementVisualStyle(hoveredElement).background,
                    backgroundSize: getElementVisualStyle(hoveredElement).backgroundSize || 'cover'
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div
                        className="w-12 h-12 mx-auto rounded-full mb-1 border-2"
                        style={{
                          backgroundColor: getElementColorRGB(hoveredElement.color),
                          borderColor: hoveredElement.phase_at_stp === 'gas' ? '#4ADE80' : hoveredElement.phase_at_stp === 'liquid' ? '#60A5FA' : '#FFFFFF',
                          boxShadow: `0 0 20px ${getElementColorRGB(hoveredElement.color)}80`
                        }}
                      />
                      <div className="text-[10px] text-white/90 font-semibold bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                        {getElementVisualStyle(hoveredElement).description}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-gray-400">Atomic Mass</div>
                  <div className="text-white font-semibold">{hoveredElement.atomic_mass?.toFixed(3)} u</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Phase at STP</div>
                  <div className={`font-semibold capitalize ${getPhaseColor(hoveredElement.phase_at_stp)}`}>
                    {hoveredElement.phase_at_stp}
                  </div>
                </div>
              </div>

              {hoveredElement.electronegativity && (
                <div>
                  <div className="text-xs text-gray-400">Electronegativity</div>
                  <div className="text-white font-semibold">{hoveredElement.electronegativity}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-gray-400">Melting Point</div>
                  <div className="text-white font-semibold">{hoveredElement.melting_point?.toFixed(1)} K</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Boiling Point</div>
                  <div className="text-white font-semibold">{hoveredElement.boiling_point?.toFixed(1)} K</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-400">Electron Configuration</div>
                <div className="text-white text-xs font-mono">{hoveredElement.electron_config}</div>
              </div>

              {hoveredElement.oxidation_states && hoveredElement.oxidation_states.length > 0 && (
                <div>
                  <div className="text-xs text-gray-400">Oxidation States</div>
                  <div className="text-white font-semibold">{hoveredElement.oxidation_states.join(', ')}</div>
                </div>
              )}

              <div>
                <div className="text-xs text-gray-400">Color</div>
                <div className="text-white font-semibold capitalize">{hoveredElement.color}</div>
              </div>

              {hoveredElement.is_radioactive && (
                <div className="bg-yellow-900/30 border border-yellow-500/50 rounded p-2 text-yellow-400 text-xs font-semibold">
                  ⚠ Radioactive Element
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
