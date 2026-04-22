'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, ChevronDown, ChevronUp, Car, AlertCircle, Check } from 'lucide-react';
import Navbar from '@/components/Navbar';
import {
  CAR_MAKES, CAR_MODELS, CAR_TRIMS, CONDITIONS,
  FUEL_TYPES, GEAR_TYPES, CAR_TYPES, QATAR_CITIES,
  formatKM,
} from '@/lib/utils';
import { getMLEstimate, getMLForecast, getMarketComps, MLEstimate, MLForecast, OfferComps } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import EstimateResult from './EstimateResult';

export interface ValuationData {
  make: string;
  class_name: string;
  model: string;
  year: number | null;
  km: number | null;
  car_type: string;
  fuel_type: string;
  gear_type: string;
  condition: string;
  city: string;
  trim: string;
}

// ─── Brand colour accents ──────────────────────────────────────────────────────
const MAKE_COLORS: Record<string, string> = {
  'Toyota':        'bg-red-50   border-red-200   text-red-800',
  'Lexus':         'bg-slate-50 border-slate-300 text-slate-800',
  'Nissan':        'bg-red-50   border-red-200   text-red-800',
  'Honda':         'bg-red-50   border-red-200   text-red-800',
  'BMW':           'bg-blue-50  border-blue-300  text-blue-900',
  'Mercedes-Benz': 'bg-zinc-50  border-zinc-300  text-zinc-900',
  'Audi':          'bg-zinc-50  border-zinc-300  text-zinc-900',
  'Land Rover':    'bg-green-50 border-green-300 text-green-900',
  'Porsche':       'bg-yellow-50 border-yellow-300 text-yellow-900',
  'Chevrolet':     'bg-amber-50 border-amber-200 text-amber-900',
  'Ford':          'bg-blue-50  border-blue-200  text-blue-900',
  'Dodge':         'bg-orange-50 border-orange-200 text-orange-900',
  'GMC':           'bg-red-50   border-red-200   text-red-900',
  'Jeep':          'bg-green-50 border-green-200 text-green-900',
  'Hyundai':       'bg-sky-50   border-sky-200   text-sky-900',
  'Kia':           'bg-red-50   border-red-100   text-red-900',
  'Infiniti':      'bg-slate-50 border-slate-200 text-slate-800',
  'Mitsubishi':    'bg-red-50   border-red-100   text-red-800',
};
const DEFAULT_MAKE_COLOR = 'bg-gray-50 border-gray-200 text-gray-800';

// Recent years shown as big tiles; older ones in a compact overflow row
const RECENT_YEARS = Array.from({ length: 8 }, (_, i) => 2025 - i);
const OLDER_YEARS  = Array.from({ length: 18 }, (_, i) => 2017 - i);

// KM quick-pick presets → exact midpoint value used
const KM_PRESETS = [
  { label: 'Under 20k',   value: 10000  },
  { label: '20 – 50k',    value: 35000  },
  { label: '50 – 80k',    value: 65000  },
  { label: '80 – 120k',   value: 100000 },
  { label: '120 – 200k',  value: 160000 },
  { label: 'Over 200k',   value: 220000 },
];


// ─── Screen 1: Make + Model + Trim ────────────────────────────────────────────
function Screen1({
  data,
  onUpdate,
  onNext,
}: {
  data: ValuationData;
  onUpdate: <K extends keyof ValuationData>(k: K, v: ValuationData[K]) => void;
  onNext: () => void;
}) {
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? CAR_MAKES.filter(m => m.toLowerCase().includes(query.toLowerCase()))
    : CAR_MAKES;

  const models = data.make ? (CAR_MODELS[data.make] || []) : [];
  const trims  = data.class_name ? (CAR_TRIMS[data.class_name] || []) : [];

  function selectMake(make: string) {
    onUpdate('make', make);
    onUpdate('class_name', '');
    onUpdate('trim', '');
    setQuery('');
  }

  const canContinue = !!data.make && !!data.class_name;

  return (
    <div className="space-y-6">
      {/* Make */}
      <div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">What's your car?</h2>
        <p className="text-gray-400 text-sm mb-4">Start by selecting the make</p>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search make…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10 bg-gray-50"
          />
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
          {filtered.map(make => {
            const selected = data.make === make;
            const color = MAKE_COLORS[make] || DEFAULT_MAKE_COLOR;
            return (
              <button
                key={make}
                onClick={() => selectMake(make)}
                className={`relative py-2.5 px-2 rounded-xl border-2 text-xs font-bold transition-all text-center leading-tight ${
                  selected
                    ? 'border-[#003087] bg-[#003087] text-white shadow-md'
                    : `${color} hover:border-[#003087] hover:shadow-sm`
                }`}
              >
                {selected && <Check size={10} className="absolute top-1 right-1 opacity-70" />}
                {make}
              </button>
            );
          })}
        </div>
      </div>

      {/* Model — appears once make selected */}
      <AnimatePresence>
        {data.make && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm font-bold text-gray-700 mb-2">
              Model <span className="text-[#003087]">·</span> {data.make}
            </p>
            {models.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {models.map(m => (
                  <button
                    key={m}
                    onClick={() => { onUpdate('class_name', m); onUpdate('trim', ''); }}
                    className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition-all ${
                      data.class_name === m
                        ? 'border-[#003087] bg-[#003087] text-white'
                        : 'border-gray-200 text-gray-600 hover:border-[#003087] hover:text-[#003087]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={data.class_name}
                onChange={e => { onUpdate('class_name', e.target.value); onUpdate('trim', ''); }}
                placeholder="e.g. Land Cruiser"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trim — appears once model selected, only if trims are known */}
      <AnimatePresence>
        {data.class_name && trims.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm font-bold text-gray-700 mb-2">
              Trim <span className="text-gray-400 font-normal text-xs">(optional — improves accuracy)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {trims.map(t => (
                <button
                  key={t}
                  onClick={() => onUpdate('trim', data.trim === t ? '' : t)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                    data.trim === t
                      ? 'border-[#003087] bg-[#003087] text-white'
                      : 'border-gray-200 text-gray-600 hover:border-[#003087] hover:text-[#003087]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={onNext}
        disabled={!canContinue}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all ${
          canContinue
            ? 'bg-[#003087] hover:bg-[#0057b8] text-white shadow-md'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        Continue <ChevronRight size={18} />
      </button>
    </div>
  );
}


// ─── Screen 2: Year + KM + Condition + Optional ───────────────────────────────
function Screen2({
  data,
  onUpdate,
  onSubmit,
  loading,
  error,
}: {
  data: ValuationData;
  onUpdate: <K extends keyof ValuationData>(k: K, v: ValuationData[K]) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
}) {
  const [showOlderYears, setShowOlderYears] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [kmRaw, setKmRaw] = useState(data.km ? String(data.km) : '');

  function setKm(val: number) {
    onUpdate('km', val);
    setKmRaw(String(val));
  }

  function handleKmInput(raw: string) {
    setKmRaw(raw);
    const n = parseInt(raw.replace(/\D/g, ''), 10);
    if (!isNaN(n)) onUpdate('km', n);
  }

  const activePreset = KM_PRESETS.find(p => p.value === data.km) ?? null;
  const canSubmit = !!data.year && !!data.km && data.km > 0 && !!data.condition;

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-2xl font-black text-gray-900 mb-0.5">A few more details</h2>
        <p className="text-gray-400 text-sm">
          {[data.year && String(data.year), data.make, data.class_name, data.trim].filter(Boolean).join(' · ')}
        </p>
      </div>

      {/* Year */}
      <div>
        <p className="text-sm font-bold text-gray-700 mb-3">Year</p>
        <div className="grid grid-cols-4 gap-2">
          {RECENT_YEARS.map(y => (
            <button
              key={y}
              onClick={() => onUpdate('year', y)}
              className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                data.year === y
                  ? 'border-[#003087] bg-[#003087] text-white'
                  : 'border-gray-200 hover:border-[#003087] text-gray-700'
              }`}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Older years toggle */}
        <button
          onClick={() => setShowOlderYears(v => !v)}
          className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-[#003087] transition-colors font-medium"
        >
          {showOlderYears ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {showOlderYears ? 'Hide older years' : 'Older than 2018'}
        </button>

        <AnimatePresence>
          {showOlderYears && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-5 gap-2 mt-2">
                {OLDER_YEARS.map(y => (
                  <button
                    key={y}
                    onClick={() => onUpdate('year', y)}
                    className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                      data.year === y
                        ? 'border-[#003087] bg-[#003087] text-white'
                        : 'border-gray-200 hover:border-[#003087] text-gray-600'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* KM */}
      <div>
        <p className="text-sm font-bold text-gray-700 mb-3">Mileage</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {KM_PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => setKm(p.value)}
              className={`py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                activePreset?.value === p.value
                  ? 'border-[#003087] bg-[#003087] text-white'
                  : 'border-gray-200 hover:border-[#003087] text-gray-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={kmRaw}
            onChange={e => handleKmInput(e.target.value)}
            placeholder="Or enter exact km…"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base font-semibold focus:outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10 pr-12"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">km</span>
        </div>
        {data.km && data.km > 0 && !activePreset && (
          <p className="text-xs text-gray-400 mt-1 text-right">{formatKM(data.km)}</p>
        )}
      </div>

      {/* Condition */}
      <div>
        <p className="text-sm font-bold text-gray-700 mb-3">Condition</p>
        <div className="grid grid-cols-2 gap-2">
          {CONDITIONS.map(c => (
            <button
              key={c.value}
              onClick={() => onUpdate('condition', c.value)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                data.condition === c.value
                  ? 'border-[#003087] bg-[#e8f0fd]'
                  : 'border-gray-200 hover:border-[#003087]'
              }`}
            >
              <div className={`text-sm font-bold ${data.condition === c.value ? 'text-[#003087]' : 'text-gray-900'}`}>
                {c.label}
              </div>
              <div className="text-xs text-gray-400 mt-0.5 leading-tight">{c.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Optional details accordion */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowOptional(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span>Improve accuracy <span className="text-gray-400 font-normal">(optional)</span></span>
          {showOptional ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        <AnimatePresence>
          {showOptional && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                {/* City */}
                <div className="pt-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">City</p>
                  <div className="flex flex-wrap gap-2">
                    {QATAR_CITIES.map(c => (
                      <button key={c} onClick={() => onUpdate('city', c)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                          data.city === c ? 'border-[#003087] bg-[#003087] text-white' : 'border-gray-200 text-gray-600 hover:border-[#003087]'
                        }`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Fuel */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Fuel</p>
                  <div className="flex flex-wrap gap-2">
                    {FUEL_TYPES.map(f => (
                      <button key={f} onClick={() => onUpdate('fuel_type', f)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                          data.fuel_type === f ? 'border-[#003087] bg-[#003087] text-white' : 'border-gray-200 text-gray-600 hover:border-[#003087]'
                        }`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Body + Transmission */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Body</p>
                    <div className="flex flex-col gap-1">
                      {CAR_TYPES.map(t => (
                        <button key={t} onClick={() => onUpdate('car_type', t)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium text-left transition-all ${
                            data.car_type === t ? 'border-[#003087] bg-[#e8f0fd] text-[#003087]' : 'border-gray-200 text-gray-600 hover:border-[#003087]'
                          }`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Transmission</p>
                    <div className="flex flex-col gap-1">
                      {GEAR_TYPES.map(g => (
                        <button key={g} onClick={() => onUpdate('gear_type', g)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium text-left transition-all ${
                            data.gear_type === g ? 'border-[#003087] bg-[#e8f0fd] text-[#003087]' : 'border-gray-200 text-gray-600 hover:border-[#003087]'
                          }`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!canSubmit || loading}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all ${
          canSubmit && !loading
            ? 'bg-[#ff6600] hover:bg-[#e05a00] text-white shadow-md hover:shadow-lg'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Getting your estimate…
          </>
        ) : (
          <>
            Get My Free Estimate <Car size={20} />
          </>
        )}
      </button>
    </div>
  );
}


// ─── Main component ────────────────────────────────────────────────────────────
function ValuationContent() {
  const searchParams = useSearchParams();
  const { ensureGuestToken } = useAuth();

  const [screen, setScreen] = useState<1 | 2>(1);
  const [data, setData] = useState<ValuationData>({
    make:       searchParams.get('make') || '',
    class_name: searchParams.get('class_name') || '',
    model:      '',
    year:       searchParams.get('year') ? Number(searchParams.get('year')) : null,
    km:         searchParams.get('km') ? Number(searchParams.get('km')) : null,
    car_type:   '',
    fuel_type:  '',
    gear_type:  'Automatic',
    condition:  '',
    city:       'Doha',
    trim:       searchParams.get('trim') || '',
  });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [estimate, setEstimate] = useState<MLEstimate | null>(null);
  const [forecast, setForecast] = useState<MLForecast | null>(null);
  const [comps, setComps]       = useState<OfferComps | null>(null);

  // If make+model pre-filled from query params, skip to screen 2
  useEffect(() => {
    if (searchParams.get('make') && searchParams.get('class_name')) {
      setScreen(2);
    }
  }, []);

  function update<K extends keyof ValuationData>(key: K, value: ValuationData[K]) {
    setData(d => ({ ...d, [key]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const authToken = await ensureGuestToken();
      const params = {
        make:             data.make,
        class_name:       data.class_name,
        manufacture_year: data.year!,
        km:               data.km!,
        car_type:         data.car_type   || undefined,
        fuel_type:        data.fuel_type  || undefined,
        gear_type:        data.gear_type  || undefined,
        city:             data.city       || undefined,
        trim:             data.trim       || undefined,
        condition:        data.condition  || undefined,
      };
      const [est, fc, comp] = await Promise.all([
        getMLEstimate(params, authToken),
        getMLForecast(params, authToken).catch(() => null),
        getMarketComps({ make: data.make, class_name: data.class_name, year: data.year!, km: data.km! }, authToken).catch(() => null),
      ]);
      setEstimate(est);
      setForecast(fc);
      setComps(comp);
    } catch {
      setError('Could not get estimate. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (estimate) {
    return <EstimateResult estimate={estimate} forecast={forecast} comps={comps} data={data} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6">

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-5">
          {/* Back on screen 2 */}
          {screen === 2 && (
            <button
              onClick={() => setScreen(1)}
              className="text-xs text-gray-400 hover:text-[#003087] font-medium transition-colors"
            >
              ← Back
            </button>
          )}
          <div className="flex-1 flex gap-1.5">
            {[1, 2].map(s => (
              <div
                key={s}
                className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                  s <= screen ? 'bg-[#003087]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400 font-medium">{screen} / 2</span>
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, x: screen === 2 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: screen === 2 ? -40 : 40 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8"
          >
            {screen === 1 ? (
              <Screen1
                data={data}
                onUpdate={update}
                onNext={() => setScreen(2)}
              />
            ) : (
              <Screen2
                data={data}
                onUpdate={update}
                onSubmit={handleSubmit}
                loading={loading}
                error={error}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Mini summary pill */}
        {(data.make || data.class_name) && (
          <div className="mt-3 text-center text-xs text-gray-400">
            {[data.year, data.make, data.class_name, data.trim].filter(Boolean).join(' · ')}
            {data.km && data.km > 0 ? ` · ${formatKM(data.km)}` : ''}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ValuationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-400">Loading…</div>}>
      <ValuationContent />
    </Suspense>
  );
}
