import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  MousePointer2,
  Box,
  Tag,
} from 'lucide-react';
import { VisualizationEngine, atomColors } from '../lib/visualizationEngine';
import type { Element } from '../lib/supabase';
import type { ReactionResult } from '../lib/chemistryEngine';

export function VisualizationCanvas({
  components,
  result,
  temperature,
  active,
}: {
  active: boolean;
  components: Array<{ element: Element; moles: number }>;
  result: ReactionResult | null;
  temperature: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const engine = useMemo(() => new VisualizationEngine(), []);
  const [paused, setPaused] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [labels, setLabels] = useState(true);
  const [mode, setMode] = useState<'ball-stick' | 'space-fill'>('ball-stick');
  const [expanded, setExpanded] = useState(false);
  const drag = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!canvas.current || !container.current) return;
    engine.initialize(canvas.current);
    const resize = new ResizeObserver(([entry]) =>
      engine.resize(entry.contentRect.width, entry.contentRect.height),
    );
    resize.observe(container.current);
    engine.startAnimation();
    return () => {
      resize.disconnect();
      engine.stopAnimation();
    };
  }, [engine]);
  useEffect(() => {
    if (active) engine.startAnimation();
    else engine.stopAnimation();
  }, [active, engine]);
  useEffect(() => {
    engine.setScene(components, result);
  }, [components, result, engine]);
  useEffect(() => {
    engine.setOptions({ paused, labels, mode });
  }, [paused, labels, mode, engine]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  return (
    <section className={`panel visualization-panel ${expanded ? 'expanded' : ''}`}>
      <div className="panel-heading">
        <div>
          <h2>
            <Box size={16} /> Molecular viewport{' '}
            <span className="live-label">
              <i />
              {paused ? 'PAUSED' : 'LIVE'}
            </span>
          </h2>
          <p>
            {result?.status === 'reacted'
              ? 'Product geometry · representative structures'
              : 'Reactant geometry · representative particles'}
          </p>
        </div>
        <div className="viewport-heading-actions">
          <select
            aria-label="Molecular display style"
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
          >
            <option value="ball-stick">Ball & stick</option>
            <option value="space-fill">Space filling</option>
          </select>
          <button
            className="icon-button"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Collapse viewport' : 'Expand viewport'}
          >
            {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
      <div className="molecular-stage" ref={container}>
        <canvas
          ref={canvas}
          tabIndex={0}
          aria-label="Interactive molecular illustration. Drag or use arrow keys to rotate, plus and minus to zoom."
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, y: e.clientY };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (drag.current) {
              engine.rotate(e.clientX - drag.current.x, e.clientY - drag.current.y);
              drag.current = { x: e.clientX, y: e.clientY };
            }
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onKeyDown={(e) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-', '='].includes(e.key))
              e.preventDefault();
            if (e.key === 'ArrowLeft') engine.rotate(-12, 0);
            if (e.key === 'ArrowRight') engine.rotate(12, 0);
            if (e.key === 'ArrowUp') engine.rotate(0, -12);
            if (e.key === 'ArrowDown') engine.rotate(0, 12);
            if (e.key === '+' || e.key === '=') engine.changeZoom(0.1);
            if (e.key === '-') engine.changeZoom(-0.1);
          }}
        />
        <div className="viewport-readout">
          <span>
            <i />
            {result?.status === 'reacted' ? 'PRODUCT VIEW' : 'MIXTURE PREVIEW'}
          </span>
          <strong>
            {temperature.toFixed(2)} <small>K</small>
          </strong>
          <p>Isothermal environment</p>
        </div>
        {!components.length && (
          <div className="viewport-empty">
            <Box size={30} />
            <strong>Your next discovery starts here</strong>
            <span>Select elements above to populate the viewport.</span>
          </div>
        )}
        <div className="axis-indicator">
          <span>y</span>
          <i />
          <b>x</b>
          <em>z</em>
        </div>
        <div className="viewport-tools">
          <button
            className="icon-button"
            title={paused ? 'Resume animation' : 'Pause animation'}
            aria-label={paused ? 'Resume animation' : 'Pause animation'}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
          <span />
          <button
            className="icon-button"
            aria-label="Zoom in"
            onClick={() => engine.changeZoom(0.1)}
          >
            <ZoomIn size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Zoom out"
            onClick={() => engine.changeZoom(-0.1)}
          >
            <ZoomOut size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Reset camera"
            onClick={() => engine.resetView()}
          >
            <RotateCcw size={15} />
          </button>
          <span />
          <button
            className={`icon-button ${labels ? 'enabled' : ''}`}
            aria-label="Toggle atom labels"
            aria-pressed={labels}
            onClick={() => setLabels(!labels)}
          >
            <Tag size={15} />
          </button>
        </div>
        <div className="viewport-hint">
          <MousePointer2 size={12} /> Drag to orbit <span>·</span> ± to zoom
        </div>
      </div>
      <div className="viewport-footer">
        <div>
          {components.map((c) => (
            <span key={c.element.id}>
              <i style={{ background: atomColors[c.element.symbol] ?? '#92b4c0' }} />
              {c.element.name}
            </span>
          ))}
        </div>
        <span>
          Illustrative geometry <span className="subtle-separator">/</span> Not to scale
        </span>
      </div>
    </section>
  );
}
