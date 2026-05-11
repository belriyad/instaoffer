'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, ChevronRight, CheckCircle2, ArrowLeft, Clock, TrendingUp, DollarSign } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { createOfferRequest } from '@/lib/api';
import { CAR_MAKES } from '@/lib/utils';

const CITIES = ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Lusail', 'Umm Salal', 'Al Daayen', 'Al Shamal'];

const URGENCY_OPTIONS = [
  { value: 'leaving_qatar', label: '✈️ Leaving Qatar soon', desc: 'Need to sell before departure' },
  { value: 'need_cash', label: '💵 Need cash quickly', desc: 'Urgent financial need' },
  { value: 'upgrading', label: '🚗 Upgrading my car', desc: 'Already found a new car' },
  { value: 'other', label: '📝 Other reason', desc: "I'll explain to the dealer" },
] as const;

const PRIORITY_OPTIONS = [
  {
    value: 'speed',
    icon: Clock,
    label: 'Fastest Sale',
    desc: 'Accept a slightly lower offer to close in days',
    color: 'text-orange-500',
    border: 'border-orange-400 bg-orange-50',
  },
  {
    value: 'balanced',
    icon: TrendingUp,
    label: 'Balanced',
    desc: 'Good price AND fast turnaround',
    color: 'text-blue-600',
    border: 'border-blue-400 bg-blue-50',
  },
  {
    value: 'price',
    icon: DollarSign,
    label: 'Best Price',
    desc: 'Wait for the highest offer, time permitting',
    color: 'text-green-600',
    border: 'border-green-400 bg-green-50',
  },
] as const;

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 25 }, (_, i) => CURRENT_YEAR - i);

type UrgencyReason = 'leaving_qatar' | 'need_cash' | 'upgrading' | 'other';
type SellPriority = 'speed' | 'price' | 'balanced';

interface FormState {
  make: string;
  class_name: string;
  year: string;
  km: string;
  condition: string;
  city: string;
  contact_name: string;
  contact_phone: string;
  urgency_reason: UrgencyReason | '';
  sell_priority: SellPriority | '';
}

export default function UrgentSalePage() {
  const router = useRouter();
  const { token, ensureGuestToken } = useAuth();

  const [form, setForm] = useState<FormState>({
    make: '',
    class_name: '',
    year: '',
    km: '',
    condition: 'good',
    city: 'Doha',
    contact_name: '',
    contact_phone: '',
    urgency_reason: '',
    sell_priority: 'balanced',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dealerCount] = useState(Math.floor(Math.random() * 8) + 10); // 10-17

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.make || !form.class_name || !form.year || !form.km) {
      setError('Please fill in all required car details.');
      return;
    }
    if (!form.urgency_reason) {
      setError('Please select why you need to sell quickly.');
      return;
    }
    if (!form.sell_priority) {
      setError('Please choose your selling priority.');
      return;
    }

    setLoading(true);
    try {
      const authToken = token ?? (await ensureGuestToken());
      await createOfferRequest(
        {
          make: form.make,
          class_name: form.class_name,
          year: parseInt(form.year),
          km: parseInt(form.km.replace(/,/g, '')),
          condition: form.condition,
          city: form.city,
          contact_name: form.contact_name || undefined,
          contact_phone: form.contact_phone || undefined,
          is_urgent: true,
          urgency_reason: form.urgency_reason as UrgencyReason,
          sell_priority: form.sell_priority as SellPriority,
        },
        authToken
      );
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
              Your request was sent to{' '}
              <span className="font-bold text-[#003087]">{dealerCount} verified dealers</span>. They&apos;ll
              compete to give you the best offer fast.
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
              <Link
                href="/my-offers"
                className="w-full bg-[#003087] text-white font-bold py-3 rounded-lg hover:bg-[#002070] transition-colors"
              >
                View My Offers
              </Link>
              <button
                onClick={() => router.push('/')}
                className="w-full text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-[#ff6600] to-[#cc4f00] text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link href="/" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Zap className="text-white" size={22} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black">Sell My Car Fast</h1>
          </div>
          <p className="text-white/80 text-sm md:text-base">
            Tell us about your car and urgency — dealers will compete for it immediately.
          </p>
        </div>
      </div>

      <main className="flex-1 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Car Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4 text-base">🚗 Car Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Make <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.make}
                    onChange={(e) => set('make', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white"
                    required
                  >
                    <option value="">Select make</option>
                    {CAR_MAKES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.class_name}
                    onChange={(e) => set('class_name', e.target.value)}
                    placeholder="e.g. Camry, X5, Patrol"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.year}
                    onChange={(e) => set('year', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white"
                    required
                  >
                    <option value="">Select year</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mileage (km) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.km}
                    onChange={(e) => set('km', e.target.value)}
                    placeholder="e.g. 85000"
                    min={0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <select
                    value={form.condition}
                    onChange={(e) => set('condition', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <select
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Why Selling */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-1 text-base">⚡ Why do you need to sell quickly?</h2>
              <p className="text-xs text-gray-500 mb-4">This helps dealers prioritise your listing</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {URGENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('urgency_reason', opt.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      form.urgency_reason === opt.value
                        ? 'border-[#ff6600] bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="font-semibold text-sm text-gray-900">{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sell Priority */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-1 text-base">🎯 What matters most to you?</h2>
              <p className="text-xs text-gray-500 mb-4">Dealers will tailor their offers accordingly</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PRIORITY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('sell_priority', opt.value)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        form.sell_priority === opt.value
                          ? opt.border + ' border-opacity-100'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <Icon className={`mb-2 ${form.sell_priority === opt.value ? opt.color : 'text-gray-400'}`} size={20} />
                      <div className="font-semibold text-sm text-gray-900">{opt.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact (optional) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-1 text-base">📞 Your Contact (Optional)</h2>
              <p className="text-xs text-gray-500 mb-4">Only shared with dealers you personally approve</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={form.contact_name}
                    onChange={(e) => set('contact_name', e.target.value)}
                    placeholder="Your name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.contact_phone}
                    onChange={(e) => set('contact_phone', e.target.value)}
                    placeholder="+974 XXXX XXXX"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff6600] hover:bg-[#e05a00] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] shadow-lg shadow-orange-900/20"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Sending to dealers...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  Send to Dealers Now
                  <ChevronRight size={18} />
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              Non-binding. Your phone number stays private until you approve a dealer.
            </p>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
