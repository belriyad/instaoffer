'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Car, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import {
  FUEL_TYPES, GEAR_TYPES, CAR_TYPES, formatKM,
} from '@/lib/utils';
import {
  MakeSelect, ModelSelect, TrimSelect,
  YearTiles, KmBucketPicker, kmLabel,
  ConditionPicker, CityPicker, PillGroupPicker,
} from '@/lib/form-controls';
import { getMLEstimate, getMLForecast, getMarketComps, getMLTimeToSell, MLEstimate, MLForecast, OfferComps, MLTimeToSellEstimate } from '@/lib/api';
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
  const canContinue = !!data.make && !!data.class_name;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">What&rsquo;s your car?</h2>
        <p className="text-gray-400 text-sm mb-4">Start by selecting the make</p>
        <MakeSelect
          value={data.make}
          onChange={make => { onUpdate('make', make); onUpdate('class_name', ''); onUpdate('trim', ''); }}
        />
      </div>

      <AnimatePresence>
        {data.make && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <p className="text-sm font-bold text-gray-700 mb-2">
              Model <span className="text-[#003087]">·</span> {data.make}
            </p>
            <ModelSelect
              make={data.make}
              value={data.class_name}
              onChange={m => { onUpdate('class_name', m); onUpdate('trim', ''); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {data.class_name && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <TrimSelect
              model={data.class_name}
              value={data.trim}
              onChange={t => onUpdate('trim', t)}
            />
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
  const [showOptional, setShowOptional] = useState(false);
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
        <YearTiles value={data.year} onChange={y => onUpdate('year', y)} />
      </div>

      {/* KM */}
      <div>
        <p className="text-sm font-bold text-gray-700 mb-3">Mileage</p>
        <KmBucketPicker value={data.km} onChange={km => onUpdate('km', km)} />
        {data.km && data.km > 0 && (
          <p className="text-xs text-gray-400 mt-2 text-right">{formatKM(data.km)}</p>
        )}
      </div>

      {/* Condition */}
      <div>
        <p className="text-sm font-bold text-gray-700 mb-3">Condition</p>
        <ConditionPicker value={data.condition} onChange={v => onUpdate('condition', v)} />
      </div>

      {/* City */}
      <div>
        <p className="text-sm font-bold text-gray-700 mb-3">City</p>
        <CityPicker value={data.city} onChange={v => onUpdate('city', v)} />
      </div>

      {/* Optional details accordion */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowOptional(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span>Improve accuracy <span className="text-gray-400 font-normal">(optional)</span></span>
          <ChevronRight size={15} className={`transition-transform ${showOptional ? 'rotate-90' : ''}`} />
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
                <div className="pt-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Fuel</p>
                  <PillGroupPicker options={FUEL_TYPES} value={data.fuel_type} onChange={v => onUpdate('fuel_type', v)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Body</p>
                    <PillGroupPicker options={CAR_TYPES} value={data.car_type} onChange={v => onUpdate('car_type', v)} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Transmission</p>
                    <PillGroupPicker options={GEAR_TYPES} value={data.gear_type} onChange={v => onUpdate('gear_type', v)} />
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
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [estimate, setEstimate]     = useState<MLEstimate | null>(null);
  const [forecast, setForecast]     = useState<MLForecast | null>(null);
  const [comps, setComps]           = useState<OfferComps | null>(null);
  const [timeToSell, setTimeToSell] = useState<MLTimeToSellEstimate | null>(null);

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
      const [est, fc, comp, tts] = await Promise.all([
        getMLEstimate(params, authToken),
        getMLForecast(params, authToken).catch(() => null),
        getMarketComps({ make: data.make, class_name: data.class_name, year: data.year!, km: data.km! }, authToken).catch(() => null),
        getMLTimeToSell(params, authToken).catch(() => null),
      ]);
      setEstimate(est);
      setForecast(fc);
      setComps(comp);
      setTimeToSell(tts);
    } catch {
      setError('Could not get estimate. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
          <div className="w-14 h-14 border-4 border-[#003087]/20 border-t-[#003087] rounded-full animate-spin mb-6" />
          <p className="text-lg font-bold text-gray-900 mb-1">Analysing your car…</p>
          <p className="text-sm text-gray-400 text-center max-w-xs">
            Running Qatar market data, depreciation model, and time-to-sell estimate
          </p>
          <div className="mt-8 flex flex-col gap-2 w-full max-w-xs">
            {['Fetching market comparables…', 'Running ML valuation model…', 'Calculating price forecast…'].map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-4 h-4 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin flex-shrink-0" style={{ animationDelay: `${i * 0.2}s` }} />
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (estimate) {
    return <EstimateResult estimate={estimate} forecast={forecast} comps={comps} timeToSell={timeToSell} data={data} />;
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
