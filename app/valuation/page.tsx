'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Car, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { CAR_MAKES, CAR_MODELS, YEARS, CONDITIONS, FUEL_TYPES, GEAR_TYPES, CAR_TYPES, QATAR_CITIES, formatQAR, formatKM } from '@/lib/utils';
import { getMLEstimate, getMarketComps, MLEstimate, OfferComps } from '@/lib/api';
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

const TOTAL_STEPS = 6;

function ValuationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { ensureGuestToken } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ValuationData>({
    make: searchParams.get('make') || '',
    class_name: '',
    model: '',
    year: null,
    km: null,
    car_type: '',
    fuel_type: '',
    gear_type: 'Automatic',
    condition: '',
    city: 'Doha',
    trim: '',
  });
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<MLEstimate | null>(null);
  const [comps, setComps] = useState<OfferComps | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchParams.get('make') && !data.make) {
      setData(d => ({ ...d, make: searchParams.get('make')! }));
    }
  }, []);

  const models = data.make ? (CAR_MODELS[data.make] || []) : [];
  const progress = (step / TOTAL_STEPS) * 100;

  function update<K extends keyof ValuationData>(key: K, value: ValuationData[K]) {
    setData(d => ({ ...d, [key]: value }));
  }

  // Steps where picking a tile immediately advances to the next step
  const AUTO_ADVANCE_STEPS = new Set([1, 2, 3, 6]);

  function pick<K extends keyof ValuationData>(key: K, value: ValuationData[K]) {
    setData(d => ({ ...d, [key]: value }));
    if (AUTO_ADVANCE_STEPS.has(step)) {
      // Small delay so the selection highlight is visible before transition
      setTimeout(() => setStep(s => s + 1), 180);
    }
  }

  function canProceed() {
    switch (step) {
      case 1: return !!data.make;
      case 2: return !!data.class_name;
      case 3: return !!data.year;
      case 4: return !!data.km && data.km > 0;
      case 5: return !!data.car_type && !!data.fuel_type;
      case 6: return !!data.condition;
      default: return true;
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      // Obtain a valid auth token — reuses cached guest token if user is not signed in
      const authToken = await ensureGuestToken();

      const [est, comp] = await Promise.all([
        getMLEstimate({
          make: data.make,
          class_name: data.class_name,
          manufacture_year: data.year!,
          km: data.km!,
          car_type: data.car_type || undefined,
          fuel_type: data.fuel_type || undefined,
          gear_type: data.gear_type || undefined,
          city: data.city || undefined,
          trim: data.trim || undefined,
        }, authToken),
        getMarketComps({
          make: data.make,
          class_name: data.class_name,
          year: data.year!,
          km: data.km!,
          model: data.model || undefined,
        }, authToken).catch(() => null),
      ]);
      setEstimate(est);
      setComps(comp);
      setStep(7); // result screen
    } catch {
      setError('Could not get estimate. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (step < TOTAL_STEPS) setStep(s => s + 1);
    else handleSubmit();
  }

  function back() {
    if (step > 1) setStep(s => s - 1);
  }

  if (step === 7 && estimate) {
    return <EstimateResult estimate={estimate} comps={comps} data={data} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <button onClick={back} disabled={step === 1} className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#003087] disabled:opacity-30 transition-colors">
              <ChevronLeft size={16} /> Back
            </button>
            <span className="text-sm text-gray-500 font-medium">Step {step} of {TOTAL_STEPS}</span>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#003087] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Step card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8"
          >
            {/* Step 1: Make */}
            {step === 1 && (
              <StepWrapper title="What's the make of your car?" subtitle="Select the manufacturer">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CAR_MAKES.map(make => (
                    <button
                      key={make}
                      onClick={() => { pick('make', make); update('class_name', ''); }}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                        data.make === make
                          ? 'border-[#003087] bg-[#e8f0fd] text-[#003087]'
                          : 'border-gray-200 hover:border-[#003087] hover:bg-[#e8f0fd] text-gray-700'
                      }`}
                    >
                      {make}
                    </button>
                  ))}
                </div>
              </StepWrapper>
            )}

            {/* Step 2: Model */}
            {step === 2 && (
              <StepWrapper title={`Which ${data.make} model?`} subtitle="Select the model">
                {models.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {models.map(model => (
                      <button
                        key={model}
                        onClick={() => pick('class_name', model)}
                        className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                          data.class_name === model
                            ? 'border-[#003087] bg-[#e8f0fd] text-[#003087]'
                            : 'border-gray-200 hover:border-[#003087] hover:bg-[#e8f0fd] text-gray-700'
                        }`}
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model Name</label>
                    <input
                      type="text"
                      value={data.class_name}
                      onChange={e => update('class_name', e.target.value)}
                      placeholder="e.g. Land Cruiser"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/20"
                    />
                  </div>
                )}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trim / Variant <span className="text-gray-400 font-normal">(optional but improves accuracy)</span></label>
                  <input
                    type="text"
                    value={data.trim}
                    onChange={e => update('trim', e.target.value)}
                    placeholder="e.g. GXR, VXR, SE, Sport"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/20"
                  />
                </div>
              </StepWrapper>
            )}

            {/* Step 3: Year */}
            {step === 3 && (
              <StepWrapper title="What year is it?" subtitle="Select the manufacture year">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {YEARS.map(y => (
                    <button
                      key={y}
                      onClick={() => pick('year', y)}
                      className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                        data.year === y
                          ? 'border-[#003087] bg-[#003087] text-white'
                          : 'border-gray-200 hover:border-[#003087] text-gray-700'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </StepWrapper>
            )}

            {/* Step 4: Mileage */}
            {step === 4 && (
              <StepWrapper title="What's the mileage?" subtitle="Enter the odometer reading in kilometres">
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="number"
                      value={data.km ?? ''}
                      onChange={e => update('km', Number(e.target.value))}
                      placeholder="e.g. 85000"
                      min="0"
                      max="500000"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-2xl font-bold focus:outline-none focus:border-[#003087] pr-16"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">km</span>
                  </div>
                  {data.km && (
                    <p className="text-center text-gray-500 text-sm">{formatKM(data.km)}</p>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {[20000, 50000, 80000, 100000, 150000, 200000].map(km => (
                      <button key={km} onClick={() => update('km', km)} className={`py-2 rounded-lg border text-sm font-medium transition-all ${data.km === km ? 'border-[#003087] bg-[#e8f0fd] text-[#003087]' : 'border-gray-200 hover:border-gray-400 text-gray-600'}`}>
                        {formatKM(km)}
                      </button>
                    ))}
                  </div>
                </div>
              </StepWrapper>
            )}

            {/* Step 5: Type & Fuel */}
            {step === 5 && (
              <StepWrapper title="Tell us more about the car" subtitle="Body type and fuel help improve your estimate">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Body Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {CAR_TYPES.map(t => (
                        <button key={t} onClick={() => update('car_type', t)} className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${data.car_type === t ? 'border-[#003087] bg-[#e8f0fd] text-[#003087]' : 'border-gray-200 hover:border-gray-400 text-gray-700'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Fuel Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {FUEL_TYPES.map(f => (
                        <button key={f} onClick={() => update('fuel_type', f)} className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${data.fuel_type === f ? 'border-[#003087] bg-[#e8f0fd] text-[#003087]' : 'border-gray-200 hover:border-gray-400 text-gray-700'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Transmission</label>
                    <div className="grid grid-cols-2 gap-2">
                      {GEAR_TYPES.map(g => (
                        <button key={g} onClick={() => update('gear_type', g)} className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${data.gear_type === g ? 'border-[#003087] bg-[#e8f0fd] text-[#003087]' : 'border-gray-200 hover:border-gray-400 text-gray-700'}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">City</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {QATAR_CITIES.map(c => (
                        <button key={c} onClick={() => update('city', c)} className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${data.city === c ? 'border-[#003087] bg-[#e8f0fd] text-[#003087]' : 'border-gray-200 hover:border-gray-400 text-gray-700'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </StepWrapper>
            )}

            {/* Step 6: Condition */}
            {step === 6 && (
              <StepWrapper title="What's the condition?" subtitle="Be honest — it helps get you accurate offers">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CONDITIONS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => pick('condition', c.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        data.condition === c.value
                          ? 'border-[#003087] bg-[#e8f0fd]'
                          : 'border-gray-200 hover:border-[#003087]'
                      }`}
                    >
                      <div className={`font-bold mb-1 ${data.condition === c.value ? 'text-[#003087]' : 'text-gray-900'}`}>{c.label}</div>
                      <div className="text-sm text-gray-500">{c.description}</div>
                    </button>
                  ))}
                </div>
              </StepWrapper>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Next button */}
            <div className="mt-6">
              <button
                onClick={next}
                disabled={!canProceed() || loading}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all ${
                  canProceed() && !loading
                    ? 'bg-[#003087] hover:bg-[#0057b8] text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Getting your estimate...
                  </span>
                ) : step === TOTAL_STEPS ? (
                  <>Get My Free Estimate <Car size={20} /></>
                ) : (
                  <>Continue <ChevronRight size={20} /></>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Summary of selections */}
        {(data.make || data.class_name) && (
          <div className="mt-4 bg-white rounded-xl border border-gray-100 p-4 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">Your car: </span>
            {[data.year, data.make, data.class_name, data.trim].filter(Boolean).join(' ')}
            {data.km ? ` · ${formatKM(data.km)}` : ''}
          </div>
        )}
      </div>
    </div>
  );
}

function StepWrapper({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl font-black text-gray-900 mb-1">{title}</h2>
      <p className="text-gray-500 mb-6">{subtitle}</p>
      {children}
    </div>
  );
}

export default function ValuationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>}>
      <ValuationContent />
    </Suspense>
  );
}
