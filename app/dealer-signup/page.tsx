'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, CheckCircle2, Building2, LayoutDashboard, UserCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { waLink } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// Strip a stored phone (e.g. "+974 5555 1234") down to the local digits the
// WhatsApp field expects — no country code, no separators.
function localPhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('974') ? digits.slice(3) : digits;
}

const SPECIALIZATIONS = [
  'Luxury / Premium',
  'Japanese Makes',
  'American Makes',
  'German Makes',
  'SUVs & 4x4',
  'Sedans',
  'Commercial Vehicles',
  'All Makes',
];

interface FormState {
  business_name: string;
  cr_number: string;
  whatsapp: string;
  email: string;
  specialization: string;
  notes: string;
}

export default function DealerSignupPage() {
  const { user } = useAuth();
  const isAlreadyDealer = user?.role === 'dealer' || user?.role === 'admin';

  const [form, setForm] = useState<FormState>({
    business_name: '',
    cr_number: '',
    whatsapp: '',
    email: '',
    specialization: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [prefilled, setPrefilled] = useState(false);

  // Pre-fill known account details once the session resolves — without
  // clobbering anything the visitor has already typed. Fields stay editable.
  useEffect(() => {
    if (!user || prefilled) return;
    setForm(prev => ({
      ...prev,
      email: prev.email || user.email || '',
      whatsapp: prev.whatsapp || localPhone(user.phone),
    }));
    setPrefilled(true);
  }, [user, prefilled]);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  const canSubmit = form.business_name && form.whatsapp && form.specialization;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      // TODO: wire to POST /api/dealer-applications when backend ships.
      // When signed in, send the bearer token so the application is linked to
      // the existing account (one identity with seller + pending-dealer roles)
      // rather than creating an orphan record.
      await new Promise(res => setTimeout(res, 1200));
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again or contact us on WhatsApp.');
    } finally {
      setLoading(false);
    }
  }

  // A user who already holds a dealer/admin account shouldn't see a blank
  // application — show their status and point them to the workspace.
  if (isAlreadyDealer) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8fafc]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck size={30} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">You&apos;re already a dealer</h1>
            <p className="text-gray-500 mb-6">
              {user?.full_name || user?.email} is set up with a dealer account — no need to apply again.
            </p>
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 w-full bg-[#002b5b] hover:bg-[#1a7fd4] text-white font-bold py-3 rounded-xl transition-colors"
            >
              <LayoutDashboard size={16} /> Go to your dashboard
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8fafc]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center"
          >
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Application Received!</h1>
            <p className="text-gray-500 mb-6">
              We&apos;ll review your dealer application and get back to you within <strong>24–48 hours</strong> via WhatsApp.
            </p>
            <div className="bg-[#f8fafc] rounded-xl p-4 text-left mb-6 space-y-1.5 text-sm text-gray-700">
              <p><span className="text-gray-400">Business:</span> {form.business_name}</p>
              <p><span className="text-gray-400">WhatsApp:</span> +974 {form.whatsapp}</p>
              <p><span className="text-gray-400">Specialization:</span> {form.specialization}</p>
            </div>
            <a
              href={waLink(`Hi InstaOffer, I just submitted a dealer application for ${form.business_name}. Looking forward to your review!`)}
              target="_blank"
              className="flex items-center justify-center gap-2 w-full bg-[#25d366] hover:bg-[#1ebe5c] text-white font-bold py-3.5 rounded-xl transition-colors mb-3"
            >
              💬 Follow up on WhatsApp
            </a>
            <Link href="/for-dealers" className="text-sm text-gray-400 hover:text-[#002b5b] transition-colors">
              ← Back to For Dealers
            </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        <motion.div initial={false} animate="visible" variants={fadeUp} className="mb-6">
          <Link href="/for-dealers" className="text-sm text-gray-400 hover:text-[#002b5b] transition-colors">
            ← For Dealers
          </Link>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-11 h-11 bg-[#002b5b] rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Apply as a Dealer</h1>
              <p className="text-sm text-gray-500">Free 30-day trial · Approval in 24–48 hours</p>
            </div>
          </div>
        </motion.div>

        {/* Signed-in seller context — recognise the account and link the application. */}
        {user && (
          <motion.div initial={false} animate="visible" variants={fadeUp}
            className="bg-[#ebf5ff] border border-[#d0e0ff] rounded-2xl p-4 mb-4 flex items-start gap-3">
            <UserCheck size={18} className="text-[#002b5b] mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-bold text-[#002b5b]">
                You&apos;re signed in as {user.full_name || user.email} (seller)
              </p>
              <p className="text-gray-600 mt-0.5">
                We&apos;ll add the dealer account to your existing profile and have pre-filled what we know.
                You can edit any field below.
              </p>
            </div>
          </motion.div>
        )}

        <motion.div initial={false} animate="visible" variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Business Name *</label>
            <input
              type="text"
              value={form.business_name}
              onChange={e => set('business_name', e.target.value)}
              placeholder="e.g. Al Meera Cars"
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#002b5b] focus:ring-2 focus:ring-[#002b5b]/10"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              CR Number <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.cr_number}
              onChange={e => set('cr_number', e.target.value)}
              placeholder="Qatar Commercial Registration number"
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#002b5b] focus:ring-2 focus:ring-[#002b5b]/10"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">WhatsApp Number *</label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#002b5b] focus-within:ring-2 focus-within:ring-[#002b5b]/10 bg-white">
              <span className="px-3 py-3 text-sm font-semibold text-gray-500 bg-gray-50 border-r border-gray-200">🇶🇦 +974</span>
              <input
                type="tel"
                inputMode="numeric"
                value={form.whatsapp}
                onChange={e => set('whatsapp', e.target.value)}
                placeholder="5x xxx xxxx"
                className="flex-1 px-3 py-3 text-sm outline-none"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">We&apos;ll contact you on WhatsApp to verify your application.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Email <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="you@business.com"
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#002b5b] focus:ring-2 focus:ring-[#002b5b]/10"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Vehicle Specialization *</label>
            <div className="grid grid-cols-2 gap-2">
              {SPECIALIZATIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('specialization', s)}
                  className={`text-sm py-2.5 px-3 rounded-xl border-2 font-medium text-left transition-all ${
                    form.specialization === s
                      ? 'border-[#002b5b] bg-[#002b5b]/5 text-[#002b5b]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              placeholder="Tell us about your dealership, years in business, typical inventory size, etc."
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#002b5b] focus:ring-2 focus:ring-[#002b5b]/10 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all ${
              canSubmit && !loading
                ? 'bg-[#002b5b] hover:bg-[#1a7fd4] text-white shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><ChevronRight size={18} /> Submit Application</>}
          </button>

          <p className="text-xs text-gray-400 text-center">
            We verify all dealers before granting access. By applying you agree to our{' '}
            <Link href="/terms" className="underline hover:text-[#002b5b]">Terms of Service</Link>.
          </p>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
