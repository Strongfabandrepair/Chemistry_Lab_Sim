import { useState, useRef, useEffect } from 'react';
import { Beaker, Droplet, TrendingUp } from 'lucide-react';
import { Molecule } from '../lib/supabase';
import { pHEngine } from '../lib/pHEngine';

interface pHSimulatorProps {
  molecules: Molecule[];
}

export function pHSimulator({ molecules }: pHSimulatorProps) {
  const [acidConcentration, setAcidConcentration] = useState(0.1);
  const [baseConcentration, setBaseConcentration] = useState(0.1);
  const [addedBase, setAddedBase] = useState(0);
  const [selectedAcid, setSelectedAcid] = useState<Molecule | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const acids = molecules.filter(m =>
    m.functional_groups.includes('carboxylic_acid') || m.name.includes('Acid')
  );

  useEffect(() => {
    if (acids.length > 0 && !selectedAcid) {
      setSelectedAcid(acids[0]);
    }
  }, [acids, selectedAcid]);

  useEffect(() => {
    if (!canvasRef.current || !selectedAcid) return;

    const pKa = pHEngine.predictpKa(selectedAcid) || 4.76;
    const titrationData = pHEngine.simulateTitration(
      acidConcentration,
      50,
      baseConcentration,
      100,
      pKa,
      100
    );

    drawTitrationCurve(canvasRef.current, titrationData);
  }, [acidConcentration, baseConcentration, selectedAcid, addedBase]);

  const drawTitrationCurve = (canvas: HTMLCanvasElement, data: any[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 50;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, chartWidth, chartHeight);

    ctx.strokeStyle = '#1e293b';
    for (let i = 0; i <= 14; i++) {
      const y = padding + (chartHeight * (14 - i)) / 14;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();

      if (i === 7) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#1e293b';
      }
    }

    const maxVolume = Math.max(...data.map(p => p.volumeAdded));
    const xScale = chartWidth / maxVolume;
    const yScale = chartHeight / 14;

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const x = padding + data[i].volumeAdded * xScale;
      const y = padding + (14 - data[i].pH) * yScale;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    for (const point of data) {
      if (point.isEquivalencePoint) {
        const x = padding + point.volumeAdded * xScale;
        const y = padding + (14 - point.pH) * yScale;

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + chartHeight);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText('Equivalence Point', x + 10, y - 10);
      }
    }

    const currentVolumeIndex = Math.floor((addedBase / 100) * data.length);
    if (currentVolumeIndex < data.length) {
      const currentPoint = data[currentVolumeIndex];
      const x = padding + currentPoint.volumeAdded * xScale;
      const y = padding + (14 - currentPoint.pH) * yScale;

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Base Volume Added (mL)', canvas.width / 2, canvas.height - 10);

    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('pH', 0, 0);
    ctx.restore();

    ctx.textAlign = 'left';
    ctx.font = '11px monospace';
    for (let i = 0; i <= 5; i++) {
      const value = (maxVolume * i) / 5;
      const x = padding + (chartWidth * i) / 5;
      ctx.fillText(value.toFixed(1), x - 10, canvas.height - padding + 20);
    }

    ctx.textAlign = 'right';
    for (let i = 0; i <= 14; i += 2) {
      const y = padding + (chartHeight * (14 - i)) / 14;
      ctx.fillText(i.toString(), padding - 10, y + 4);
    }

    const currentpH = data[currentVolumeIndex]?.pH || 7;
    ctx.fillStyle = currentpH < 7 ? '#ef4444' : currentpH > 7 ? '#3b82f6' : '#22c55e';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Current pH: ${currentpH.toFixed(2)}`, padding + 10, padding + 25);
  };

  const currentpH = (() => {
    if (!selectedAcid) return 7;
    const pKa = pHEngine.predictpKa(selectedAcid) || 4.76;
    const titrationData = pHEngine.simulateTitration(
      acidConcentration,
      50,
      baseConcentration,
      100,
      pKa,
      100
    );
    const index = Math.floor((addedBase / 100) * titrationData.length);
    return titrationData[index]?.pH || 7;
  })();

  const getpHColor = (pH: number): string => {
    if (pH < 3) return 'bg-red-600';
    if (pH < 5) return 'bg-orange-500';
    if (pH < 6) return 'bg-yellow-500';
    if (pH < 8) return 'bg-green-500';
    if (pH < 10) return 'bg-blue-500';
    if (pH < 12) return 'bg-indigo-500';
    return 'bg-purple-600';
  };

  const getpHLabel = (pH: number): string => {
    if (pH < 7) return 'Acidic';
    if (pH > 7) return 'Basic';
    return 'Neutral';
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur rounded-lg p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <Beaker className="w-7 h-7 text-blue-400" />
        <div>
          <h2 className="text-xl font-bold">pH & Acid-Base Chemistry</h2>
          <p className="text-sm text-gray-400">Interactive titration simulator</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-2 block">
              Select Acid
            </label>
            <select
              value={selectedAcid?.id || ''}
              onChange={(e) => {
                const acid = acids.find(a => a.id === e.target.value);
                setSelectedAcid(acid || null);
              }}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
            >
              {acids.map(acid => (
                <option key={acid.id} value={acid.id}>
                  {acid.name} ({acid.formula})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <Droplet className="w-4 h-4" />
              Acid Concentration: {acidConcentration.toFixed(3)} M
            </label>
            <input
              type="range"
              min="0.01"
              max="1.0"
              step="0.01"
              value={acidConcentration}
              onChange={(e) => setAcidConcentration(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <Droplet className="w-4 h-4" />
              Base Concentration: {baseConcentration.toFixed(3)} M
            </label>
            <input
              type="range"
              min="0.01"
              max="1.0"
              step="0.01"
              value={baseConcentration}
              onChange={(e) => setBaseConcentration(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Base Added: {addedBase.toFixed(1)} mL
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={addedBase}
              onChange={(e) => setAddedBase(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="p-6 bg-gray-800/50 rounded-lg border-2 border-gray-700">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">Current pH</div>
              <div className={`text-5xl font-bold mb-3 ${
                currentpH < 7 ? 'text-red-400' : currentpH > 7 ? 'text-blue-400' : 'text-green-400'
              }`}>
                {currentpH.toFixed(2)}
              </div>
              <div className="mb-3">
                <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${getpHColor(currentpH)} text-white`}>
                  {getpHLabel(currentpH)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-gray-700/50 p-2 rounded">
                  <div className="text-gray-400">H₃O⁺</div>
                  <div className="font-mono">{Math.pow(10, -currentpH).toExponential(2)} M</div>
                </div>
                <div className="bg-gray-700/50 p-2 rounded">
                  <div className="text-gray-400">OH⁻</div>
                  <div className="font-mono">{Math.pow(10, -(14 - currentpH)).toExponential(2)} M</div>
                </div>
                <div className="bg-gray-700/50 p-2 rounded">
                  <div className="text-gray-400">pKa</div>
                  <div className="font-mono">{selectedAcid ? (pHEngine.predictpKa(selectedAcid) || 4.76).toFixed(2) : 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Titration Curve</h3>
          <canvas
            ref={canvasRef}
            width={500}
            height={400}
            className="w-full bg-gray-800/30 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}