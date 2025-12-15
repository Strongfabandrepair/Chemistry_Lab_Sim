import { useState, useEffect, useRef } from 'react';
import { Activity, Zap, Radio, Scan } from 'lucide-react';
import { Molecule, Element } from '../lib/supabase';
import { spectroscopyEngine } from '../lib/spectroscopyEngine';

interface SpectroscopyViewerProps {
  molecule: Molecule | null;
  elements: Element[];
}

type SpectrumType = 'uv_vis' | 'ir' | 'nmr' | 'mass_spec';

export function SpectroscopyViewer({ molecule, elements }: SpectroscopyViewerProps) {
  const [selectedType, setSelectedType] = useState<SpectrumType>('ir');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!molecule || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let spectrum;
    switch (selectedType) {
      case 'uv_vis':
        spectrum = spectroscopyEngine.predictUVVisSpectrum(molecule, elements);
        break;
      case 'ir':
        spectrum = spectroscopyEngine.predictIRSpectrum(molecule, elements);
        break;
      case 'nmr':
        spectrum = spectroscopyEngine.predictNMRSpectrum(molecule, elements);
        break;
      case 'mass_spec':
        spectrum = spectroscopyEngine.predictMassSpectrum(molecule, elements);
        break;
    }

    drawSpectrum(ctx, canvas, spectrum);
  }, [molecule, elements, selectedType]);

  const drawSpectrum = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, spectrum: any) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, chartWidth, chartHeight);

    ctx.strokeStyle = '#333';
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth * i) / 10;
      const y = padding + (chartHeight * i) / 10;

      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    const data = spectroscopyEngine.generateSpectrumData(spectrum, 500);

    const xScale = chartWidth / (spectrum.range.max - spectrum.range.min);
    const yScale = chartHeight / Math.max(...data.y, 1);

    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < data.x.length; i++) {
      const x = padding + (data.x[i] - spectrum.range.min) * xScale;
      const y = padding + chartHeight - data.y[i] * yScale;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    for (const peak of spectrum.peaks) {
      const x = padding + (peak.position - spectrum.range.min) * xScale;
      const y = padding + chartHeight - peak.intensity * yScale;

      ctx.fillStyle = '#ff3366';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      if (peak.assignment) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(peak.assignment, x + 8, y - 8);
      }
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${spectrum.xAxis.label} (${spectrum.xAxis.unit})`, canvas.width / 2, canvas.height - 10);

    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${spectrum.yAxis.label} (${spectrum.yAxis.unit})`, 0, 0);
    ctx.restore();

    ctx.textAlign = 'left';
    for (let i = 0; i <= 5; i++) {
      const value = spectrum.range.min + ((spectrum.range.max - spectrum.range.min) * i) / 5;
      const x = padding + (chartWidth * i) / 5;
      ctx.fillText(value.toFixed(0), x - 15, canvas.height - padding + 20);
    }

    ctx.textAlign = 'right';
    const maxY = Math.max(...data.y, 1);
    for (let i = 0; i <= 5; i++) {
      const value = (maxY * i) / 5;
      const y = padding + chartHeight - (chartHeight * i) / 5;
      ctx.fillText(value.toFixed(1), padding - 10, y + 4);
    }
  };

  const spectrumTypes = [
    { id: 'uv_vis', name: 'UV-Vis', icon: Zap, description: 'Electronic transitions' },
    { id: 'ir', name: 'IR', icon: Radio, description: 'Vibrational modes' },
    { id: 'nmr', name: '¹H NMR', icon: Activity, description: 'Nuclear magnetic resonance' },
    { id: 'mass_spec', name: 'Mass Spec', icon: Scan, description: 'Mass-to-charge ratio' }
  ];

  return (
    <div className="bg-gray-900/50 backdrop-blur rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4">Advanced Spectroscopy</h2>

      {!molecule ? (
        <div className="text-center text-gray-400 py-12">
          <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Select a molecule to view spectroscopic data</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {spectrumTypes.map(({ id, name, icon: Icon, description }) => (
              <button
                key={id}
                onClick={() => setSelectedType(id as SpectrumType)}
                className={`p-4 rounded-lg border transition-all ${
                  selectedType === id
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-semibold">{name}</div>
                <div className="text-xs opacity-75 mt-1">{description}</div>
              </button>
            ))}
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <canvas
              ref={canvasRef}
              width={700}
              height={400}
              className="w-full"
            />
          </div>

          <div className="mt-4 p-4 bg-gray-800/30 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-400 mb-2">
              {selectedType.toUpperCase()} Analysis
            </h3>
            <div className="text-sm text-gray-300">
              <p className="mb-2">
                <span className="font-semibold">Molecule:</span> {molecule.name} ({molecule.formula})
              </p>
              <p className="mb-2">
                <span className="font-semibold">Functional Groups:</span>{' '}
                {molecule.functional_groups.join(', ') || 'None detected'}
              </p>
              {selectedType === 'ir' && (
                <p className="text-xs text-gray-400 mt-2">
                  IR spectroscopy reveals molecular vibrations. Look for characteristic peaks:
                  O-H (3200-3600), C=O (1650-1750), C-H (2800-3000) cm⁻¹
                </p>
              )}
              {selectedType === 'nmr' && (
                <p className="text-xs text-gray-400 mt-2">
                  ¹H NMR shows hydrogen environments. Chemical shift indicates functional groups.
                  Integration shows relative H count. Splitting reveals neighboring H atoms.
                </p>
              )}
              {selectedType === 'uv_vis' && (
                <p className="text-xs text-gray-400 mt-2">
                  UV-Vis measures electronic transitions. Conjugated systems and aromatic rings
                  absorb at longer wavelengths (200-400 nm).
                </p>
              )}
              {selectedType === 'mass_spec' && (
                <p className="text-xs text-gray-400 mt-2">
                  Mass spectrometry shows molecular weight and fragmentation pattern.
                  M+ peak indicates molecular ion. Fragments help identify structure.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}