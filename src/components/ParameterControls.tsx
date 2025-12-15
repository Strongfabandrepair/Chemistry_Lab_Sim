import { useState } from 'react';
import { Flame, Wind, Gauge, Beaker } from 'lucide-react';
import {
  temperatureUnits,
  pressureUnits,
  volumeUnits,
  TemperatureUnit,
  PressureUnit,
  VolumeUnit
} from '../lib/unitConversions';

interface ParameterControlsProps {
  temperature: number;
  pressure: number;
  volume: number;
  atmosphere: string;
  onTemperatureChange: (temp: number) => void;
  onPressureChange: (pressure: number) => void;
  onVolumeChange: (volume: number) => void;
  onAtmosphereChange: (atmosphere: string) => void;
}

export function ParameterControls({
  temperature,
  pressure,
  volume,
  atmosphere,
  onTemperatureChange,
  onPressureChange,
  onVolumeChange,
  onAtmosphereChange
}: ParameterControlsProps) {
  const [tempUnit, setTempUnit] = useState<TemperatureUnit>('K');
  const [pressureUnit, setPressureUnit] = useState<PressureUnit>('atm');
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>('L');

  const atmosphereOptions = ['air', 'nitrogen', 'oxygen', 'argon', 'vacuum', 'CO2'];

  const displayTemp = temperatureUnits[tempUnit].fromKelvin(temperature);
  const displayPressure = pressureUnits[pressureUnit].fromAtm(pressure);
  const displayVolume = volumeUnits[volumeUnit].fromL(volume);

  const handleTempChange = (value: number) => {
    const kelvin = temperatureUnits[tempUnit].toKelvin(value);
    onTemperatureChange(kelvin);
  };

  const handlePressureChange = (value: number) => {
    const atm = pressureUnits[pressureUnit].toAtm(value);
    onPressureChange(atm);
  };

  const handleVolumeChange = (value: number) => {
    const liters = volumeUnits[volumeUnit].toL(value);
    onVolumeChange(liters);
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur rounded-lg p-6 space-y-6 border border-gray-700">
      <h3 className="text-xl font-bold text-white mb-4">Environmental Parameters</h3>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Flame className="w-4 h-4 text-orange-400" />
              Temperature
            </label>
            <div className="flex items-center gap-2">
              <span className="text-white font-mono">{displayTemp.toFixed(1)}</span>
              <select
                value={tempUnit}
                onChange={(e) => setTempUnit(e.target.value as TemperatureUnit)}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-0.5 text-white text-xs"
              >
                {Object.entries(temperatureUnits).map(([key, { name }]) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>
          </div>
          <input
            type="number"
            step="0.1"
            value={displayTemp.toFixed(1)}
            onChange={(e) => handleTempChange(parseFloat(e.target.value))}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white mb-2"
          />
          <input
            type="range"
            min={temperatureUnits[tempUnit].fromKelvin(0)}
            max={temperatureUnits[tempUnit].fromKelvin(5000)}
            step="0.1"
            value={displayTemp}
            onChange={(e) => handleTempChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{temperatureUnits[tempUnit].fromKelvin(0).toFixed(0)} {tempUnit}</span>
            <span>5000 K</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Gauge className="w-4 h-4 text-blue-400" />
              Pressure
            </label>
            <div className="flex items-center gap-2">
              <span className="text-white font-mono">{displayPressure.toFixed(2)}</span>
              <select
                value={pressureUnit}
                onChange={(e) => setPressureUnit(e.target.value as PressureUnit)}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-0.5 text-white text-xs"
              >
                {Object.entries(pressureUnits).map(([key]) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>
          </div>
          <input
            type="number"
            step="0.01"
            value={displayPressure.toFixed(2)}
            onChange={(e) => handlePressureChange(parseFloat(e.target.value))}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white mb-2"
          />
          <input
            type="range"
            min={pressureUnits[pressureUnit].fromAtm(0.001)}
            max={pressureUnits[pressureUnit].fromAtm(100)}
            step="0.01"
            value={displayPressure}
            onChange={(e) => handlePressureChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Beaker className="w-4 h-4 text-green-400" />
              Volume
            </label>
            <div className="flex items-center gap-2">
              <span className="text-white font-mono">{displayVolume.toFixed(2)}</span>
              <select
                value={volumeUnit}
                onChange={(e) => setVolumeUnit(e.target.value as VolumeUnit)}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-0.5 text-white text-xs"
              >
                {Object.entries(volumeUnits).map(([key]) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>
          </div>
          <input
            type="number"
            step="0.01"
            value={displayVolume.toFixed(2)}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white mb-2"
          />
          <input
            type="range"
            min={volumeUnits[volumeUnit].fromL(0.1)}
            max={volumeUnits[volumeUnit].fromL(100)}
            step="0.01"
            value={displayVolume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <Wind className="w-4 h-4 text-purple-400" />
            Atmosphere
          </label>
          <select
            value={atmosphere}
            onChange={(e) => onAtmosphereChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {atmosphereOptions.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Standard Temperature:</span>
            <span className="text-white">298.15 K (25°C)</span>
          </div>
          <div className="flex justify-between">
            <span>Standard Pressure:</span>
            <span className="text-white">1.000 atm (101.325 kPa)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
