'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Upload, ChevronRight, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { createOfferRequest } from '@/lib/api';
import { CAR_MAKES, CAR_MODELS, YEARS, CONDITIONS, QATAR_CITIES } from '@/lib/utils';

export default function SubmitOfferPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    make: '',
    class_name: '',
    model: '',
    year: '',
    km: '',
    color: '',
    condition: 'good',
    city: 'Doha',
    description: '',
    asking_price_qar: '',
    contact_name: '',
    contact_phone: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/submit-offer');
    }
  }, [user, loading, router]);

  const models = form.make ? (CAR_MODELS[form.make] || []) : [];

  function update(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await createOfferRequest({
        make: form.make,
        class_name: form.class_name,
        model: form.model || undefined,
        year: Number(form.year),
        km: Number(form.km),
        color: form.color || undefined,
        condition: form.condition,
        city: form.city,
        description: form.description || undefined,
        asking_price_qar: form.asking_price_qar ? Number(form.asking_price_qar) : undefined,
        contact_name: form.contact_name || undefined,
        contact_phone: form.contact_phone || undefined,
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
          <p className="text-gray-500 mb-6">Complete your car details so dealers can send you real offers.</p>

          {/* Privacy notice */}
          <div className="bg-[#e8f0fd] border border-[#003087]/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <Shield size={20} className="text-[#003087] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[#003087]/90">
              <strong>Your phone number stays private.</strong> Dealers can only see it after you approve their request.
              All offers are non-binding and subject to inspection.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
            {/* Car Details */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Car Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Make *</label>
                  <select value={form.make} onChange={e => update('make', e.target.value)} required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]">
                    <option value="">Select make</option>
                    {CAR_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Model *</label>
                  {models.length > 0 ? (
                    <select value={form.class_name} onChange={e => update('class_name', e.target.value)} required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]">
                      <option value="">Select model</option>
                      {models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={form.class_name} onChange={e => update('class_name', e.target.value)} required placeholder="e.g. Land Cruiser" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Year *</label>
                  <select value={form.year} onChange={e => update('year', e.target.value)} required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]">
                    <option value="">Select year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mileage (km) *</label>
                  <input type="number" value={form.km} onChange={e => update('km', e.target.value)} required min="0" placeholder="e.g. 85000" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color</label>
                  <input type="text" value={form.color} onChange={e => update('color', e.target.value)} placeholder="e.g. White" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">City *</label>
                  <select value={form.city} onChange={e => update('city', e.target.value)} required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]">
                    {QATAR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Condition *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CONDITIONS.map(c => (
                      <button type="button" key={c.value} onClick={() => update('condition', c.value)} className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${form.condition === c.value ? 'border-[#003087] bg-[#e8f0fd] text-[#003087]' : 'border-gray-200 text-gray-700'}`}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Additional Notes</label>
                  <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} placeholder="Any extra info about the car — service history, accident history, modifications, etc." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087] resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Asking Price (QAR)</label>
                  <input type="number" value={form.asking_price_qar} onChange={e => update('asking_price_qar', e.target.value)} placeholder="Optional — leave blank to let dealers bid freely" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]" />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Contact Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Name</label>
                  <input type="text" value={form.contact_name} onChange={e => update('contact_name', e.target.value)} placeholder="Full name" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Phone Number <span className="text-gray-400 font-normal">(stays private)</span>
                  </label>
                  <input type="tel" value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)} placeholder="+974 XXXX XXXX" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]" />
                </div>
              </div>
            </div>

            {/* Photos placeholder */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Photos</h2>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                <Upload size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Photo upload coming soon</p>
                <p className="text-xs text-gray-400 mt-1">Adding photos increases offers by up to 40%</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#ff6600] hover:bg-[#e05a00] text-white font-bold py-4 rounded-xl text-lg transition-all disabled:opacity-60"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Submit to Dealers <ChevronRight size={20} /></>
              )}
            </button>
            <p className="text-center text-xs text-gray-400">
              By submitting, dealers will be able to view your car listing and send you offers.
              Your phone number remains hidden until you approve sharing it.
            </p>
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
