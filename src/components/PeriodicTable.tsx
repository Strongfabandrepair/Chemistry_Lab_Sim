import { categoryColors, elementCategory } from '../lib/elementCategories';
import { useState, type CSSProperties } from 'react';
import { Search, Info } from 'lucide-react';
import type { Element } from '../lib/supabase';
import { localElements } from '../lib/referenceData';

export function PeriodicTable({
  onElementSelect,
  selectedElements,
  elements = localElements,
}: {
  onElementSelect: (element: Element) => void;
  selectedElements: number[];
  elements?: Element[];
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [hovered, setHovered] = useState<Element | null>(null);
  const matches = (el: Element) =>
    (!category || elementCategory(el) === category) &&
    (!search ||
      `${el.name} ${el.symbol} ${el.id}`.toLowerCase().includes(search.toLowerCase().trim()));
  const count = elements.filter(matches).length;
  return (
    <section className="panel periodic-panel">
      <div className="panel-heading">
        <div>
          <h2>
            Periodic table <span className="count-tag">118</span>
          </h2>
          <p>Select elements to build your experiment</p>
        </div>
        <label className="search-field">
          <Search size={14} />
          <input
            aria-label="Search elements"
            placeholder="Find an element…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd>⌕</kbd>
        </label>
      </div>
      <div className="table-scroll">
        <div className="periodic-grid">
          {Array.from({ length: 18 }, (_, i) => (
            <span
              className="group-number"
              key={`group-${i}`}
              style={{ gridColumn: i + 1, gridRow: 1 }}
            >
              {i + 1}
            </span>
          ))}
          <div className="table-annotation">
            <span className="tiny-dot" />
            THE BUILDING BLOCKS OF EVERYTHING
          </div>
          <div className="series-placeholder" style={{ gridRow: 7, gridColumn: 3 }}>
            57–71<span>La–Lu</span>
          </div>
          <div className="series-placeholder" style={{ gridRow: 8, gridColumn: 3 }}>
            89–103<span>Ac–Lr</span>
          </div>
          <span className="series-label" style={{ gridRow: 10 }}>
            Lanthanides
          </span>
          <span className="series-label" style={{ gridRow: 11 }}>
            Actinides
          </span>
          {elements.map((el) => {
            const series = el.id >= 57 && el.id <= 71 ? 1 : el.id >= 89 && el.id <= 103 ? 2 : 0;
            const row = series ? 9 + series : el.period + 1;
            const col = series ? el.id - (series === 1 ? 54 : 86) : (el.group_number ?? 3);
            const selected = selectedElements.includes(el.id);
            return (
              <button
                key={el.id}
                className={`element-cell ${selected ? 'selected' : ''} ${!matches(el) ? 'dimmed' : ''}`}
                aria-label={`${el.name}, ${el.symbol}, atomic number ${el.id}`}
                aria-pressed={selected}
                title={`${el.name} · ${el.atomic_mass} g/mol · ${elementCategory(el)}`}
                onMouseEnter={() => setHovered(el)}
                onFocus={() => setHovered(el)}
                onClick={() => onElementSelect(el)}
                style={
                  {
                    gridRow: row,
                    gridColumn: col,
                    '--element-color': categoryColors[elementCategory(el)],
                  } as CSSProperties
                }
              >
                <span className="atomic-number">{el.id}</span>
                <strong>{el.symbol}</strong>
                <span className="atomic-mass">{el.atomic_mass.toFixed(2)}</span>
                {selected && <i />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="table-legend">
        {Object.entries(categoryColors).map(([name, color]) => (
          <button
            key={name}
            aria-pressed={category === name}
            onClick={() => setCategory(category === name ? null : name)}
            className={category && category !== name ? 'muted' : ''}
          >
            <i style={{ background: color }} />
            {name}
          </button>
        ))}
      </div>
      <div className="element-inspector" aria-live="polite">
        <Info size={13} />
        {hovered ? (
          <>
            <strong>{hovered.name}</strong>
            <span>{hovered.atomic_mass} g/mol</span>
            <span className="capitalize">{hovered.phase_at_stp} at STP</span>
            <span>{elementCategory(hovered)}</span>
          </>
        ) : (
          <span>Hover or focus an element to inspect its properties.</span>
        )}
        {(search || category) && (
          <button
            onClick={() => {
              setSearch('');
              setCategory(null);
            }}
          >
            {count} matches · Clear filter
          </button>
        )}
      </div>
    </section>
  );
}
