import { useEffect, useRef, useState } from 'react';
import { Thermometer, Gauge, Beaker, Wind, SlidersHorizontal, RotateCcw } from 'lucide-react';
import {
  temperatureUnits,
  pressureUnits,
  volumeUnits,
  type TemperatureUnit,
  type PressureUnit,
  type VolumeUnit,
} from '../lib/unitConversions';

export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 'any',
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number | 'any';
  label: string;
}) {
  const [draft, setDraft] = useState(String(Number(value.toFixed(5))));
  const [invalid, setInvalid] = useState(false);
  const cancelled = useRef(false);
  useEffect(() => {
    setDraft(String(Number(value.toFixed(5))));
    setInvalid(false);
  }, [value]);
  const commit = () => {
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    const parsed = Number(draft);
    if (!draft.trim() || !Number.isFinite(parsed) || parsed < min || parsed > max) {
      setDraft(String(Number(value.toFixed(5))));
      setInvalid(false);
      return;
    }
    onChange(parsed);
    setInvalid(false);
  };
  return (
    <input
      type="number"
      aria-label={label}
      aria-invalid={invalid}
      min={min}
      max={max}
      step={step}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = Number(e.target.value);
        setInvalid(!e.target.value || !Number.isFinite(n) || n < min || n > max);
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          cancelled.current = true;
          setDraft(String(value));
          setInvalid(false);
          e.currentTarget.blur();
        }
      }}
    />
  );
}
interface ParameterControlsProps {
  temperature: number;
  pressure: number;
  volume: number;
  atmosphere: string;
  onTemperatureChange: (value: number) => void;
  onPressureChange: (value: number) => void;
  onVolumeChange: (value: number) => void;
  onAtmosphereChange: (value: string) => void;
}
export function ParameterControls(props: ParameterControlsProps) {
  const [tempUnit, setTempUnit] = useState<TemperatureUnit>('K');
  const [pressureUnit, setPressureUnit] = useState<PressureUnit>('atm');
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>('L');
  const temp = temperatureUnits[tempUnit];
  const pressure = pressureUnits[pressureUnit];
  const volume = volumeUnits[volumeUnit];
  return (
    <section className="conditions-section">
      <div className="section-heading">
        <h3>
          <SlidersHorizontal size={15} /> Environment
        </h3>
        <button
          className="icon-button"
          aria-label="Reset environment"
          onClick={() => {
            props.onTemperatureChange(298.15);
            props.onPressureChange(1);
            props.onVolumeChange(1);
            props.onAtmosphereChange('air');
          }}
        >
          <RotateCcw size={13} />
        </button>
      </div>
      <div className="parameter">
        <label htmlFor="temperature-range">
          <Thermometer size={14} />
          Temperature
        </label>
        <div className="parameter-value">
          <NumberField
            label="Temperature"
            min={temp.fromKelvin(1)}
            max={temp.fromKelvin(5000)}
            value={temp.fromKelvin(props.temperature)}
            onChange={(v) => props.onTemperatureChange(temp.toKelvin(v))}
          />
          <select
            aria-label="Temperature unit"
            value={tempUnit}
            onChange={(e) => setTempUnit(e.target.value as TemperatureUnit)}
          >
            {Object.keys(temperatureUnits).map((key) => (
              <option key={key}>{key}</option>
            ))}
          </select>
        </div>
        <input
          id="temperature-range"
          type="range"
          min="1"
          max="5000"
          step="0.01"
          value={props.temperature}
          onChange={(e) => props.onTemperatureChange(Number(e.target.value))}
        />
        <div className="range-labels">
          <span>1 K</span>
          <span>5,000 K</span>
        </div>
      </div>
      <div className="parameter">
        <label htmlFor="pressure-range">
          <Gauge size={14} />
          Pressure
        </label>
        <div className="parameter-value">
          <NumberField
            label="Pressure"
            min={pressure.fromAtm(0.001)}
            max={pressure.fromAtm(500)}
            value={pressure.fromAtm(props.pressure)}
            onChange={(v) => props.onPressureChange(pressure.toAtm(v))}
          />
          <select
            aria-label="Pressure unit"
            value={pressureUnit}
            onChange={(e) => setPressureUnit(e.target.value as PressureUnit)}
          >
            {Object.keys(pressureUnits).map((key) => (
              <option key={key}>{key}</option>
            ))}
          </select>
        </div>
        <input
          id="pressure-range"
          type="range"
          min="0.001"
          max="500"
          step="0.001"
          value={props.pressure}
          onChange={(e) => props.onPressureChange(Number(e.target.value))}
        />
        <div className="range-labels">
          <span>0.001 atm</span>
          <span>500 atm</span>
        </div>
      </div>
      <div className="parameter">
        <label htmlFor="volume-range">
          <Beaker size={14} />
          Volume
        </label>
        <div className="parameter-value">
          <NumberField
            label="Volume"
            min={volume.fromL(0.01)}
            max={volume.fromL(100)}
            value={volume.fromL(props.volume)}
            onChange={(v) => props.onVolumeChange(volume.toL(v))}
          />
          <select
            aria-label="Volume unit"
            value={volumeUnit}
            onChange={(e) => setVolumeUnit(e.target.value as VolumeUnit)}
          >
            {Object.keys(volumeUnits).map((key) => (
              <option key={key}>{key}</option>
            ))}
          </select>
        </div>
        <input
          id="volume-range"
          type="range"
          min="0.01"
          max="100"
          step="0.01"
          value={props.volume}
          onChange={(e) => props.onVolumeChange(Number(e.target.value))}
        />
        <div className="range-labels">
          <span>0.01 L</span>
          <span>100 L</span>
        </div>
      </div>
      <div className="atmosphere-field">
        <label htmlFor="atmosphere">
          <Wind size={14} />
          Atmosphere
        </label>
        <select
          id="atmosphere"
          value={props.atmosphere}
          onChange={(e) => props.onAtmosphereChange(e.target.value)}
        >
          {['air', 'nitrogen', 'oxygen', 'argon', 'vacuum', 'CO2'].map((a) => (
            <option key={a} value={a}>
              {a === 'air' ? 'Ambient air' : a.charAt(0).toUpperCase() + a.slice(1)}
            </option>
          ))}
        </select>
        <small>Metadata only · atmospheric reactions not modeled</small>
      </div>
    </section>
  );
}
