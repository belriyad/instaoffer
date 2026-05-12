'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, ChevronRight, ArrowRight, Car, Info, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getMLEstimate } from '@/lib/api';
import { CAR_MAKES, formatQAR } from '@/lib/utils';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 25 }, (_, i) => CURRENT_YEAR - i);

function computeTradeInBand(estimate: number, confidenceLow: number, confidenceHigh: number) {
  const rangeRatio = (confidenceHigh - confidenceLow) / estimate;
  const demandDiscount = Math.min(0.04, rangeRatio * 0.3);
  const lowDisc = 0.10 + demandDiscount;
  const highDisc = 0.06 + demandDiscount * 0.5;
  return {
    low: Math.round((estimate * (1 - lowDisc)) / 1000) * 1000,
    high: Math.round((estimate * (1 - highDisc)) / 1000) * 1000,
  };
}

function TradeInContent() {
  const params = useSearchParams();

  // Pre-fill from valuation query params
  const [currentMake, setCurrentMake] = useState(params.get('make') ?? '');
  const [currentModel, setCurrentModel] = useState(params.get('class_name') ?? '');
  const [currentYear, setCurrentYear] = useState(params.get('year') ?? '');
  const [currentKm, setCurrentKm] = useState(params.get('km') ?? '');
  const [currentCity, setCurrentCity] = useState(params.get('city') ?? 'Doha');

  const [targetMake, setTargetMake] = useState('');
  const [targetModel, setTargetModel] = useState('');
  const [targetYear, setTargetYear] = useState('');
  const [targetPrice, setTargetPrice] = useState('');

  const [tradeValue, setTradeValue] = useState<{ low: number; high: number } | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [estimateError, setEstimateError] = useState('');

  // Fetch ML estimate for current car when enough fields are filled
  useEffect(() => {
    if (!currentMake || !currentModel || !currentYear || !currentKm) return;
    const controller = new AbortController();
    setLoadingEstimate(true);
    setEstimateError('');
    getMLEstimate({
      make: currentMake,
      class_name: currentModel,
      manufacture_year: parseInt(currentYear),
      km: parseInt(currentKm.replace(/,/g, '')),
      city: currentCity,
      condition: 'good',
    })
      .then((res) => {
        if ('error' in res) {
          setEstimateError('Could not estimate value. Please check your car details.');
        } else {
          const [low, high] = res.confidence_range;
          const band = computeTradeInBand(res.estimated_price_qar, low, high);
          setTradeValue(band);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setEstimateError('Estimation failed. Try again.');
      })
      .finally(() => setLoadingEstimate(false));
    return () => controller.abort();
  }, [currentMake, currentModel, currentYear, currentKm, currentCity]);

  const targetPriceNum = parseInt(targetPrice.replace(/,/g, '')) || 0;
  const diffLow = tradeValue ? Math.max(0, targetPriceNum - tradeValue.high) : null;
  const diffHigh = tradeValue ? Math.max(0, targetPriceNum - tradeValue.low) : null;

  const submitParams = new URLSearchParams({
    make: currentMake,
    class_name: currentModel,
    year: currentYear,
    km: currentKm,
    city: currentCity,
    intent: 'trade_in',
    ...(targetMake && { target_make: targetMake }),
    ...(targetModel && { target_model: targetModel }),
    ...(targetYear && { target_year: targetYear }),
  });

  const canSubmit = currentMake && currentModel && currentYear && currentKm;

  return (
    <div className="min-h-screen bg-[#f4f6fb] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">

        {/* Back link */}
        <Link href="/valuation" className="inline-flex items-center gap-1.5 text-sm text-[#003087] font-semibold mb-6 hover:underline">
          <ArrowLeft size={15} /> Back to Valuation
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw size={22} className="text-green-600" />
            <h1 className="text-2xl font-black text-gray-900">Trade In My Car</h1>
          </div>
          <p className="text-sm text-gray-500">Get your current car&apos;s trade-in value and find your next car.</p>
        </div>

        {/* Current Car Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <h2 className="font-bold text-gray-900 mb-4 text-base flex items-center gap-2">
            <Car size={17} className="text-[#003087]" /> Your Current Vehicle
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Make</label>
              <select
                value={currentMake}
                onChange={(e) => setCurrentMake(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]"
              >
                <option value="">Select make</option>
                {CAR_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Model</label>
              <input
                type="text"
                value={currentModel}
                onChange={(e) => setCurrentModel(e.target.value)}
                placeholder="e.g. Camry"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Year</label>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]"
              >
                <option value="">Year</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Mileage (km)</label>
              <input
                type="number"
                value={currentKm}
                onChange={(e) => setCurrentKm(e.target.value)}
                placeholder="e.g. 75000"
                min={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]"
              />
            </div>
          </div>

          {/* Trade-in value result */}
          <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-4">
            <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Your Trade-In Value</div>
            {loadingEstimate && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                Estimating…
              </div>
            )}
            {!loadingEstimate && estimateError && (
              <div className="text-sm text-red-600">{estimateError}</div>
            )}
            {!loadingEstimate && tradeValue && !estimateError && (
              <>
                <div className="text-3xl font-black text-green-700">
                  {formatQAR(tradeValue.low)} – {formatQAR(tradeValue.high)}
                </div>
                <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <Info size={12} /> Estimated trade-in range based on current market data
                </div>
              </>
            )}
            {!loadingEstimate && !tradeValue && !estimateError && (
              <div className="text-sm text-gray-400">Fill in your car details above to get an estimate.</div>
            )}
          </div>
        </div>

        {/* Target Car Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <h2 className="font-bold text-gray-900 mb-1 text-base flex items-center gap-2">
            <ArrowRight size={17} className="text-[#003087]" /> What Car Do You Want Next?
          </h2>
          <p className="text-xs text-gray-500 mb-4">Optional — helps dealers find the right deal for you.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Make</label>
              <select
                value={targetMake}
                onChange={(e) => setTargetMake(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]"
              >
                <option value="">Any make</option>
                {CAR_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Model</label>
              <input
                type="text"
                value={targetModel}
                onChange={(e) => setTargetModel(e.target.value)}
                placeholder="e.g. Highlander"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Year (approx.)</label>
              <select
                value={targetYear}
                onChange={(e) => setTargetYear(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]"
              >
                <option value="">Any year</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Target Price (QAR)</label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="e.g. 180000"
                min={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]"
              />
            </div>
          </div>

          {/* Estimated difference */}
          {tradeValue && targetPriceNum > 0 && (
            <div className="mt-4 rounded-xl bg-[#f0f4ff] border border-[#003087]/20 p-4">
              <div className="text-xs font-semibold text-[#003087] uppercase tracking-wide mb-1">Estimated Difference to Pay</div>
              <div className="text-3xl font-black text-[#003087]">
                {formatQAR(diffLow ?? 0)} – {formatQAR(diffHigh ?? 0)}
              </div>
              <div className="text-xs text-[#003087]/70 mt-1 flex items-center gap-1">
                <Info size={12} /> Rough estimate — actual difference depends on negotiation and final offer.
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-1 text-base">Ready to Trade?</h2>
          <p className="text-sm text-gray-500 mb-4">
            Submit your current car and dealers in Qatar will compete to give you the best trade-in deal.
          </p>
          <Link
            href={canSubmit ? `/submit-offer?${submitParams}` : '#'}
            className={`flex items-center justify-center gap-2 w-full font-bold py-3.5 rounded-xl text-sm transition-all ${
              canSubmit
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            onClick={(e) => !canSubmit && e.preventDefault()}
          >
            <RefreshCw size={16} /> Find Matching Dealers <ChevronRight size={15} />
          </Link>
          {!canSubmit && (
            <p className="text-xs text-center text-gray-400 mt-2">Fill in your current car details to continue.</p>
          )}
          <p className="text-xs text-center text-gray-400 mt-3">
            Your details are only shared with dealers who respond to your request.
          </p>
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
