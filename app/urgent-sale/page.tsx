'use client';

import { useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Zap, CheckCircle2, ArrowLeft, Clock, TrendingUp, DollarSign,
  Camera, AlertTriangle, Upload, X, ImageIcon, ChevronLeft, ChevronRight,
  CheckCircle, Circle, ShieldCheck,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StepIndicator from '@/components/StepIndicator';
import PriceGuidanceCard from '@/components/PriceGuidanceCard';
import { useAuth } from '@/lib/auth-context';
import { createOfferRequest, uploadFile } from '@/lib/api';
import { SearchableMakeSelect, SearchableModelSelect, KmBucketPicker, KM_BUCKETS, kmLabel } from '@/lib/form-controls';

const CITIES = ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Lusail', 'Umm Salal', 'Al Daayen', 'Al Shamal'];

const URGENCY_OPTIONS = [
  { value: 'leaving_qatar', label: '✈️ Leaving Qatar soon',   desc: 'Need to sell before departure' },
  { value: 'need_cash',     label: '💵 Need cash quickly',    desc: 'Urgent financial need' },
  { value: 'upgrading',     label: '🚗 Upgrading my car',     desc: 'Already found a new car' },
  { value: 'other',         label: '📝 Other reason',         desc: "I'll explain to the dealer" },
] as const;

const PRIORITY_OPTIONS = [
  { value: 'speed',    icon: Clock,       label: 'Fastest Sale',  desc: 'Accept a slightly lower offer to close in days',      color: 'text-orange-500', border: 'border-orange-400 bg-orange-50' },
  { value: 'balanced', icon: TrendingUp,  label: 'Balanced',      desc: 'Good price AND fast turnaround',                      color: 'text-blue-600',   border: 'border-blue-400 bg-blue-50' },
  { value: 'price',    icon: DollarSign,  label: 'Best Price',    desc: 'Wait for the highest offer, time permitting',         color: 'text-green-600',  border: 'border-green-400 bg-green-50' },
] as const;

const STEPS = ['Car details', 'Urgency', 'Evidence', 'Contact & Submit'];

type EvidenceCategory = 'exterior' | 'interior' | 'odometer' | 'registration' | 'inspection';

const EVIDENCE_CATEGORIES: {
  key: EvidenceCategory;
  icon: string;
  label: string;
  why: string;
  priority: 'Required' | 'Recommended' | 'Optional';
}[] = [
  { key: 'exterior',     icon: '📸', label: 'Exterior Photos',   why: 'All 4 sides — helps dealers assess body condition immediately',  priority: 'Required' },
  { key: 'interior',     icon: '🪑', label: 'Interior Photos',   why: 'Front + rear seats — shows wear, cleanliness, and dashboard',   priority: 'Required' },
  { key: 'odometer',     icon: '🔢', label: 'Odometer Close-up', why: 'Confirms actual mileage — dealers verify this before bidding',   priority: 'Required' },
  { key: 'registration', icon: '📄', label: 'Registration Card', why: 'Confirms VIN, ownership, and service history',                  priority: 'Recommended' },
  { key: 'inspection',   icon: '🔧', label: 'Inspection Report', why: 'Significantly increases dealer confidence and bid amounts',      priority: 'Optional' },
];

const REQUIRED_CATEGORIES: EvidenceCategory[] = ['exterior', 'interior', 'odometer'];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 25 }, (_, i) => CURRENT_YEAR - i);

type UrgencyReason = 'leaving_qatar' | 'need_cash' | 'upgrading' | 'other';
type SellPriority  = 'speed' | 'price' | 'balanced';

interface FormState {
  make: string; class_name: string; year: string; km: number | null;
  condition: string; city: string;
  contact_name: string; contact_phone: string;
  urgency_reason: UrgencyReason | '';
  sell_priority:  SellPriority  | '';
}

function UrgentSaleContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const { token, ensureGuestToken } = useAuth();

  // Pre-fill from valuation query params
  const initKmStr = params.get('km') ?? '';
  const initKmNum = initKmStr ? parseInt(initKmStr) : null;
  // Snap incoming km to nearest bucket so KmBucketPicker shows a selection
  const snapKm = (raw: number | null): number | null => {
    if (!raw) return null;
    const sorted = [...KM_BUCKETS].sort((a, b) => Math.abs(a.value - raw) - Math.abs(b.value - raw));
    return sorted[0]?.value ?? null;
  };

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    make: params.get('make') ?? '', class_name: params.get('class_name') ?? '',
    year: params.get('year') ?? '', km: snapKm(initKmNum),
    condition: 'good', city: params.get('city') ?? 'Doha',
    contact_name: '', contact_phone: '',
    urgency_reason: '', sell_priority: 'balanced',
  });
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dealerCount] = useState(Math.floor(Math.random() * 8) + 10);

  // Evidence state — per-category files + accident count
  const [categoryFiles, setCategoryFiles] = useState<Partial<Record<EvidenceCategory, File>>>({});
  const [accidentCount, setAccidentCount] = useState('0');
  const [activeCategory, setActiveCategory] = useState<EvidenceCategory | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Legacy generic upload kept for any extra photos
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragActive,    setDragActive]    = useState(false);
  const extraFileRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    setUploadedFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...imgs.filter(f => !existing.has(f.name + f.size))].slice(0, 20);
    });
  }, []);
  const removeFile = (idx: number) => setUploadedFiles(prev => prev.filter((_, i) => i !== idx));

  function openCategoryPicker(cat: EvidenceCategory) {
    setActiveCategory(cat);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }

  function handleCategoryFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && activeCategory) {
      setCategoryFiles(prev => ({ ...prev, [activeCategory]: file }));
    }
    e.target.value = '';
  }

  const requiredComplete = REQUIRED_CATEGORIES.filter(k => !!categoryFiles[k]).length;
  const totalComplete    = EVIDENCE_CATEGORIES.filter(c => !!categoryFiles[c.key]).length;

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function validateStep(): string {
    if (step === 0) {
      if (!form.make || !form.class_name) return 'Please select make and model.';
      if (!form.year) return 'Please select the year.';
      if (!form.km)   return 'Please enter the mileage.';
    }
    if (step === 1) {
      if (!form.urgency_reason) return 'Please select why you need to sell quickly.';
    }
    if (step === 2) {
      if (requiredComplete < REQUIRED_CATEGORIES.length)
        return `Please upload at least: Exterior, Interior, and Odometer photos (${requiredComplete}/${REQUIRED_CATEGORIES.length} done).`;
    }
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
    setError('');
    setLoading(true);
    try {
      const authToken = token ?? (await ensureGuestToken());

      // Collect all files: categorized first, then any extra generic uploads
      const allFiles = [
        ...Object.values(categoryFiles).filter((f): f is File => !!f),
        ...uploadedFiles,
      ];

      let photoUrlsJson: string | undefined;
      if (allFiles.length > 0) {
        const uploadResults = await Promise.allSettled(
          allFiles.map(f => uploadFile(f, authToken))
        );
        const urls = uploadResults
          .filter((r): r is PromiseFulfilledResult<{ url: string }> => r.status === 'fulfilled' && !!r.value?.url)
          .map(r => r.value.url);
        if (urls.length > 0) photoUrlsJson = JSON.stringify(urls);
      }

      const accidentNote = accidentCount !== '0' ? `Accidents: ${accidentCount}` : '';

      await createOfferRequest({
        make: form.make, class_name: form.class_name,
        year: parseInt(form.year),
        km:   form.km ?? 0,
        condition: form.condition, city: form.city,
        contact_name:  form.contact_name  || undefined,
        contact_phone: form.contact_phone || undefined,
        photo_urls_json: photoUrlsJson,
        description: accidentNote || undefined,
        is_urgent:      true,
        lead_type:      'urgent_sale',
        urgency_reason: form.urgency_reason as UrgencyReason,
        sell_priority:  form.sell_priority  as SellPriority,
      }, authToken);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 bg-gradient-to-br from-[#003087] to-[#001a52] flex items-center justify-center px-4 py-16">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-green-500" size={36} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">You&apos;re in the queue! 🚀</h2>
            <p className="text-gray-600 mb-4">
              Your request was sent to <span className="font-bold text-[#003087]">{dealerCount} verified dealers</span>.
              They&apos;ll compete to give you the best offer fast.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 text-sm text-orange-800">
              <p className="font-semibold mb-1">⚡ What happens next</p>
              <ul className="text-left space-y-1 list-disc list-inside">
                <li>Dealers review your listing within minutes</li>
                <li>You&apos;ll receive bids in your dashboard</li>
                <li>Accept the offer that works for you</li>
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/my-offers" className="w-full bg-[#003087] text-white font-bold py-3 rounded-lg hover:bg-[#002070] transition-colors">View My Offers</Link>
              <button onClick={() => router.push('/')} className="w-full text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors">Back to Home</button>
            </div>
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

        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-[#ff6600] rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Sell My Car Fast</h1>
            <p className="text-sm text-gray-500">Get dealer offers within hours</p>
          </div>
        </div>

        <StepIndicator steps={STEPS} current={step} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" /> {error}
          </div>
        )}

        {/* STEP 0: Car details */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4 text-base">🚗 Your Car</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Make *</label>
                  <SearchableMakeSelect value={form.make} onChange={v => { set('make', v); set('class_name', ''); }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Model *</label>
                  <SearchableModelSelect make={form.make} value={form.class_name} onChange={v => set('class_name', v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Year *</label>
                    <select value={form.year} onChange={e => set('year', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]">
                      <option value="">Year</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mileage (km) *</label>
                  <KmBucketPicker value={form.km} onChange={v => setForm(prev => ({ ...prev, km: v }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Condition</label>
                    <select value={form.condition} onChange={e => set('condition', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]">
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">City</label>
                    <select value={form.city} onChange={e => set('city', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]">
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <PriceGuidanceCard make={form.make} class_name={form.class_name} year={form.year} km={form.km != null ? String(form.km) : ''} city={form.city} />
          </div>
        )}

        {/* STEP 1: Urgency */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4 text-base">⚡ Why are you selling quickly?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {URGENCY_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => set('urgency_reason', opt.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${form.urgency_reason === opt.value ? 'border-[#ff6600] bg-orange-50' : 'border-gray-200 hover:border-[#ff6600]/50'}`}>
                    <div className="font-semibold text-sm text-gray-900">{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4 text-base">🎯 What matters most to you?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PRIORITY_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  return (
                    <button key={opt.value} type="button" onClick={() => set('sell_priority', opt.value)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${form.sell_priority === opt.value ? opt.border : 'border-gray-200 hover:border-gray-300'}`}>
                      <Icon size={18} className={`mb-2 ${opt.color}`} />
                      <div className="font-semibold text-sm text-gray-900">{opt.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Evidence */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Hidden per-category file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCategoryFile}
            />

            {/* Header + progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-1 text-base flex items-center gap-2">
                <Camera size={18} className="text-[#003087]" /> Evidence Package
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Dealers need photos to evaluate your car and place confident bids.
              </p>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-700">
                    {requiredComplete === REQUIRED_CATEGORIES.length
                      ? <span className="flex items-center gap-1 text-green-600"><ShieldCheck size={13} /> Required photos complete</span>
                      : <span className="text-gray-500">{requiredComplete}/{REQUIRED_CATEGORIES.length} required photos</span>
                    }
                  </span>
                  <span className="text-gray-400">{totalComplete} of {EVIDENCE_CATEGORIES.length} uploaded</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${requiredComplete === REQUIRED_CATEGORIES.length ? 'bg-green-500' : 'bg-[#ff6600]'}`}
                    style={{ width: `${(requiredComplete / REQUIRED_CATEGORIES.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Category checklist */}
              <div className="space-y-3">
                {EVIDENCE_CATEGORIES.map(cat => {
                  const file = categoryFiles[cat.key];
                  const isUploaded = !!file;
                  const isRequired = cat.priority === 'Required';
                  return (
                    <div
                      key={cat.key}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isUploaded
                          ? 'border-green-200 bg-green-50'
                          : isRequired
                          ? 'border-orange-100 bg-orange-50/50'
                          : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      {/* Status icon */}
                      <div className="shrink-0">
                        {isUploaded
                          ? <CheckCircle size={20} className="text-green-500" />
                          : <Circle size={20} className={isRequired ? 'text-orange-300' : 'text-gray-300'} />
                        }
                      </div>

                      {/* Label + why */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base leading-none">{cat.icon}</span>
                          <span className="text-sm font-semibold text-gray-900">{cat.label}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            cat.priority === 'Required'    ? 'bg-red-100 text-red-600'    :
                            cat.priority === 'Recommended' ? 'bg-orange-100 text-orange-600' :
                            'bg-gray-100 text-gray-500'
                          }`}>{cat.priority}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{cat.why}</p>
                        {isUploaded && (
                          <p className="text-[11px] text-green-600 mt-0.5 font-medium truncate">{file.name}</p>
                        )}
                      </div>

                      {/* Upload/change button + preview */}
                      <div className="shrink-0 flex items-center gap-2">
                        {isUploaded && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={URL.createObjectURL(file)}
                            alt={cat.label}
                            className="w-10 h-10 rounded-lg object-cover border border-green-200"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => openCategoryPicker(cat.key)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                            isUploaded
                              ? 'border-green-300 text-green-700 hover:bg-green-100'
                              : 'border-[#003087] text-[#003087] hover:bg-[#f0f4ff]'
                          }`}
                        >
                          {isUploaded ? 'Change' : 'Upload'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Accident count */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-2">
                ⚠️ Accident History
              </h3>
              <p className="text-xs text-gray-400 mb-3">Dealers verify this — honesty builds trust and speeds up offers.</p>
              <div className="flex gap-2">
                {['0', '1', '2', '3+'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAccidentCount(val)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                      accidentCount === val
                        ? val === '0' ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-orange-400 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-2 text-center">
                {accidentCount === '0' ? '✅ No accidents — highest dealer confidence' :
                 accidentCount === '1' ? 'Minor incidents reduce bid amounts slightly' :
                 '⚠️ Multiple accidents — please include inspection report'}
              </p>
            </div>

            {/* Extra photos drag-drop */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <ImageIcon size={15} className="text-gray-400" /> Additional Photos (optional)
              </h3>
              <div
                className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer ${dragActive ? 'border-[#003087] bg-[#eef3ff]' : 'border-gray-200 bg-gray-50 hover:border-[#003087]/60'}`}
                onDragEnter={e => { e.preventDefault(); setDragActive(true); }}
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={e => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => extraFileRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                  <Upload size={22} className={`mb-1.5 ${dragActive ? 'text-[#003087]' : 'text-gray-300'}`} />
                  <p className="text-xs text-gray-500">{dragActive ? 'Drop files here' : 'Drag more photos or tap to add'}</p>
                </div>
                <input ref={extraFileRef} type="file" multiple accept="image/*" capture="environment" className="hidden" onChange={e => handleFiles(e.target.files)} />
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600">{uploadedFiles.length} extra photo{uploadedFiles.length !== 1 ? 's' : ''}</span>
                    <button type="button" className="text-xs text-red-400 hover:text-red-600" onClick={() => setUploadedFiles([])}>Remove all</button>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden aspect-square bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                        <button type="button" className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeFile(idx)}>
                          <X size={11} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Gate warning */}
            {requiredComplete < REQUIRED_CATEGORIES.length && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">
                  Upload <strong>Exterior, Interior, and Odometer</strong> photos to continue.
                  Listings with full evidence receive <strong>3× more dealer bids</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Contact + Submit */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-1 text-base">📞 Your Contact (Optional)</h2>
              <p className="text-xs text-gray-500 mb-4">Only shared with dealers you personally approve</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Your name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="+974 XXXX XXXX"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]" />
                </div>
              </div>
            </div>
            <div className="bg-[#f0f4ff] rounded-xl border border-[#003087]/15 p-4">
              <p className="text-xs font-bold text-[#003087] uppercase tracking-wide mb-2">Submission Summary</p>
              <div className="text-sm text-gray-700 space-y-0.5">
                <p><span className="text-gray-400">Car:</span> {form.year} {form.make} {form.class_name}</p>
                <p><span className="text-gray-400">Mileage:</span> {form.km != null ? kmLabel(form.km) : '—'}</p>
                <p><span className="text-gray-400">Reason:</span> {URGENCY_OPTIONS.find(o => o.value === form.urgency_reason)?.label}</p>
                <p><span className="text-gray-400">Photos:</span> {Object.values(categoryFiles).filter(Boolean).length + uploadedFiles.length} attached</p>
                <p><span className="text-gray-400">Accidents:</span> {accidentCount}</p>
              </div>
            </div>
            <button type="button" onClick={handleSubmit} disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#ff6600] hover:bg-[#e05a00] text-white font-bold py-4 rounded-xl text-base transition-all disabled:opacity-60 shadow-md">
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Zap size={18} /> Submit — Get Dealer Offers</>}
            </button>
            <p className="text-center text-xs text-gray-400">No fees. Non-binding. You approve every dealer before they contact you.</p>
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

export default function UrgentSalePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f4f6fb] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#ff6600] border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    }>
      <UrgentSaleContent />
    </Suspense>
  );
}
