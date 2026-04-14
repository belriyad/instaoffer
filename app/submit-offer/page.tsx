'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Upload, ChevronRight, AlertCircle, CheckCircle2, Car, Edit2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { createOfferRequest } from '@/lib/api';
import { CONDITIONS, QATAR_CITIES, formatKM } from '@/lib/utils';

function SubmitOfferContent() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ── Pre-filled from valuation wizard ──────────────────────────────────────
  const prefill = {
    make:       searchParams.get('make')       || '',
    class_name: searchParams.get('class_name') || '',
    model:      searchParams.get('model')      || '',
    trim:       searchParams.get('trim')       || '',
    year:       searchParams.get('year')       || '',
    km:         searchParams.get('km')         || '',
    condition:  searchParams.get('condition')  || 'good',
    city:       searchParams.get('city')       || 'Doha',
  };
  const hasPrefill = !!(prefill.make && prefill.class_name && prefill.year && prefill.km);

  // ── Extra fields only the submit form needs ────────────────────────────────
  const [extras, setExtras] = useState({
    color:            '',
    description:      '',
    asking_price_qar: '',
    contact_phone:    '',
    has_inspection:   false,
  });

  // ── Editable overrides of pre-filled values ────────────────────────────────
  const [overrides, setOverrides] = useState({
    make:       prefill.make,
    class_name: prefill.class_name,
    model:      prefill.model,
    year:       prefill.year,
    km:         prefill.km,
    condition:  prefill.condition,
    city:       prefill.city,
  });

  useEffect(() => {
    if (!loading && !user) {
      const params = new URLSearchParams(searchParams.toString());
      router.push(`/login?redirect=/submit-offer${params.toString() ? '&' + params.toString() : ''}`);
    }
  }, [user, loading, router, searchParams]);

  function setExtra(key: keyof typeof extras, value: string | boolean) {
    setExtras(e => ({ ...e, [key]: value }));
  }

  function setOverride(key: keyof typeof overrides, value: string) {
    setOverrides(o => ({ ...o, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!overrides.make || !overrides.class_name || !overrides.year || !overrides.km) {
      setError('Please fill in all required car details.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await createOfferRequest({
        make:             overrides.make,
        class_name:       overrides.class_name,
        model:            overrides.model || undefined,
        year:             Number(overrides.year),
        km:               Number(overrides.km),
        color:            extras.color || undefined,
        condition:        overrides.condition,
        city:             overrides.city,
        description:      extras.description || undefined,
        asking_price_qar: extras.asking_price_qar ? Number(extras.asking_price_qar) : undefined,
        contact_phone:    extras.contact_phone || undefined,
      }, token);
      router.push(`/my-offers?submitted=${result.request.request_uid}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Request Dealer Offers</h1>
          <p className="text-gray-500 mb-6">
            {hasPrefill
              ? 'Your car details are pre-filled from your valuation. Just review and add a few extras.'
              : 'Fill in your car details so dealers can send you real offers.'}
          </p>

          {/* Privacy notice */}
          <div className="bg-[#e8f0fd] border border-[#003087]/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <Shield size={20} className="text-[#003087] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[#003087]/90">
              <strong>Your phone number stays private.</strong> Dealers can only see it after you approve.
              All offers are non-binding and subject to inspection.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── Pre-filled summary card ─────────────────────────────────── */}
            {hasPrefill ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Car size={18} className="text-[#003087]" /> Your Car
                  </h2>
                  <button
                    type="button"
                    onClick={() => router.push('/valuation')}
                    className="flex items-center gap-1.5 text-sm text-[#003087] hover:underline"
                  >
                    <Edit2 size={14} /> Edit valuation
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Make',      value: overrides.make },
                    { label: 'Model',     value: overrides.class_name },
                    { label: 'Year',      value: overrides.year },
                    { label: 'Mileage',   value: overrides.km ? formatKM(Number(overrides.km)) : '' },
                    { label: 'Condition', value: overrides.condition },
                    { label: 'City',      value: overrides.city },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                      <div className="font-semibold text-gray-900 text-sm capitalize">{value || '—'}</div>
                    </div>
                  ))}
                </div>

                {/* Condition override */}
                <div className="border-t border-gray-100 pt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Condition
                    <span className="text-gray-400 font-normal ml-1">(change if needed)</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CONDITIONS.map(c => (
                      <button
                        type="button"
                        key={c.value}
                        onClick={() => setOverride('condition', c.value)}
                        className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                          overrides.condition === c.value
                            ? 'border-[#003087] bg-[#e8f0fd] text-[#003087]'
                            : 'border-gray-200 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Full manual form when no prefill ───────────────────────── */
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Car Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Make *</label>
                    <input type="text" value={overrides.make} onChange={e => setOverride('make', e.target.value)} required placeholder="e.g. Toyota" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Model *</label>
                    <input type="text" value={overrides.class_name} onChange={e => setOverride('class_name', e.target.value)} required placeholder="e.g. Land Cruiser" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Year *</label>
                    <input type="number" value={overrides.year} onChange={e => setOverride('year', e.target.value)} required placeholder="e.g. 2020" min="1990" max={new Date().getFullYear() + 1} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mileage (km) *</label>
                    <input type="number" value={overrides.km} onChange={e => setOverride('km', e.target.value)} required min="0" placeholder="e.g. 85000" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">City *</label>
                    <select value={overrides.city} onChange={e => setOverride('city', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]">
                      {QATAR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Condition *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {CONDITIONS.map(c => (
                        <button type="button" key={c.value} onClick={() => setOverride('condition', c.value)} className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${overrides.condition === c.value ? 'border-[#003087] bg-[#e8f0fd] text-[#003087]' : 'border-gray-200 text-gray-700'}`}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Extra details ───────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                Additional Details
                <span className="text-sm text-gray-400 font-normal ml-2">— helps get better offers</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color</label>
                  <input type="text" value={extras.color} onChange={e => setExtra('color', e.target.value)} placeholder="e.g. White" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Asking Price (QAR) <span className="text-gray-400 font-normal">optional</span>
                  </label>
                  <input type="number" value={extras.asking_price_qar} onChange={e => setExtra('asking_price_qar', e.target.value)} placeholder="Leave blank to let dealers bid freely" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes for Dealers</label>
                  <textarea value={extras.description} onChange={e => setExtra('description', e.target.value)} rows={3} placeholder="Service history, accident history, modifications, recent repairs, etc." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087] resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Phone Number <span className="text-gray-400 font-normal">(stays private)</span>
                  </label>
                  <input type="tel" value={extras.contact_phone} onChange={e => setExtra('contact_phone', e.target.value)} placeholder="+974 XXXX XXXX" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]" />
                </div>
                {/* Inspection report toggle */}
                <div className="flex items-center gap-3 sm:col-span-2 bg-gray-50 rounded-xl p-4">
                  <button
                    type="button"
                    onClick={() => setExtra('has_inspection', !extras.has_inspection)}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${extras.has_inspection ? 'bg-[#003087]' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${extras.has_inspection ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">I have an inspection report</div>
                    <div className="text-xs text-gray-500">A report significantly increases dealer confidence and offers</div>
                  </div>
                  <AnimatePresence>
                    {extras.has_inspection && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="ml-auto flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full font-semibold"
                      >
                        <CheckCircle2 size={12} /> Great!
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* ── Photos ─────────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                Photos <span className="text-sm text-gray-400 font-normal">— increases offers by up to 40%</span>
              </h2>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                <Upload size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Photo upload coming soon</p>
                <p className="text-xs text-gray-400 mt-1">Front, rear, interior, and any damage</p>
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
              className="w-full flex items-center justify-center gap-2 bg-[#ff6600] hover:bg-[#e05a00] text-white font-bold py-4 rounded-xl text-lg transition-all disabled:opacity-60 shadow-md"
            >
              {submitting
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><ChevronRight size={20} /> Submit to Dealers</>
              }
            </button>
            <p className="text-center text-xs text-gray-400 pb-4">
              Dealers will see your listing and send real offers. Your phone number stays hidden until you approve.
            </p>
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

export default function SubmitOfferPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f7fa]" />}>
      <SubmitOfferContent />
    </Suspense>
  );
}
