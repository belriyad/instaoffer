'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  RefreshCw, ArrowLeft, ChevronRight, ChevronLeft, Info, Clock,
  TrendingUp, AlertTriangle, CheckCircle2, Car, Tag, Building2, LogIn, UserPlus,
  Upload, X, FileCheck, Camera,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StepIndicator from '@/components/StepIndicator';
import PriceGuidanceCard from '@/components/PriceGuidanceCard';
import { SearchableMakeSelect, SearchableModelSelect, KmBucketPicker, KM_BUCKETS, kmLabel, ConditionPicker } from '@/lib/form-controls';
import { formatQAR } from '@/lib/utils';
import { getMLEstimate, createTradeInRequest, uploadFile } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

/** When coming with a pre-selected target car we use 3 steps; otherwise 4. */
const STEPS_WITH_TARGET    = ['Your trade-in car', 'Photos & Documents', 'Timeline & Submit'];
const STEPS_WITHOUT_TARGET = ['Your trade-in car', 'Photos & Documents', 'Desired next car', 'Timeline & Submit'];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 25 }, (_, i) => CURRENT_YEAR - i);
const CITIES = ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Lusail', 'Umm Salal', 'Al Daayen', 'Al Shamal'];

const TIMELINE_OPTIONS = [
  { value: 'urgent',   icon: Clock,       label: '⚡ ASAP',             desc: 'I want to close within days',   border: 'border-orange-400 bg-orange-50' },
  { value: 'flexible', icon: TrendingUp,  label: '📅 Within a month',   desc: 'Open to the right deal soon',   border: 'border-blue-400 bg-blue-50' },
  { value: 'open',     icon: RefreshCw,   label: '🕐 No rush',           desc: 'Exploring my options',          border: 'border-green-400 bg-green-50' },
] as const;

type Timeline = 'urgent' | 'flexible' | 'open' | '';

function TradeInContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  // Target car context (when coming from /cars/[slug])
  const targetCarId   = params.get('target_car_id')  ?? '';
  const targetCarSlug = params.get('target_slug')    ?? '';
  const targetCarName = params.get('target_name')    ?? '';
  const targetPriceRaw = params.get('target_price')  ?? '';
  const targetPriceNum = parseInt(targetPriceRaw) || 0;
  const targetDealer  = params.get('target_dealer')  ?? '';

  const hasTarget = Boolean(targetCarId || targetCarName);
  const STEPS = hasTarget ? STEPS_WITH_TARGET : STEPS_WITHOUT_TARGET;
  // step 0 = current vehicle, step 1 = photos/docs, step 2 = desired (no target only), last = timeline
  const EVIDENCE_STEP  = 1;
  const TIMELINE_STEP  = hasTarget ? 2 : 3;

  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step 0: current car — read from URL params so they survive the login redirect round-trip
  const [curMake,      setCurMake]      = useState(params.get('cur_make')      ?? params.get('make')       ?? '');
  const [curModel,     setCurModel]     = useState(params.get('cur_model')     ?? params.get('class_name') ?? '');
  const [curYear,      setCurYear]      = useState(params.get('cur_year')      ?? params.get('year')       ?? '');
  const [curCity,      setCurCity]      = useState(params.get('cur_city')      ?? params.get('city')       ?? 'Doha');
  const [curCondition, setCurCondition] = useState(params.get('cur_condition') ?? 'good');

  const snapKm = (raw: string | null): number | null => {
    if (!raw) return null;
    const num = parseInt(raw);
    if (isNaN(num)) return null;
    const sorted = [...KM_BUCKETS].sort((a, b) => Math.abs(a.value - num) - Math.abs(b.value - num));
    return sorted[0]?.value ?? null;
  };
  const [curKm, setCurKm] = useState<number | null>(
    snapKm(params.get('cur_km') ?? params.get('km'))
  );

  /** Build a redirect URL that carries all current form state so the user returns to a fully-populated form. */
  function buildLoginRedirect(loginPath: string) {
    const p = new URLSearchParams(params.toString());
    if (curMake)      p.set('cur_make',      curMake);
    if (curModel)     p.set('cur_model',     curModel);
    if (curYear)      p.set('cur_year',      curYear);
    if (curCity)      p.set('cur_city',      curCity);
    if (curCondition) p.set('cur_condition', curCondition);
    if (curKm != null) p.set('cur_km',       String(curKm));
    return `${loginPath}?redirect=${encodeURIComponent(`/trade-in?${p.toString()}`)}`;
  }

  // Step 1 (when no target): desired next car
  const [tgtMake,  setTgtMake]  = useState('');
  const [tgtModel, setTgtModel] = useState('');
  const [tgtYear,  setTgtYear]  = useState('');
  const [tgtPrice, setTgtPrice] = useState(targetPriceRaw);
  const tgtPriceNum = parseInt(tgtPrice.replace(/[^0-9]/g, '')) || 0;

  // ML estimate for current car
  const [tradeEstimate,   setTradeEstimate]   = useState<[number, number] | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);

  useEffect(() => {
    if (!curMake || !curModel || !curYear || !curKm) return;
    setEstimateLoading(true);
    getMLEstimate({ make: curMake, class_name: curModel, manufacture_year: parseInt(curYear), km: curKm, city: curCity || undefined })
      .then(r => setTradeEstimate(r.confidence_range))
      .catch(() => setTradeEstimate(null))
      .finally(() => setEstimateLoading(false));
  }, [curMake, curModel, curYear, curKm, curCity]);

  // auth guard is now rendered inline — no redirect needed

  // Auto-advance to final step when returning from login with all params filled
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    // Only auto-advance if we're still on step 0 (fresh mount after redirect)
    if (step !== 0) return;
    // Check that the essential fields are already populated from URL params
    const makeOk  = Boolean(curMake);
    const modelOk = Boolean(curModel);
    const yearOk  = Boolean(curYear);
    const kmOk    = curKm !== null;
    // For "has target" flow: step 0 → step 1 (timeline). For no-target: step 0 → step 1 (desired) → step 2 (timeline).
    // We skip straight to the submit step only in the hasTarget case where no extra step is needed.
    if (makeOk && modelOk && yearOk && kmOk && hasTarget) {
      setStep(TIMELINE_STEP);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Timeline + notes
  const [timeline,         setTimeline]         = useState<Timeline>('');
  const [notes,            setNotes]            = useState('');
  const [tradeInRequired,  setTradeInRequired]  = useState<'required' | 'optional'>('optional');

  // Step 1: evidence uploads
  type PhotoSlot = { label: string; required: boolean; file: File | null; url: string | null; uploading: boolean; error: string | null };
  const PHOTO_SLOTS: { key: string; label: string; required: boolean; hint: string }[] = [
    { key: 'license',   label: 'Car Registration / License',  required: true,  hint: 'Clear photo of both sides' },
    { key: 'front',     label: 'Front',                       required: true,  hint: 'Straight-on front view' },
    { key: 'rear',      label: 'Rear',                        required: true,  hint: 'Straight-on rear view' },
    { key: 'driver',    label: 'Driver Side',                 required: true,  hint: 'Full side profile' },
    { key: 'passenger', label: 'Passenger Side',              required: true,  hint: 'Full side profile' },
    { key: 'top',       label: 'Top / Roof',                  required: true,  hint: 'Looking down from above' },
    { key: 'engine',    label: 'Engine Bay',                  required: true,  hint: 'Hood open, engine visible' },
    { key: 'interior',  label: 'Interior / Dashboard',        required: false, hint: 'Full interior view' },
    { key: 'inspection',label: 'Inspection Report',           required: false, hint: 'Optional — any recent report' },
  ];
  const initSlots = (): Record<string, PhotoSlot> =>
    Object.fromEntries(PHOTO_SLOTS.map(s => [s.key, { label: s.label, required: s.required, file: null, url: null, uploading: false, error: null }]));
  const [photoSlots, setPhotoSlots] = useState<Record<string, PhotoSlot>>(initSlots);

  async function handlePhotoSelect(key: string, file: File) {
    if (!token) return;
    setPhotoSlots(prev => ({ ...prev, [key]: { ...prev[key], file, uploading: true, error: null } }));
    try {
      const { url } = await uploadFile(file, token);
      setPhotoSlots(prev => ({ ...prev, [key]: { ...prev[key], uploading: false, url } }));
    } catch {
      setPhotoSlots(prev => ({ ...prev, [key]: { ...prev[key], uploading: false, error: 'Upload failed. Try again.' } }));
    }
  }

  function removePhoto(key: string) {
    setPhotoSlots(prev => ({ ...prev, [key]: { ...prev[key], file: null, url: null, error: null } }));
  }

  function validateStep(): string {
    if (step === 0) {
      if (!curMake || !curModel) return 'Please select make and model of your current car.';
      if (!curYear)  return 'Please select the year.';
      if (!curKm)    return 'Please enter the mileage.';
    }
    if (step === EVIDENCE_STEP) {
      const missing = PHOTO_SLOTS.filter(s => s.required && !photoSlots[s.key]?.url);
      if (missing.length > 0) return `Please upload: ${missing.map(s => s.label).join(', ')}.`;
    }
    if (step === TIMELINE_STEP && !timeline) return 'Please select a timeline.';
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

  async function handleSubmit() {
    const err = validateStep();
    if (err) { setError(err); return; }
    if (!token) {
      router.push(buildLoginRedirect('/login'));
      return;
    }
    setSubmitting(true); setError('');
    try {
      const desiredVehicle = targetCarName || [tgtYear, tgtMake, tgtModel].filter(Boolean).join(' ') || undefined;
      const tradeInLabel = tradeInRequired === 'required'
        ? 'Trade-in: REQUIRED (buyer will not proceed without it)'
        : 'Trade-in: Optional (buyer is open to other arrangements)';
      const notesLines = [tradeInLabel, timeline ? `Timeline: ${timeline}` : '', notes].filter(Boolean).join('\n');
      // collect uploaded photo URLs in order (skip nulls)
      const photoUrls = PHOTO_SLOTS
        .map(s => photoSlots[s.key]?.url ? { label: s.label, url: photoSlots[s.key].url! } : null)
        .filter(Boolean) as { label: string; url: string }[];
      const photoUrlsJson = photoUrls.length > 0 ? JSON.stringify(photoUrls.map(p => p.url)) : undefined;
      await createTradeInRequest({
        make:              curMake,
        class_name:        curModel,
        year:              parseInt(curYear),
        km:                curKm!,
        city:              curCity,
        condition:         curCondition,
        desired_vehicle:   desiredVehicle,
        target_budget_qar: tgtPriceNum || undefined,
        target_car_id:     targetCarId   || undefined,
        target_car_name:   targetCarName || undefined,
        target_price_qar:  targetPriceNum || undefined,
        photo_urls_json:   photoUrlsJson,
        notes:             notesLines || undefined,
      }, token);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Success screen ───────────────────────────────────────────────────────
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
            <p className="text-gray-600 mb-2">
              {targetDealer
                ? <><strong>{targetDealer}</strong> will review your trade-in and send you a package offer.</>
                : 'Verified dealers will review your trade-in request and send you offers.'}
            </p>
            {targetCarName && (
              <div className="bg-green-50 rounded-xl p-3 mb-4 text-left">
                <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-0.5">Target vehicle</p>
                <p className="font-bold text-gray-900 text-sm">{targetCarName}</p>
              </div>
            )}
            <Link href="/my-offers"
              className="block w-full bg-[#003087] text-white font-bold py-3 rounded-lg hover:bg-[#002070] transition-colors mb-3">
              View My Requests
            </Link>
            <Link href="/listings" className="block w-full text-[#003087] font-semibold py-2 text-sm hover:underline">
              Browse More Vehicles
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Back link ────────────────────────────────────────────────────────────
  const backHref = targetCarSlug ? `/cars/${targetCarSlug}` : targetCarId ? '/listings' : '/listings';

  // ─── Main render ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fb]">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">

        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-[#003087] font-semibold mb-6 hover:underline">
          <ArrowLeft size={15} /> {targetCarName ? `Back to ${targetCarName}` : 'Back to Browse'}
        </Link>

        {/* ── Target car banner ── */}
        {hasTarget && (
          <div className="bg-gradient-to-r from-[#003087] to-[#0057b8] text-white rounded-2xl p-5 mb-5 shadow-md">
            <p className="text-xs font-bold text-blue-200 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Tag size={11} /> You are trading toward
            </p>
            <p className="text-xl font-black leading-snug">{targetCarName}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {targetDealer && (
                <span className="flex items-center gap-1 text-blue-200 text-xs font-semibold">
                  <Building2 size={12} /> {targetDealer}
                </span>
              )}
              {targetPriceNum > 0 && (
                <span className="bg-white/20 text-white text-sm font-black px-3 py-1 rounded-full">
                  {formatQAR(targetPriceNum)}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <RefreshCw size={20} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Trade In My Car</h1>
            <p className="text-sm text-gray-500">Get an all-in package offer from the dealer</p>
          </div>
        </div>

        <StepIndicator steps={STEPS} current={step} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" /> {error}
          </div>
        )}

        {/* ── STEP 0: Current vehicle ── */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4 text-base flex items-center gap-2">
                <Car size={16} className="text-[#003087]" /> Your Current Vehicle
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Make *</label>
                  <SearchableMakeSelect value={curMake} onChange={v => { setCurMake(v); setCurModel(''); }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Model *</label>
                  <SearchableModelSelect make={curMake} value={curModel} onChange={setCurModel} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Year *</label>
                  <select value={curYear} onChange={e => setCurYear(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]">
                    <option value="">Select year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
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
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Condition</label>
                  <ConditionPicker value={curCondition} onChange={setCurCondition} />
                </div>
              </div>
            </div>

            {/* ML estimate + diff vs target */}
            {curMake && curModel && curYear && curKm && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Estimated Value</p>
                {estimateLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="w-4 h-4 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" /> Calculating…
                  </div>
                ) : tradeEstimate ? (
                  <>
                    <p className="text-2xl font-black text-green-700">
                      {formatQAR(tradeEstimate[0])} – {formatQAR(tradeEstimate[1])}
                    </p>
                    {targetPriceNum > 0 && (
                      <div className="bg-[#f0f4ff] rounded-xl px-4 py-3">
                        <p className="text-xs font-bold text-[#003087] uppercase tracking-wide mb-1">Est. Amount to Top Up</p>
                        <p className="text-xl font-black text-[#003087]">
                          {(() => {
                            const lo = Math.max(0, Math.round((targetPriceNum - tradeEstimate[1]) / 1000) * 1000);
                            const hi = Math.max(0, Math.round((targetPriceNum - tradeEstimate[0]) / 1000) * 1000);
                            return lo === 0 && hi === 0 ? 'Your trade-in may fully cover it' : `${formatQAR(lo)} – ${formatQAR(hi)}`;
                          })()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Info size={11} /> Indicative. Final depends on dealer inspection.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Could not load estimate.</p>
                )}
              </div>
            )}

            <PriceGuidanceCard make={curMake} class_name={curModel} year={curYear} km={curKm != null ? String(curKm) : ''} city={curCity} />
          </div>
        )}

        {/* ── STEP 1: Photos & Evidence ── */}
        {step === EVIDENCE_STEP && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex gap-3">
              <Camera size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-blue-800 mb-0.5">Upload car evidence</p>
                <p className="text-xs text-blue-600">Required photos help the dealer assess your trade-in remotely and give you a faster, more accurate offer.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {PHOTO_SLOTS.map(slot => {
                const ps = photoSlots[slot.key];
                return (
                  <div key={slot.key} className={`bg-white rounded-xl border-2 p-4 transition-all ${ps.url ? 'border-green-400' : slot.required ? 'border-gray-200' : 'border-dashed border-gray-200'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-gray-900">{slot.label}</p>
                          {slot.required
                            ? <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Required</span>
                            : <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Optional</span>}
                        </div>
                        <p className="text-xs text-gray-400">{slot.hint}</p>
                        {ps.error && <p className="text-xs text-red-500 mt-1">{ps.error}</p>}
                      </div>

                      <div className="shrink-0">
                        {ps.url ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <FileCheck size={16} className="text-green-600" />
                            </div>
                            <button type="button" onClick={() => removePhoto(slot.key)}
                              className="w-7 h-7 bg-gray-100 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors">
                              <X size={14} className="text-gray-400 hover:text-red-500" />
                            </button>
                          </div>
                        ) : ps.uploading ? (
                          <div className="w-8 h-8 border-2 border-[#003087]/20 border-t-[#003087] rounded-full animate-spin" />
                        ) : (
                          <label className="cursor-pointer flex items-center gap-1.5 bg-[#003087] hover:bg-[#002070] text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                            <Upload size={13} />
                            Upload
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) handlePhotoSelect(slot.key, f);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {ps.url && (
                      <div className="mt-2">
                        {ps.file?.type?.startsWith('image/') || ps.url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ps.url} alt={slot.label} className="w-full max-h-32 object-cover rounded-lg border border-green-200" />
                        ) : (
                          <p className="text-xs text-green-700 font-medium truncate">✓ {ps.file?.name ?? 'Uploaded'}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
              <Info size={11} /> Photos are only shared with the dealer who responds to your request.
            </p>
          </div>
        )}

        {/* ── STEP 2 (no target): Desired next vehicle ── */}
        {!hasTarget && step === 2 && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Your Trade-in</p>
              <p className="text-base font-black text-gray-900 mb-3">{curYear} {curMake} {curModel} · {curKm != null ? kmLabel(curKm) : ''}</p>
              {tradeEstimate && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-0.5">Est. Trade-in Value</p>
                  <p className="text-2xl font-black text-green-800">{formatQAR(tradeEstimate[0])} – {formatQAR(tradeEstimate[1])}</p>
                </div>
              )}
            </div>

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
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Budget (QAR)</label>
                    <input type="number" value={tgtPrice} onChange={e => setTgtPrice(e.target.value)} placeholder="e.g. 180000" min={0}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]" />
                  </div>
                </div>
              </div>
            </div>

            {tradeEstimate && tgtPriceNum > 0 && (
              <div className="bg-[#f0f4ff] rounded-xl border border-[#003087]/15 p-4">
                <p className="text-xs font-bold text-[#003087] uppercase tracking-wide mb-2">Estimated Difference</p>
                <p className="text-2xl font-black text-[#003087] mb-1">
                  {(() => {
                    const lo = Math.max(0, Math.round((tgtPriceNum - tradeEstimate[1]) / 1000) * 1000);
                    const hi = Math.max(0, Math.round((tgtPriceNum - tradeEstimate[0]) / 1000) * 1000);
                    return lo === 0 && hi === 0 ? 'Trade-in may fully cover it' : `${formatQAR(lo)} – ${formatQAR(hi)}`;
                  })()}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <Info size={11} /> Indicative. Final depends on dealer inspection.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── TIMELINE step ── */}
        {step === TIMELINE_STEP && !authLoading && !user && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-14 h-14 bg-[#003087]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn size={26} className="text-[#003087]" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Sign in to submit your request</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              Create a free account or sign in to send your trade-in request to the dealer and track its status.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href={buildLoginRedirect('/login')}
                className="flex items-center justify-center gap-2 bg-[#003087] text-white font-bold py-3 rounded-xl hover:bg-[#002070] transition-colors"
              >
                <LogIn size={16} /> Sign In
              </Link>
              <Link
                href={buildLoginRedirect('/login') + '&mode=register'}
                className="flex items-center justify-center gap-2 border-2 border-[#003087] text-[#003087] font-bold py-3 rounded-xl hover:bg-[#003087]/5 transition-colors"
              >
                <UserPlus size={16} /> Create Free Account
              </Link>
            </div>
            <button
              onClick={goBack}
              className="mt-4 text-sm text-gray-400 hover:text-gray-600 font-semibold"
            >
              ← Back to edit
            </button>
          </div>
        )}

        {step === TIMELINE_STEP && (authLoading || user) && (
          <div className="space-y-5">

            {/* Summary card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Request Summary</p>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <Car size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Trade-in vehicle</p>
                    <p className="text-sm font-bold text-gray-900">{curYear} {curMake} {curModel}</p>
                    <p className="text-xs text-gray-500">{curKm != null ? kmLabel(curKm) : ''} · <span className="capitalize">{curCondition}</span></p>
                    {tradeEstimate && (
                      <p className="text-xs font-bold text-green-700 mt-0.5">Est. {formatQAR(tradeEstimate[0])} – {formatQAR(tradeEstimate[1])}</p>
                    )}
                  </div>
                </div>
                {hasTarget && (
                  <div className="flex items-start gap-3 p-3 bg-[#003087]/5 rounded-xl">
                    <Tag size={16} className="text-[#003087] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Target vehicle</p>
                      <p className="text-sm font-bold text-gray-900">{targetCarName}</p>
                      {targetDealer && <p className="text-xs text-gray-500">{targetDealer}</p>}
                      {targetPriceNum > 0 && <p className="text-xs font-bold text-[#003087] mt-0.5">{formatQAR(targetPriceNum)}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-1 text-base">🔄 Is your trade-in required?</h2>
              <p className="text-xs text-gray-500 mb-3">Tell the dealer whether you can only proceed if they accept your trade-in, or if you&apos;re flexible.</p>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setTradeInRequired('required')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${tradeInRequired === 'required' ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-base mb-0.5">🚫</div>
                  <div className="font-bold text-sm text-gray-900">Must trade-in</div>
                  <div className="text-xs text-gray-500 mt-0.5">I will not buy without trading in my car</div>
                </button>
                <button type="button" onClick={() => setTradeInRequired('optional')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${tradeInRequired === 'optional' ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-base mb-0.5">✅</div>
                  <div className="font-bold text-sm text-gray-900">Optional</div>
                  <div className="text-xs text-gray-500 mt-0.5">Open to other arrangements too</div>
                </button>
              </div>
            </div>

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
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notes for the dealer <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="e.g. My car is in great condition, no accidents. Looking for a quick deal."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] resize-none" />
            </div>

            <button type="button" onClick={handleSubmit} disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-base transition-all shadow-md">
              {submitting
                ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                : <><RefreshCw size={18} /> {hasTarget ? `Send Trade-in Request to ${targetDealer || 'Dealer'}` : 'Find Matching Dealers'}</>
              }
            </button>
            <p className="text-center text-xs text-gray-400">Your details are only shared with the responding dealer.</p>
          </div>
        )}

        {/* Hide nav Continue button when showing auth wall */}
        {/* ── Navigation ── */}
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
