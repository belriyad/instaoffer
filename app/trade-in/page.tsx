'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, ArrowLeft, ChevronRight, ChevronLeft, Info, Clock, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StepIndicator from '@/components/StepIndicator';
import PriceGuidanceCard from '@/components/PriceGuidanceCard';
import { SearchableMakeSelect, SearchableModelSelect, KmBucketPicker, KM_BUCKETS, kmLabel } from '@/lib/form-controls';
import { formatQAR } from '@/lib/utils';

const STEPS = ['Current vehicle', 'Desired next vehicle', 'Timeline & Submit'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 25 }, (_, i) => CURRENT_YEAR - i);
const CITIES = ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Lusail', 'Umm Salal', 'Al Daayen', 'Al Shamal'];

const TIMELINE_OPTIONS = [
  { value: 'urgent', icon: Clock, label: '⚡ ASAP', desc: 'I want to close within days', border: 'border-orange-400 bg-orange-50', color: 'text-orange-500' },
  { value: 'flexible', icon: TrendingUp, label: '📅 Within a month', desc: 'Open to the right deal soon', border: 'border-blue-400 bg-blue-50', color: 'text-blue-600' },
  { value: 'open', icon: RefreshCw, label: '🕐 No rush', desc: 'Exploring my options', border: 'border-green-400 bg-green-50', color: 'text-green-600' },
] as const;

type Timeline = 'urgent' | 'flexible' | 'open' | '';

function TradeInContent() {
  const params = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Target car context (when coming from /cars/[slug])
  const targetCarId = params.get('target_car_id') ?? '';
  const targetCarName = params.get('target_name') ?? '';
  const targetPriceRaw = params.get('target_price') ?? '';
  const targetPriceNum = parseInt(targetPriceRaw) || 0;
  const targetDealer = params.get('target_dealer') ?? '';

  // Step 0: current car
  const [curMake, setCurMake] = useState(params.get('make') ?? '');
  const [curModel, setCurModel] = useState(params.get('class_name') ?? '');
  const [curYear, setCurYear] = useState(params.get('year') ?? '');
  const [curCity, setCurCity] = useState(params.get('city') ?? 'Doha');

  // Snap incoming km string to nearest bucket
  const snapKm = (raw: string | null): number | null => {
    if (!raw) return null;
    const num = parseInt(raw);
    if (isNaN(num)) return null;
    const sorted = [...KM_BUCKETS].sort((a, b) => Math.abs(a.value - num) - Math.abs(b.value - num));
    return sorted[0]?.value ?? null;
  };
  const [curKm, setCurKm] = useState<number | null>(snapKm(params.get('km')));

  // Step 1: desired next car
  const [tgtMake, setTgtMake] = useState('');
  const [tgtModel, setTgtModel] = useState('');
  const [tgtYear, setTgtYear] = useState('');
  const [tgtPrice, setTgtPrice] = useState('');

  // Step 2: timeline
  const [timeline, setTimeline] = useState<Timeline>('');
  const [notes, setNotes] = useState('');

  function validateStep(): string {
    if (step === 0) {
      if (!curMake || !curModel) return 'Please select make and model of your current car.';
      if (!curYear) return 'Please select the year.';
      if (!curKm) return 'Please enter the mileage.';
    }
    if (step === 2 && !timeline) return 'Please select a timeline.';
    return '';
  }

  function goNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function goBack() { setError(''); setStep(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  function handleSubmit() {
    const err = validateStep();
    if (err) { setError(err); return; }
    const sp = new URLSearchParams({
      make: curMake, class_name: curModel, year: curYear, km: curKm != null ? String(curKm) : '', city: curCity,
      intent: 'trade_in', timeline,
      ...(targetCarId && { target_car_id: targetCarId }),
      ...(targetCarName && { target_car_name: targetCarName }),
      ...(targetPriceRaw && { target_price: targetPriceRaw }),
      ...(targetDealer && { target_dealer: targetDealer }),
      ...(tgtMake && { target_make: tgtMake }),
      ...(tgtModel && { target_model: tgtModel }),
      ...(tgtYear && { target_year: tgtYear }),
      ...(tgtPrice && { target_price: tgtPrice }),
      ...(notes && { notes }),
    });
    router.push(`/submit-offer?${sp}`);
    setSubmitted(true);
  }

  const tgtPriceNum = parseInt(tgtPrice.replace(/,/g, '')) || 0;

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 bg-gradient-to-br from-[#003087] to-[#001a52] flex items-center justify-center px-4 py-16">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-green-500" size={36} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Trade-in submitted! 🔄</h2>
            <p className="text-gray-600 mb-6">
              {targetDealer
                ? `Your trade-in request was sent directly to ${targetDealer}.`
                : 'Verified dealers will review your current car and desired next vehicle.'}
            </p>
            <Link href="/my-offers" className="block w-full bg-[#003087] text-white font-bold py-3 rounded-lg hover:bg-[#002070] transition-colors">View My Offers</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fb]">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#003087] font-semibold mb-6 hover:underline">
          <ArrowLeft size={15} /> Back
        </Link>

        {/* Target car banner — shown when coming from a car listing */}
        {targetCarName && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-5">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Trading toward</p>
            <p className="text-lg font-black text-gray-900">{targetCarName}</p>
            {targetDealer && <p className="text-sm text-gray-500 mt-0.5">Dealer: {targetDealer}</p>}
            {targetPriceNum > 0 && (
              <p className="text-sm font-bold text-green-700 mt-1">
                {new Intl.NumberFormat('en-QA', { style: 'currency', currency: 'QAR', maximumFractionDigits: 0 }).format(targetPriceNum)}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <RefreshCw size={20} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Trade In My Car</h1>
            <p className="text-sm text-gray-500">Upgrade in one seamless transaction</p>
          </div>
        </div>

        <StepIndicator steps={STEPS} current={step} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" /> {error}
          </div>
        )}

        {/* STEP 0: Current vehicle */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4 text-base">🚗 Your Current Vehicle</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Make *</label>
                  <SearchableMakeSelect value={curMake} onChange={v => { setCurMake(v); setCurModel(''); }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Model *</label>
                  <SearchableModelSelect make={curMake} value={curModel} onChange={setCurModel} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Year *</label>
                    <select value={curYear} onChange={e => setCurYear(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]">
                      <option value="">Year</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mileage (km) *</label>
                  <KmBucketPicker value={curKm} onChange={setCurKm} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">City</label>
                  <select value={curCity} onChange={e => setCurCity(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]">
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <PriceGuidanceCard make={curMake} class_name={curModel} year={curYear} km={curKm != null ? String(curKm) : ''} city={curCity} />
          </div>
        )}

        {/* STEP 1: Desired next vehicle */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-1 text-base">🎯 What Car Do You Want Next?</h2>
              <p className="text-xs text-gray-500 mb-4">Optional — helps dealers match you to the right deal.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Target Make</label>
                  <SearchableMakeSelect value={tgtMake} onChange={v => { setTgtMake(v); setTgtModel(''); }} placeholder="Any make" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Target Model</label>
                  <SearchableModelSelect make={tgtMake} value={tgtModel} onChange={setTgtModel} placeholder="Any model" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Approx. Year</label>
                    <select value={tgtYear} onChange={e => setTgtYear(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]">
                      <option value="">Any year</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Target Price (QAR)</label>
                    <input type="number" value={tgtPrice} onChange={e => setTgtPrice(e.target.value)} placeholder="e.g. 180000" min={0}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]" />
                  </div>
                </div>
              </div>
            </div>

            {tgtPriceNum > 0 && (
              <div className="bg-[#f0f4ff] rounded-xl border border-[#003087]/15 p-4">
                <p className="text-xs font-bold text-[#003087] uppercase tracking-wide mb-1">Estimated Difference to Pay</p>
                <p className="text-sm text-gray-600">
                  After your trade-in, you&apos;d need approximately{' '}
                  <span className="font-bold text-[#003087]">{formatQAR(Math.max(0, tgtPriceNum - 80000))} – {formatQAR(Math.max(0, tgtPriceNum - 50000))}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Info size={11} /> Based on estimated trade-in range. Actual depends on final offer.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Timeline + Submit */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4 text-base">⏱️ What&apos;s your timeline?</h2>
              <div className="grid grid-cols-1 gap-3">
                {TIMELINE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setTimeline(opt.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${timeline === opt.value ? opt.border : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="font-semibold text-sm text-gray-900">{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Any notes for dealers? <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="e.g. I want a white SUV, no accidents..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] resize-none" />
            </div>
            <div className="bg-[#f0f4ff] rounded-xl border border-[#003087]/15 p-4">
              <p className="text-xs font-bold text-[#003087] uppercase tracking-wide mb-2">Summary</p>
              <div className="text-sm text-gray-700 space-y-0.5">
                <p><span className="text-gray-400">Current car:</span> {curYear} {curMake} {curModel}</p>
                <p><span className="text-gray-400">Mileage:</span> {curKm != null ? kmLabel(curKm) : '—'}</p>
                {tgtMake && <p><span className="text-gray-400">Looking for:</span> {tgtYear} {tgtMake} {tgtModel}</p>}
              </div>
            </div>
            <button type="button" onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-base transition-all shadow-md">
              <RefreshCw size={18} /> Find Matching Dealers
            </button>
            <p className="text-center text-xs text-gray-400">Your details are only shared with dealers who respond.</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          {step > 0
            ? <button type="button" onClick={goBack} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700"><ChevronLeft size={16} /> Back</button>
            : <span />
          }
          {step < STEPS.length - 1 && (
            <button type="button" onClick={goNext}
              className="flex items-center gap-1.5 bg-[#003087] hover:bg-[#0057b8] text-white font-bold px-6 py-3 rounded-xl text-sm transition-all ml-auto">
              Continue <ChevronRight size={16} />
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function TradeInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f4f6fb] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    }>
      <TradeInContent />
    </Suspense>
  );
}
