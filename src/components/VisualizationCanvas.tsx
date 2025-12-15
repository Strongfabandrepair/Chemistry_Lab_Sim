import { useEffect, useRef } from 'react';
import { VisualizationEngine } from '../lib/visualizationEngine';

interface VisualizationCanvasProps {
  engine: VisualizationEngine;
  width?: number;
  height?: number;
}

export function VisualizationCanvas({ engine, width = 800, height = 600 }: VisualizationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const actualWidth = containerRef.current.clientWidth || width;
    const actualHeight = height;

    canvasRef.current.width = actualWidth;
    canvasRef.current.height = actualHeight;

    const initialized = engine.initialize(canvasRef.current);

    if (initialized) {
      console.log('Visualization engine initialized successfully');
      engine.startAnimation();
    } else {
      console.error('Failed to initialize visualization engine');
    }

    return () => {
      engine.stopAnimation();
    };
  }, [engine, width, height]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || engine.getState().particles.length === 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    engine.agitate(x, y, 1.5);
  };

  return (
    <div ref={containerRef} className="relative rounded-lg overflow-hidden shadow-2xl border border-gray-700">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full bg-gray-950 cursor-pointer hover:bg-gray-900 transition-colors"
        style={{ display: 'block', height: `${height}px` }}
        title="Click to agitate and mix the molecules"
      />

      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-xs">
        <div className="text-gray-400">3D Molecular View</div>
        <div className="text-white text-lg font-bold">
          {engine.getState().temperature.toFixed(1)} K
        </div>
        <div className="text-gray-400">
          Phase: <span className="text-white capitalize">{engine.getState().phase}</span>
        </div>
        <div className="text-blue-300 mt-1">
          {engine.getState().particles.length} particles
        </div>
      </div>

      {engine.getState().particles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-500">
            <div className="text-sm">Select elements from the periodic table</div>
            <div className="text-xs mt-1">to visualize molecular interactions</div>
          </div>
        </div>
      )}

      {engine.getState().particles.length > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-center pointer-events-none animate-pulse">
          <div className="text-blue-300">Click anywhere to agitate and mix</div>
        </div>
      )}
    </div>
  );
}
