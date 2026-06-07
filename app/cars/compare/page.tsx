'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, X, Plus, RefreshCw, MessageSquare, AlertCircle,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getWakalatCar, WakalatCarDetail, wakalatImageUrl } from '@/lib/api';
import { formatQAR } from '@/lib/utils';

export const COMPARE_KEY = 'instaoffer_compare_slugs';
export const MAX_COMPARE = 4;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseNum(v: string | null | undefined): number | null {
  if (!v) return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}

function getBestIdx(values: (number | null)[], dir: 'asc' | 'desc'): number {
  const nums = values
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => x.v !== null);
  if (!nums.length) return -1;
  return dir === 'asc'
    ? nums.reduce((a, b) => a.v < b.v ? a : b).i
    : nums.reduce((a, b) => a.v > b.v ? a : b).i;
}

// ─── Spec row definitions ─────────────────────────────────────────────────────
type SpecRow = {
  label: string;
  extract: (c: WakalatCarDetail) => string | null;
  numExtract?: (c: WakalatCarDetail) => number | null;
  best?: 'asc' | 'desc';
  bestLabel?: string; // text shown on winning cell
};

const SPEC_ROWS: SpecRow[] = [
  {
    label: 'Starting Price',
    extract: c => c.base_price_qar ? formatQAR(c.base_price_qar) : null,
    numExtract: c => c.base_price_qar,
    best: 'asc',
    bestLabel: 'Lowest',
  },
  { label: 'Body Type',    extract: c => c.body_type ?? null },
  { label: 'Fuel Type',    extract: c => c.fuel_type ?? null },
  { label: 'Transmission', extract: c => c.transmission ?? null },
  { label: 'Drivetrain',   extract: c => c.drivetrain ?? null },
  { label: 'Engine',       extract: c => c.engine ?? null },
  {
    label: 'Horsepower',
    extract: c => c.horsepower_hp ? `${c.horsepower_hp} HP` : null,
    numExtract: c => parseNum(c.horsepower_hp),
    best: 'desc',
    bestLabel: 'Most Power',
  },
  {
    label: 'Torque',
    extract: c => c.torque_nm ? `${c.torque_nm} Nm` : null,
    numExtract: c => parseNum(c.torque_nm),
    best: 'desc',
    bestLabel: 'Most Torque',
  },
  {
    label: '0–100 km/h',
    extract: c => c.accel_0_100_s ? `${c.accel_0_100_s}s` : null,
    numExtract: c => parseNum(c.accel_0_100_s),
    best: 'asc',
    bestLabel: 'Quickest',
  },
  {
    label: 'Top Speed',
    extract: c => c.top_speed_kmh ? `${c.top_speed_kmh} km/h` : null,
    numExtract: c => parseNum(c.top_speed_kmh),
    best: 'desc',
    bestLabel: 'Fastest',
  },
  {
    label: 'Fuel Economy',
    extract: c => c.fuel_consumption_l100 ? `${c.fuel_consumption_l100} L/100km` : null,
    numExtract: c => parseNum(c.fuel_consumption_l100),
    best: 'asc',
    bestLabel: 'Most Efficient',
  },
  {
    label: 'Fuel Tank',
    extract: c => c.tank_l ? `${c.tank_l} L` : null,
    numExtract: c => parseNum(c.tank_l),
    best: 'desc',
    bestLabel: 'Largest Tank',
  },
  { label: 'Displacement', extract: c => c.displacement_cc ? `${c.displacement_cc} cc` : null },
  { label: 'Battery',      extract: c => c.battery_kwh ? `${c.battery_kwh} kWh` : null },
  { label: 'Dimensions',   extract: c => c.dimensions_mm ?? null },
];

// ─── Inner page (uses useSearchParams) ───────────────────────────────────────
function CompareInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [cars, setCars] = useState<(WakalatCarDetail | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    let raw = searchParams.get('slugs') ?? '';
    if (!raw) {
      try { raw = localStorage.getItem(COMPARE_KEY) ?? ''; } catch { /* ok */ }
    }
    const parsed = raw.split(',').filter(Boolean).slice(0, MAX_COMPARE);
    setSlugs(parsed);
    if (!parsed.length) { setLoading(false); return; }
    Promise.all(parsed.map(s => getWakalatCar(s).then(r => r.car).catch(() => null)))
      .then(results => { setCars(results); setLoading(false); });
  }, [searchParams]);

  function removeCar(idx: number) {
    const newSlugs = slugs.filter((_, i) => i !== idx);
    setSlugs(newSlugs);
    setCars(prev => prev.filter((_, i) => i !== idx));
    try { localStorage.setItem(COMPARE_KEY, newSlugs.join(',')); } catch { /* ok */ }
    router.replace(`/cars/compare?slugs=${newSlugs.join(',')}`, { scroll: false });
  }

  const activeCars = cars.filter((c): c is WakalatCarDetail => c !== null);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
    </div>
  );

  const colCount = activeCars.length;
  const showAddSlot = colCount < MAX_COMPARE;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 flex-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link href="/cars" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#003087] font-medium transition-colors">
          <ChevronLeft size={16} /> Browse Vehicles
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Compare Cars</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {colCount} car{colCount !== 1 ? 's' : ''} · up to {MAX_COMPARE} · 
            {colCount < 2 ? ' add at least 2 cars to compare' : ' green cells = winner in that category'}
          </p>
        </div>
        {colCount < MAX_COMPARE && (
          <Link href="/cars" className="flex items-center gap-1.5 text-sm font-bold text-[#003087] bg-[#e8f0fd] hover:bg-[#d0e0fb] px-4 py-2.5 rounded-xl transition-colors">
            <Plus size={14} /> Add Car
          </Link>
        )}
      </div>

      {activeCars.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <AlertCircle size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-500 mb-2">No cars to compare</p>
          <p className="text-xs text-gray-400 mb-4">Go to the cars listing and tap "+ Compare" on any car</p>
          <Link href="/cars" className="text-[#003087] text-sm font-bold hover:underline">Browse vehicles →</Link>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <table className="w-full border-collapse" style={{ minWidth: `${180 + colCount * 220 + (showAddSlot ? 160 : 0)}px` }}>
            <colgroup>
              <col style={{ width: '160px' }} />
              {activeCars.map(c => <col key={c.slug} style={{ width: '220px' }} />)}
              {showAddSlot && <col style={{ width: '160px' }} />}
            </colgroup>

            {/* ── Car header row ── */}
            <thead>
              <tr>
                <th className="pb-4 text-left align-bottom">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Specification</span>
                </th>
                {activeCars.map((car, i) => {
                  const imgUrl = car.images?.find(img => img.type === 'detail' || img.type === 'card')?.url
                    ?? car.image_urls_json?.[0];
                  const trimPrice = car.trims?.[0]?.price_qar ?? car.base_price_qar;
                  return (
                    <th key={car.slug} className="px-3 pb-4 align-top">
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 relative">
                        {/* Remove */}
                        <button
                          onClick={() => removeCar(i)}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-100 hover:bg-red-200 text-red-500 rounded-full flex items-center justify-center transition-colors z-10"
                          title="Remove"
                        >
                          <X size={12} />
                        </button>
                        {/* Image */}
                        {imgUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={wakalatImageUrl(imgUrl)} alt="" className="w-full h-32 object-cover rounded-xl mb-3" />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-xl mb-3 flex items-center justify-center text-4xl">🚗</div>
                        )}
                        <p className="text-xs text-gray-400">{car.dealer}</p>
                        <p className="font-black text-gray-900 text-sm leading-tight mt-0.5">{car.year} {car.make} {car.model}</p>
                        {car.base_price_qar && (
                          <p className="text-lg font-black text-[#003087] mt-2">{formatQAR(car.base_price_qar)}</p>
                        )}
                        {/* CTAs */}
                        <div className="flex flex-col gap-1.5 mt-3">
                          <Link
                            href={`/trade-in?target_car_id=${car.car_id}&target_slug=${car.slug}&target_name=${encodeURIComponent(`${car.year} ${car.make} ${car.model}`)}&target_price=${trimPrice ?? ''}&target_dealer=${encodeURIComponent(car.dealer ?? '')}`}
                            className="flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg transition-colors"
                          >
                            <RefreshCw size={11} /> Trade In My Car
                          </Link>
                          <Link
                            href={`/cars/${car.slug}`}
                            className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#003087] bg-[#e8f0fd] hover:bg-[#d0e0fb] px-3 py-2 rounded-lg transition-colors"
                          >
                            <MessageSquare size={11} /> View & Contact
                          </Link>
                        </div>
                      </div>
                    </th>
                  );
                })}
                {/* Add slot */}
                {showAddSlot && (
                  <th className="px-3 pb-4 align-top">
                    <Link href="/cars" className="flex flex-col items-center justify-center gap-3 h-full min-h-[200px] bg-white/60 border-2 border-dashed border-gray-200 rounded-2xl hover:border-[#003087] hover:bg-[#f0f5ff] transition-all p-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Plus size={20} className="text-gray-400" />
                      </div>
                      <span className="text-xs font-bold text-gray-400 text-center">Add another car<br /><span className="font-normal text-gray-300">({MAX_COMPARE - colCount} slot{MAX_COMPARE - colCount > 1 ? 's' : ''} left)</span></span>
                    </Link>
                  </th>
                )}
              </tr>
            </thead>

            {/* ── Spec rows ── */}
            <tbody>
              {SPEC_ROWS.map((row, ri) => {
                const vals = activeCars.map(row.extract);
                const nums = row.numExtract ? activeCars.map(row.numExtract) : null;
                const bestIdx = nums && row.best ? getBestIdx(nums, row.best) : -1;
                const hasAny = vals.some(Boolean);
                if (!hasAny) return null;

                return (
                  <tr key={row.label} className={ri % 2 === 0 ? '' : ''}>
                    <td className="py-2.5 pr-4 align-middle">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        {row.label}
                      </span>
                    </td>
                    {activeCars.map((car, ci) => {
                      const val = vals[ci];
                      const isBest = bestIdx === ci && val !== null && colCount >= 2;
                      return (
                        <td
                          key={car.slug}
                          className={`px-3 py-2.5 align-middle border-x border-gray-100 ${isBest ? 'bg-green-50' : ri % 2 === 0 ? 'bg-gray-50/40' : 'bg-white'}`}
                        >
                          {val ? (
                            <div className={`text-sm font-semibold ${isBest ? 'text-green-700' : 'text-gray-800'}`}>
                              {isBest && (
                                <span className="block text-xs font-bold text-green-500 mb-0.5">
                                  ✓ {row.bestLabel}
                                </span>
                              )}
                              {val}
                            </div>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>
                      );
                    })}
                    {showAddSlot && <td className="px-3 py-2.5 bg-transparent" />}
                  </tr>
                );
              })}

              {/* Features row — show unique features each car has */}
              {activeCars.some(c => c.features_json?.length) && (
                <tr>
                  <td className="py-3 pr-4 align-top">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Key Features</span>
                  </td>
                  {activeCars.map(car => (
                    <td key={car.slug} className="px-3 py-3 align-top border-x border-b border-gray-100 bg-white">
                      {car.features_json?.length ? (
                        <ul className="space-y-1">
                          {car.features_json.slice(0, 6).map((f, fi) => (
                            <li key={fi} className="text-xs text-gray-600 flex items-start gap-1.5">
                              <span className="text-[#003087] shrink-0 mt-0.5">✓</span>{f}
                            </li>
                          ))}
                          {car.features_json.length > 6 && (
                            <li className="text-xs text-gray-400">+{car.features_json.length - 6} more</li>
                          )}
                        </ul>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>
                  ))}
                  {showAddSlot && <td className="bg-transparent" />}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {colCount >= 2 && colCount < MAX_COMPARE && (
        <p className="text-center text-xs text-gray-400 mt-4">
          Up to {MAX_COMPARE} cars — <Link href="/cars" className="text-[#003087] font-semibold hover:underline">add more from the listing →</Link>
        </p>
      )}
    </div>
  );
}

// ─── Page wrapper (Suspense for useSearchParams) ──────────────────────────────
export default function ComparePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
        </div>
      }>
        <CompareInner />
      </Suspense>
      <Footer />
    </div>
  );
}
