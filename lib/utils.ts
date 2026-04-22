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

// Common trims per model — improves ML estimate accuracy
export const CAR_TRIMS: Record<string, string[]> = {
  // Toyota
  'Land Cruiser': ['VXS', 'VXR', 'GXR', 'EX', 'EXR', 'GT', 'Base'],
  'Prado':        ['VXL', 'TXL', 'TX', 'GXL', 'GXR'],
  'Fortuner':     ['EXR', 'GXR', 'SR5', 'EX', 'Base'],
  'Camry':        ['XSE', 'XLE', 'SE', 'LE', 'XSE V6', 'XLE V6'],
  'Hilux':        ['SR5', 'GLX', 'GR-S', 'Adventure', 'Base'],
  'RAV4':         ['XLE', 'XSE', 'Adventure', 'TRD Off-Road', 'Limited'],
  'Corolla':      ['XSE', 'SE', 'LE', 'XLE', 'Hybrid'],
  'Yaris':        ['SE', 'LE', 'XLE', 'Sport'],
  'Avalon':       ['XSE', 'XLE', 'Limited', 'Touring'],
  'Sequoia':      ['SR5', 'TRD Pro', 'Limited', 'Platinum', 'Capstone'],
  // Lexus
  'LX':           ['LX 570', 'LX 600', 'LX 450d', 'Sport', 'Black Edition'],
  'GX':           ['GX 460', 'GX 550', 'Premium', 'Luxury', 'Overtrail'],
  'RX':           ['RX 300', 'RX 350', 'RX 400h', 'RX 500h', 'F Sport'],
  'ES':           ['ES 250', 'ES 300h', 'ES 350', 'F Sport', 'Luxury'],
  'IS':           ['IS 250', 'IS 300', 'IS 350', 'F Sport'],
  // Nissan
  'Patrol':       ['SE', 'LE', 'LE Platinum', 'Nismo', 'Ti', 'Base'],
  'X-Trail':      ['SE', 'LE', 'SL', 'Platinum', 'Base'],
  'Altima':       ['S', 'SV', 'SL', 'SR', 'Platinum'],
  'Pathfinder':   ['S', 'SV', 'SL', 'Rock Creek', 'Platinum'],
  // BMW
  '3 Series':     ['320i', '330i', '340i', 'M Sport', 'M3', 'Touring'],
  '5 Series':     ['520i', '530i', '540i', 'M550i', 'M5', 'M Sport'],
  '7 Series':     ['730i', '740i', '750i', 'M760i', 'Alpina B7'],
  'X5':           ['xDrive40i', 'xDrive50i', 'M50i', 'M Sport', 'X5 M'],
  'X6':           ['xDrive40i', 'xDrive50i', 'M50i', 'X6 M'],
  'X7':           ['xDrive40i', 'xDrive50i', 'M50i', 'Alpina XB7'],
  // Mercedes-Benz
  'G-Class':      ['G 500', 'G 550', 'AMG G 63', 'AMG G 65', 'AMG Line'],
  'GLS':          ['GLS 450', 'GLS 600', 'AMG GLS 63', 'Maybach GLS 600'],
  'GLE':          ['GLE 350', 'GLE 450', 'GLE 53 AMG', 'AMG GLE 63', 'Coupe'],
  'GLC':          ['GLC 200', 'GLC 300', 'AMG GLC 43', 'AMG GLC 63', 'Coupe'],
  'S-Class':      ['S 450', 'S 500', 'S 580', 'AMG S 63', 'Maybach S 580'],
  'E-Class':      ['E 200', 'E 250', 'E 300', 'E 350', 'AMG E 53', 'AMG Line'],
  'C-Class':      ['C 180', 'C 200', 'C 300', 'AMG C 43', 'AMG C 63'],
  // Dodge
  'RAM 1500':     ['SLT', 'Big Horn', 'Rebel', 'Laramie', 'TRX', 'Limited'],
  'RAM 2500':     ['SLT', 'Big Horn', 'Laramie', 'Power Wagon', 'Limited'],
  'Charger':      ['SXT', 'GT', 'R/T', 'Scat Pack', 'SRT Hellcat'],
  'Challenger':   ['SXT', 'GT', 'R/T', 'Scat Pack', 'SRT Hellcat', '392'],
  // Chevrolet
  'Tahoe':        ['LS', 'LT', 'RST', 'Z71', 'Premier', 'High Country'],
  'Suburban':     ['LS', 'LT', 'RST', 'Z71', 'Premier', 'High Country'],
  // GMC
  'Yukon':        ['SLE', 'SLT', 'AT4', 'Denali', 'Denali Ultimate'],
  // Jeep
  'Wrangler':     ['Sport', 'Sahara', 'Rubicon', '4xe', '392', 'Unlimited'],
  'Grand Cherokee': ['Laredo', 'Limited', 'Trailhawk', 'Overland', 'Summit', 'SRT'],
  // Land Rover
  'Range Rover':  ['Standard', 'SE', 'HSE', 'Autobiography', 'SVR', 'SV'],
  // Hyundai
  'Palisade':     ['SE', 'SEL', 'XRT', 'Limited', 'Calligraphy'],
  'Tucson':       ['SE', 'SEL', 'N Line', 'XRT', 'Limited'],
  'Santa Fe':     ['SE', 'SEL', 'XRT', 'Limited', 'Calligraphy'],
  // Kia
  'Sorento':      ['LX', 'S', 'EX', 'SX', 'X-Line SX', 'SX Prestige'],
  'Telluride':    ['LX', 'S', 'EX', 'SX', 'X-Line SX', 'SX Prestige'],
};
