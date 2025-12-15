export const temperatureUnits = {
  K: { name: 'Kelvin', toKelvin: (v: number) => v, fromKelvin: (v: number) => v },
  C: { name: 'Celsius', toKelvin: (v: number) => v + 273.15, fromKelvin: (v: number) => v - 273.15 },
  F: { name: 'Fahrenheit', toKelvin: (v: number) => (v - 32) * 5/9 + 273.15, fromKelvin: (v: number) => (v - 273.15) * 9/5 + 32 }
};

export const pressureUnits = {
  atm: { name: 'Atmospheres', toAtm: (v: number) => v, fromAtm: (v: number) => v },
  Pa: { name: 'Pascals', toAtm: (v: number) => v / 101325, fromAtm: (v: number) => v * 101325 },
  kPa: { name: 'Kilopascals', toAtm: (v: number) => v / 101.325, fromAtm: (v: number) => v * 101.325 },
  bar: { name: 'Bar', toAtm: (v: number) => v / 1.01325, fromAtm: (v: number) => v * 1.01325 },
  psi: { name: 'PSI', toAtm: (v: number) => v / 14.696, fromAtm: (v: number) => v * 14.696 },
  mmHg: { name: 'mmHg (Torr)', toAtm: (v: number) => v / 760, fromAtm: (v: number) => v * 760 }
};

export const volumeUnits = {
  L: { name: 'Liters', toL: (v: number) => v, fromL: (v: number) => v },
  mL: { name: 'Milliliters', toL: (v: number) => v / 1000, fromL: (v: number) => v * 1000 },
  m3: { name: 'Cubic Meters', toL: (v: number) => v * 1000, fromL: (v: number) => v / 1000 },
  cm3: { name: 'Cubic Centimeters', toL: (v: number) => v / 1000, fromL: (v: number) => v * 1000 },
  gal: { name: 'Gallons (US)', toL: (v: number) => v * 3.78541, fromL: (v: number) => v / 3.78541 }
};

export type TemperatureUnit = keyof typeof temperatureUnits;
export type PressureUnit = keyof typeof pressureUnits;
export type VolumeUnit = keyof typeof volumeUnits;
