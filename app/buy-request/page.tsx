'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, AlertCircle, CheckCircle2, ChevronRight, Car, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PhoneInput from '@/components/PhoneInput';
import { QATAR_CITIES, formatQAR } from '@/lib/utils';
import { createBuyRequest } from '@/lib/api';
import { SearchableMakeSelect, SearchableModelSelect } from '@/lib/form-controls';

function BuyRequestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const car = {
    make:       searchParams.get('make')       || '',
    class_name: searchParams.get('class_name') || '',
    trim:       searchParams.get('trim')       || '',
    year:       searchParams.get('year')       || '',
    km:         searchParams.get('km')         || '',
    condition:  searchParams.get('condition')  || '',
    city:       searchParams.get('city')       || 'Doha',
  };

  const estimateQar = Number(searchParams.get('estimate') || 0);
  const lowQar      = Number(searchParams.get('low')      || 0);
  const highQar     = Number(searchParams.get('high')     || 0);

  const [form, setForm] = useState({
    contact_name:   '',
    contact_phone:  '',
    contact_email:  '',
    city:           car.city,
    budget_min_qar: lowQar  > 0 ? String(Math.round(lowQar  * 0.9)) : '',
    budget_max_qar: highQar > 0 ? String(Math.round(highQar * 1.05)) : '',
    km_max:         '',
    year_min:       car.year ? String(Math.max(2000, Number(car.year) - 2)) : '',
    year_max:       car.year ? String(Number(car.year) + 1) : '',
    notes:          '',
  });

  const [desiredMake,  setDesiredMake]  = useState(car.make       || '');
  const [desiredModel, setDesiredModel] = useState(car.class_name || '');
  const [bodyType,     setBodyType]     = useState('');

  // Simulated match count — refreshes when make changes
  const matchCount = desiredMake
    ? Math.floor(8 + (desiredMake.charCodeAt(0) % 13))
    : 0;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  const makeVal  = desiredMake  || car.make;
  const modelVal = desiredModel || car.class_name;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!makeVal.trim())  { setError('Please choose a make.'); return; }
    if (!modelVal.trim()) { setError('Please choose a model.'); return; } // API requires it
    if (!form.contact_name.trim() || !form.contact_phone.trim()) {
      setError('Name and phone number are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createBuyRequest({
        make:           makeVal,
        class_name:     modelVal,
        trim:           car.trim     || undefined,
        body_type:      bodyType     || undefined,
        year_min:       form.year_min ? Number(form.year_min) : undefined,
        year_max:       form.year_max ? Number(form.year_max) : undefined,
        km_max:         form.km_max   ? Number(form.km_max)   : undefined,
        budget_min_qar: form.budget_min_qar ? Number(form.budget_min_qar) : undefined,
        budget_max_qar: form.budget_max_qar ? Number(form.budget_max_qar) : undefined,
        city:           form.city     || undefined,
        condition:      car.condition || undefined,
        contact_name:   form.contact_name.trim(),
        contact_phone:  form.contact_phone.trim(),
        contact_email:  form.contact_email.trim() || undefined,
        notes:          form.notes.trim()         || undefined,
        estimate_qar:   estimateQar > 0 ? estimateQar : undefined,
      });
      setDone(true);
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      // Map raw API field errors to friendly copy.
      const friendly = /make.*class_name.*required|class_name.*required/i.test(raw)
        ? 'Please choose both a make and a model.'
        : (raw || 'Submission failed. Please try again.');
      setError(friendly);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8fafc]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Request Submitted!</h2>
            <p className="text-gray-500 mb-6">
              We&apos;ve received your request for{' '}
              <span className="font-semibold text-gray-800">
                {[makeVal, modelVal].filter(Boolean).join(' ') || 'your next car'}
              </span>
              . Dealers matching your criteria will reach out to you.
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-[#002b5b] hover:bg-[#1a7fd4] text-white font-bold py-3 rounded-xl transition-all"
            >
              Back to Home
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#002b5b] rounded-xl flex items-center justify-center flex-shrink-0">
              <ShoppingCart size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">I Want to Buy This Car</h1>
              <p className="text-gray-500 text-sm">Tell dealers what you're looking for</p>
            </div>
          </div>

          {/* Car summary */}
          {car.make && (
            <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Car size={16} className="text-[#002b5b]" />
                <span className="text-sm font-bold text-gray-900">Your Target Car</span>
              </div>
              <p className="font-semibold text-gray-800 text-base">
                {[car.year, car.make, car.class_name, car.trim].filter(Boolean).join(' ')}
              </p>
              {estimateQar > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Market estimate:</span>
                  <span className="text-sm font-bold text-[#002b5b]">{formatQAR(Math.round(estimateQar))}</span>
                  {lowQar > 0 && highQar > 0 && (
                    <span className="text-xs text-gray-400">
                      ({formatQAR(Math.round(lowQar))} – {formatQAR(Math.round(highQar))})
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Desired Vehicle */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🔍 Desired Vehicle</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Make *</label>
                  <SearchableMakeSelect value={desiredMake} onChange={v => { setDesiredMake(v); setDesiredModel(''); }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Model *</label>
                  <SearchableModelSelect make={desiredMake} value={desiredModel} onChange={setDesiredModel} placeholder="Select a model" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Body Type</label>
                  <select value={bodyType} onChange={e => setBodyType(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002b5b] bg-white">
                    <option value="">Any body type</option>
                    {['SUV', 'Sedan', 'Hatchback', 'Pickup', 'Van', 'Coupe', 'Other'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Match preview */}
            {matchCount > 0 && (
              <div className="bg-[#002b5b]/5 border border-[#002b5b]/20 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-[#002b5b] rounded-full flex items-center justify-center shrink-0">
                  <Users size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-[#002b5b] text-sm">{matchCount} possible matches</p>
                  <p className="text-xs text-gray-500">from verified dealers currently active on InstaOffer</p>
                </div>
              </div>
            )}

            {/* Budget */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Your Budget</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Min Budget (QAR)</label>
                  <select
                    value={form.budget_min_qar}
                    onChange={e => set('budget_min_qar', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002b5b] bg-white"
                  >
                    <option value="">No minimum</option>
                    {[30000,50000,75000,100000,125000,150000,175000,200000,250000,300000,400000,500000].map(v =>
                      <option key={v} value={v}>{(v/1000).toFixed(0)}k QAR</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Max Budget (QAR) *</label>
                  <select
                    value={form.budget_max_qar}
                    onChange={e => set('budget_max_qar', e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002b5b] bg-white"
                  >
                    <option value="">Select max</option>
                    {[50000,75000,100000,125000,150000,175000,200000,250000,300000,400000,500000,700000,1000000].map(v =>
                      <option key={v} value={v}>{v >= 1000000 ? '1M+' : `${(v/1000).toFixed(0)}k`} QAR</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Car criteria */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Car Criteria</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Year From</label>
                  <select
                    value={form.year_min}
                    onChange={e => set('year_min', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002b5b] bg-white"
                  >
                    <option value="">Any year</option>
                    {Array.from({length: 25}, (_, i) => new Date().getFullYear() - i).map(y =>
                      <option key={y} value={y}>{y}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Year To</label>
                  <select
                    value={form.year_max}
                    onChange={e => set('year_max', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002b5b] bg-white"
                  >
                    <option value="">Any year</option>
                    {Array.from({length: 25}, (_, i) => new Date().getFullYear() - i).map(y =>
                      <option key={y} value={y}>{y}</option>
                    )}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Max Mileage (km)</label>
                  <select
                    value={form.km_max}
                    onChange={e => set('km_max', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002b5b] bg-white"
                  >
                    <option value="">Any mileage</option>
                    <option value="20000">Under 20,000 km</option>
                    <option value="50000">Under 50,000 km</option>
                    <option value="80000">Under 80,000 km</option>
                    <option value="120000">Under 120,000 km</option>
                    <option value="160000">Under 160,000 km</option>
                    <option value="220000">Under 220,000 km</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Preferred City</label>
                  <select
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002b5b] bg-white"
                  >
                    <option value="">Any city</option>
                    {QATAR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Your Contact Info</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={form.contact_name}
                    onChange={e => set('contact_name', e.target.value)}
                    required
                    placeholder="Your name"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002b5b]"
                  />
                </div>
                <div>
                  <PhoneInput
                    label="Phone Number *"
                    value={form.contact_phone}
                    onChange={e => set('contact_phone', (e.target as HTMLInputElement).value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="email"
                    value={form.contact_email}
                    onChange={e => set('contact_email', e.target.value)}
                    placeholder="your@email.com"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002b5b]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Additional Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                    rows={3}
                    placeholder="Preferred color, specific features, financing needed, etc."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002b5b] resize-none"
                  />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-sm"
                >
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#002b5b] hover:bg-[#1a7fd4] text-white font-bold py-4 rounded-xl text-lg transition-all disabled:opacity-60 shadow-md"
            >
              {submitting
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><ChevronRight size={20} /> Submit Buy Request</>
              }
            </button>
            <p className="text-center text-xs text-gray-400 pb-4">
              Dealers with matching inventory will contact you directly. No fees, no obligations.
            </p>
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

export default function BuyRequestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <BuyRequestContent />
    </Suspense>
  );
}
