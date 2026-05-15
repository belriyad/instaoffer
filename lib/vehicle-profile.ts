const VEHICLE_PROFILE_STORAGE_KEY = 'instaoffer_vehicle_profile';

export interface SharedVehicleProfile {
  make: string;
  class_name: string;
  model: string;
  trim: string;
  year: number | null;
  km: number | null;
  condition: string;
  city: string;
}

function parseNum(value: unknown): number | null {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function normalizeProfile(raw: Partial<SharedVehicleProfile>): SharedVehicleProfile {
  return {
    make: typeof raw.make === 'string' ? raw.make : '',
    class_name: typeof raw.class_name === 'string' ? raw.class_name : '',
    model: typeof raw.model === 'string' ? raw.model : '',
    trim: typeof raw.trim === 'string' ? raw.trim : '',
    year: parseNum(raw.year),
    km: parseNum(raw.km),
    condition: typeof raw.condition === 'string' ? raw.condition : '',
    city: typeof raw.city === 'string' ? raw.city : '',
  };
}

export function readVehicleProfile(): SharedVehicleProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(VEHICLE_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = normalizeProfile(JSON.parse(raw) ?? {});
    if (!parsed.make && !parsed.class_name && !parsed.year && !parsed.km) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeVehicleProfile(next: Partial<SharedVehicleProfile>): void {
  if (typeof window === 'undefined') return;
  try {
    const merged = normalizeProfile({ ...(readVehicleProfile() ?? {}), ...next });
    if (!merged.make && !merged.class_name && !merged.year && !merged.km) return;
    sessionStorage.setItem(VEHICLE_PROFILE_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore storage write failures
  }
}
