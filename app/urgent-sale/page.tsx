'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap, CheckCircle2, ArrowLeft, Clock, TrendingUp, DollarSign,
  Camera, AlertTriangle, Upload, X, ImageIcon, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StepIndicator from '@/components/StepIndicator';
import PriceGuidanceCard from '@/components/PriceGuidanceCard';
import { useAuth } from '@/lib/auth-context';
import { createOfferRequest } from '@/lib/api';
import { SearchableMakeSelect, SearchableModelSelect } from '@/lib/form-controls';

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

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 25 }, (_, i) => CURRENT_YEAR - i);

type UrgencyReason = 'leaving_qatar' | 'need_cash' | 'upgrading' | 'other';
type SellPriority  = 'speed' | 'price' | 'balanced';

interface FormState {
  make: string; class_name: string; year: string; km: string;
  condition: string; city: string;
  contact_name: string; contact_phone: string;
  urgency_reason: UrgencyReason | '';
  sell_priority:  SellPriority  | '';
}

export default function UrgentSalePage() {
  const router  = useRouter();
  const { token, ensureGuestToken } = useAuth();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    make: '', class_name: '', year: '', km: '',
    condition: 'good', city: 'Doha',
    contact_name: '', contact_phone: '',
    urgency_reason: '', sell_priority: 'balanced',
  });
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dealerCount] = useState(Math.floor(Math.random() * 8) + 10);

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragActive,    setDragActive]    = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    setUploadedFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...imgs.filter(f => !existing.has(f.name + f.size))].slice(0, 20);
    });
  }, []);
  const removeFile = (idx: number) => setUploadedFiles(prev => prev.filter((_, i) => i !== idx));

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
      await createOfferRequest({
        make: form.make, class_name: form.class_name,
        year: parseInt(form.year),
        km:   parseInt(form.km.replace(/,/g, '')),
        condition: form.condition, city: form.city,
        contact_name:  form.contact_name  || undefined,
        contact_phone: form.contact_phone || undefined,
        is_urgent:      true,
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
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mileage (km) *</label>
                    <input type="number" value={form.km} onChange={e => set('km', e.target.value)} placeholder="e.g. 75000" min={0}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]" />
                  </div>
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
            <PriceGuidanceCard make={form.make} class_name={form.class_name} year={form.year} km={form.km} city={form.city} />
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-1 text-base flex items-center gap-2">
              <Camera size={18} className="text-[#003087]" /> Evidence Package
            </h2>
            <p className="text-xs text-gray-500 mb-4">Listings with photos receive <strong>3× more bids</strong>.</p>
            <div
              className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer ${dragActive ? 'border-[#003087] bg-[#eef3ff]' : 'border-gray-300 bg-gray-50 hover:border-[#003087]/60'}`}
              onDragEnter={e => { e.preventDefault(); setDragActive(true); }}
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={e => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Upload size={28} className={`mb-2 ${dragActive ? 'text-[#003087]' : 'text-gray-400'}`} />
                <p className="font-semibold text-sm text-gray-700">{dragActive ? 'Drop files here' : 'Drag photos here or tap to upload'}</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, HEIC · Up to 20 photos</p>
              </div>
              <input ref={fileInputRef} type="file" multiple accept="image/*" capture="environment" className="hidden" onChange={e => handleFiles(e.target.files)} />
            </div>
            <button type="button" onClick={() => { if (fileInputRef.current) { fileInputRef.current.removeAttribute('capture'); fileInputRef.current.click(); setTimeout(() => fileInputRef.current?.setAttribute('capture', 'environment'), 500); } }}
              className="mt-3 flex items-center justify-center gap-2 w-full border border-[#003087] text-[#003087] font-semibold py-2.5 rounded-xl text-sm hover:bg-[#f0f4ff] transition-colors">
              <Camera size={16} /> Take Photo with Camera
            </button>
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <ImageIcon size={15} className="text-[#003087]" /> {uploadedFiles.length} photo{uploadedFiles.length !== 1 ? 's' : ''} ready
                  </span>
                  <button type="button" className="text-xs text-red-400 hover:text-red-600" onClick={() => setUploadedFiles([])}>Remove all</button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
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
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">What to include</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { icon: '📸', label: 'Exterior (all 4 sides)', priority: 'Required' },
                  { icon: '🪑', label: 'Interior (front + rear)', priority: 'Required' },
                  { icon: '🔢', label: 'Odometer close-up', priority: 'Required' },
                  { icon: '📄', label: 'Registration card', priority: 'Recommended' },
                  { icon: '🔧', label: 'Inspection report', priority: 'Optional' },
                  { icon: '⚠️', label: 'Accident history note', priority: 'Optional' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-xs text-gray-600">
                    <span>{item.icon}</span><span className="flex-1">{item.label}</span>
                    <span className={`font-medium text-[10px] ${item.priority === 'Required' ? 'text-red-500' : item.priority === 'Recommended' ? 'text-orange-500' : 'text-gray-400'}`}>{item.priority}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">Listings with exterior + interior + odometer receive <strong>3× more bids</strong>.</p>
            </div>
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
                <p><span className="text-gray-400">Mileage:</span> {parseInt((form.km || '0').replace(/,/g, '')).toLocaleString()} km</p>
                <p><span className="text-gray-400">Reason:</span> {URGENCY_OPTIONS.find(o => o.value === form.urgency_reason)?.label}</p>
                <p><span className="text-gray-400">Photos:</span> {uploadedFiles.length} attached</p>
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
