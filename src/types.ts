// Canonical units from the spec
export const CANONICAL_UNITS: Record<string, string> = {
  temperature: "degree Celsius",
  humidity: "%",
  vpd: "kPa",
  precipitation: "mm/day",
  et: "mm/day",
  wind_speed: "m/s",
  radiation: "MJ/m2/day",
  pressure: "hPa",
  soil_moisture: "mm",
  flow: "m3/s",
  volume: "m3",
  mass: "kg",
  height: "m",
  duration: "s",
  density: "kg/m3",
};

export type EvidenceClass = "measured" | "estimated" | "comparison" | "unavailable";

export interface EnvironmentalRecord {
  id: string;
  quantityName: string;
  value: string; // number as string or "unavailable"
  unit: string;
  startTime: string;
  endTime: string;
  timezone: string;
  spatialSupport: string;
  method: string;
  qualityFlags: string;
  createdAt: string;
}

export interface RatioResult {
  value: string | number;
  unit: string;
  class: EvidenceClass;
  reason?: string;
}

export interface WaterBalanceResult {
  residual: string | number;
  status: string;
  class: EvidenceClass;
  details?: string;
}

export interface DebrisInput {
  volume: string;
  volumeUnit: string;
  type: string;
  density: string;
  densityUnit: string;
  estimatedMass: string;
  measuredMass: string;
  massUnit: string;
}

export interface DebrisResult {
  estimatedMass: string | number;
  measuredMass: string | number;
  discrepancy: string | number;
  status: string;
  class: EvidenceClass;
}

export interface WindInput {
  surfaceWind: string;
  windUnit: string;
  height: string;
  gustDuration: string;
  atmosphericContext: string;
  damageObservation: string;
}

export interface WindResult {
  adjustedWind: string | number;
  classification: string;
  consistencyWithDamage: string;
  status: string;
  class: EvidenceClass;
}
