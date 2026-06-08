'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calculator, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { getDealerMarginCalc, MarginCalcResult, MarginTier } from '@/lib/api';
import { formatQAR } from '@/lib/utils';

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const cls =
    confidence === 'high' ? 'bg-green-100 text-green-700 border border-green-200' :
    confidence === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
    'bg-red-50 text-red-600 border border-red-200';
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${cls}`}>
      {confidence} confidence
    </span>
  );
}

function TierRow({ label, tier, highlight }: { label: string; tier: MarginTier; highlight?: boolean }) {
  const isPositive = tier.gross_qar > 0;
  return (
    <div className={`grid grid-cols-4 gap-2 py-3 border-b border-gray-100 last:border-0 text-sm ${highlight ? 'bg-green-50 -mx-4 px-4 rounded-xl' : ''}`}>
      <div>
        <p className="font-semibold text-gray-800">{label}</p>
        {highlight && <p className="text-xs text-green-600 font-medium">Recommended</p>}
      </div>
      <p className="font-bold text-right text-gray-900">{formatQAR(tier.offer_qar)}</p>
      <p className={`font-bold text-right ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
        {isPositive ? '+' : ''}{formatQAR(tier.gross_qar)}
      </p>
      <p className={`text-right font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
        {tier.gross_pct}%
      </p>
    </div>
  );
}

const FIELDS: { key: string; label: string; placeholder: string; type?: string }[] = [
  { key: 'make',       label: 'Make',            placeholder: 'e.g. Toyota' },
  { key: 'class_name', label: 'Model',            placeholder: 'e.g. Land Cruiser' },
  { key: 'trim',       label: 'Trim (optional)',  placeholder: 'e.g. GXR' },
  { key: 'year',       label: 'Year',             placeholder: 'e.g. 2022', type: 'number' },
  { key: 'km',         label: 'KM',               placeholder: 'e.g. 45000',  type: 'number' },
  { key: 'buy_price',  label: 'Your buy price (optional)', placeholder: 'e.g. 120000', type: 'number' },
];

export default function MarginCalculatorPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({
    make: '', class_name: '', trim: '', year: '', km: '', buy_price: '',
  });
  const [result, setResult] = useState<MarginCalcResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login/dealer');
  }, [user, loading, router]);

  async function calculate() {
    const year = parseInt(form.year);
    const km = parseFloat(form.km);
    if (!form.make || !form.class_name || !year || isNaN(km)) {
      setError('Make, Model, Year, and KM are required.');
      return;
    }
    setError(null);
    setCalculating(true);
    try {
      const res = await getDealerMarginCalc(
        {
          make: form.make,
          class_name: form.class_name,
          trim: form.trim || undefined,
          year,
          km,
          buy_price: form.buy_price ? parseFloat(form.buy_price) : undefined,
        },
        token!
      );
      setResult(res);
    } catch {
      setError('Could not calculate. Check inputs or try again.');
    } finally {
      setCalculating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8fafc]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#002b5b]/30 border-t-[#002b5b] rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="max-w-2xl mx-auto w-full px-4 py-8 flex-1">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#002b5b] transition-colors mb-3">
            <ArrowLeft size={15} /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
            <Calculator size={28} className="text-[#002b5b]" /> Margin Calculator
          </h1>
          <p className="text-gray-500 mt-1">Enter a car's details to see ML market estimate and expected gross margin.</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {FIELDS.map(f => (
              <div key={f.key} className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">{f.label}</label>
                <input
                  type={f.type ?? 'text'}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => setForm(s => ({ ...s, [f.key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#002b5b] transition-colors"
                />
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={calculate}
            disabled={calculating}
            className="w-full flex items-center justify-center gap-2 bg-[#002b5b] hover:bg-[#1a7fd4] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {calculating
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Calculator size={16} /> Calculate Margin</>}
          </button>
        </div>

        {/* Results */}
        {result?.ok && result.tiers && (
          <div className="space-y-4 mt-6">
            {/* Market estimate */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <p className="text-sm text-gray-500 font-medium">ML Market Estimate</p>
                {result.confidence && <ConfidenceBadge confidence={result.confidence} />}
                {result.segment && (
                  <span className="text-xs text-gray-400 capitalize">{result.segment} segment</span>
                )}
              </div>
              <p className="text-4xl font-black text-gray-900">{formatQAR(result.market_est_qar!)}</p>
              <p className="text-sm text-gray-400 mt-1">
                Range: {formatQAR(result.market_low_qar!)} – {formatQAR(result.market_high_qar!)}
                {result.model_mape_pct && (
                  <span className="ml-2 text-gray-300">(model error ±{result.model_mape_pct}%)</span>
                )}
              </p>
              {result.fixed_costs_qar && (
                <p className="text-xs text-gray-400 mt-1">
                  Fixed costs assumed: {formatQAR(result.fixed_costs_qar)} (reconditioning + holding)
                </p>
              )}
            </div>

            {/* Offer tiers */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Offer Tiers</p>
              <div className="grid grid-cols-4 gap-2 text-xs text-gray-400 mb-1">
                <span>Tier</span>
                <span className="text-right">Offer</span>
                <span className="text-right">Est. Gross</span>
                <span className="text-right">Gross %</span>
              </div>
              <TierRow label="Conservative" tier={result.tiers.conservative} />
              <TierRow label="Target" tier={result.tiers.target} highlight />
              <TierRow label="Aggressive" tier={result.tiers.aggressive} />
              {result.your_price && <TierRow label="Your price" tier={result.your_price} />}
            </div>

            <p className="text-xs text-gray-400">
              Gross = market estimate − offer − fixed costs. Actual margin depends on final sale price and reconditioning costs.
            </p>
          </div>
        )}

        {result && !result.ok && (
          <div className="mt-6 bg-white rounded-2xl border border-red-100 p-6 flex items-start gap-3">
            <TrendingDown size={20} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-600">Could not compute margin</p>
              <p className="text-sm text-gray-500 mt-1">
                {result.reason === 'no_market_data'
                  ? 'No market data found for this car. Try a broader search (less specific trim or wider year).'
                  : 'Check your inputs and try again.'}
              </p>
            </div>
          </div>
        )}

        {!result && !calculating && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <TrendingUp size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Enter car details above to calculate acquisition margin.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
