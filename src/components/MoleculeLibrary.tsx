import { getMolecules } from '../lib/referenceData';
import { useState, useEffect, useMemo } from 'react';
import { Atom, Search, Filter, Info } from 'lucide-react';
import { Molecule } from '../lib/supabase';

interface MoleculeLibraryProps {
  onSelectMolecule: (molecule: Molecule) => void;
  selectedMoleculeId?: string;
}

export function MoleculeLibrary({ onSelectMolecule, selectedMoleculeId }: MoleculeLibraryProps) {
  const [molecules, setMolecules] = useState<Molecule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'organic' | 'inorganic'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMolecules();
  }, []);

  const loadMolecules = async () => {
    try {
      const data = await getMolecules();
      if (data) {
        setMolecules(data as Molecule[]);
      }
    } catch (error) {
      console.error('Error loading molecules:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMolecules = useMemo(() => {
    let filtered = molecules;

    if (filterType !== 'all') {
      filtered = filtered.filter((m) => m.structure_type === filterType);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          m.formula.toLowerCase().includes(term) ||
          m.functional_groups.some((g) => g.toLowerCase().includes(term)),
      );
    }

    return filtered;
  }, [filterType, searchTerm, molecules]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur rounded-lg p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <Atom className="w-7 h-7 text-blue-400" />
        <div>
          <h2 className="text-xl font-bold">Molecule Library</h2>
          <p className="text-sm text-gray-400">Explore organic and inorganic compounds</p>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            aria-label="Search molecules"
            placeholder="Search by name, formula, or functional group..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('organic')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'organic'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Organic
          </button>
          <button
            onClick={() => setFilterType('inorganic')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'inorganic'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Inorganic
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
        {filteredMolecules.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-gray-400">
            <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No molecules found matching your criteria</p>
          </div>
        ) : (
          filteredMolecules.map((molecule) => (
            <button
              key={molecule.id}
              aria-pressed={molecule.id === selectedMoleculeId}
              onClick={() => onSelectMolecule(molecule)}
              className={`text-left p-4 rounded-lg border transition-all ${
                molecule.id === selectedMoleculeId
                  ? 'bg-blue-600/20 border-blue-500'
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{molecule.name}</h3>
                  <p className="text-sm text-gray-400">{molecule.formula}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    molecule.structure_type === 'organic'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-purple-500/20 text-purple-400'
                  }`}
                >
                  {molecule.structure_type}
                </span>
              </div>

              {molecule.functional_groups.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {molecule.functional_groups.slice(0, 3).map((group, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300"
                    >
                      {group}
                    </span>
                  ))}
                  {molecule.functional_groups.length > 3 && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">
                      +{molecule.functional_groups.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>MW: {molecule.molecular_weight.toFixed(2)} g/mol</span>
                {molecule.geometry && (
                  <span className="flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {molecule.geometry}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500 text-center">
        Showing {filteredMolecules.length} of {molecules.length} molecules
      </div>
    </div>
  );
}
