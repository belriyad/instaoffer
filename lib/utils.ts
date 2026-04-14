export function formatQAR(amount: number): string {
  return `QAR ${amount.toLocaleString('en-QA')}`;
}

export function formatKM(km: number): string {
  return `${km.toLocaleString('en-QA')} km`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-QA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export const CAR_MAKES = [
  'Toyota', 'Lexus', 'Nissan', 'Infiniti', 'Honda', 'Mitsubishi',
  'Hyundai', 'Kia', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen',
  'Ford', 'Chevrolet', 'Dodge', 'GMC', 'Jeep', 'Land Rover',
  'Range Rover', 'Porsche', 'Maserati', 'Ferrari', 'Lamborghini',
  'Bentley', 'Rolls-Royce', 'Peugeot', 'Renault', 'Volvo',
  'Jaguar', 'MINI', 'Mazda', 'Subaru', 'Suzuki', 'Daihatsu',
  'Isuzu', 'Cadillac', 'Buick', 'Lincoln', 'Acura', 'Genesis',
];

export const CAR_MODELS: Record<string, string[]> = {
  Toyota: ['Camry', 'Corolla', 'Land Cruiser', 'Prado', 'Hilux', 'Fortuner', 'RAV4', 'Yaris', 'Avalon', 'Sequoia', 'Tundra', 'FJ Cruiser'],
  Lexus: ['LX', 'GX', 'RX', 'NX', 'ES', 'IS', 'LS', 'UX', 'LC'],
  Nissan: ['Patrol', 'X-Trail', 'Altima', 'Pathfinder', 'Sunny', 'Maxima', 'Armada', 'Frontier', 'Murano', 'Juke', 'Kicks'],
  Infiniti: ['QX80', 'QX60', 'QX50', 'Q50', 'Q60', 'QX30'],
  Honda: ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'HR-V', 'Ridgeline'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLE', 'GLC', 'GLS', 'G-Class', 'A-Class', 'CLA', 'AMG GT'],
  BMW: ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X6', 'X7', 'M3', 'M5'],
  Hyundai: ['Sonata', 'Tucson', 'Santa Fe', 'Elantra', 'Palisade', 'Kona'],
  Kia: ['Sportage', 'Sorento', 'Carnival', 'Telluride', 'K5', 'EV6'],
  Ford: ['F-150', 'Explorer', 'Edge', 'Escape', 'Mustang', 'Expedition', 'Ranger'],
  Chevrolet: ['Tahoe', 'Suburban', 'Silverado', 'Camaro', 'Malibu', 'Traverse', 'Equinox'],
  Dodge: ['RAM 1500', 'RAM 2500', 'Charger', 'Challenger', 'Durango'],
  GMC: ['Yukon', 'Sierra', 'Acadia', 'Terrain', 'Canyon'],
  Jeep: ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Renegade', 'Gladiator'],
};

export const YEARS = Array.from({ length: 26 }, (_, i) => 2025 - i);

export const CONDITIONS = [
  { value: 'excellent', label: 'Excellent', description: 'Like new, no issues' },
  { value: 'good', label: 'Good', description: 'Minor wear, well maintained' },
  { value: 'fair', label: 'Fair', description: 'Some wear, needs minor repairs' },
  { value: 'poor', label: 'Poor', description: 'Significant issues or damage' },
];

export const QATAR_CITIES = [
  'Doha', 'Al Wakrah', 'Al Rayyan', 'Lusail', 'Al Khor', 'Al Shamal',
  'Al Daayen', 'Umm Slal', 'Madinat ash Shamal', 'Dukhan',
];

export const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
export const GEAR_TYPES = ['Automatic', 'Manual'];
export const CAR_TYPES = ['Sedan', 'SUV', 'Pickup', 'Hatchback', 'Coupe', 'Van', 'Convertible', 'Wagon'];
export const WARRANTY_STATUSES = ['Under Warranty', 'No Warranty', 'Extended Warranty'];
