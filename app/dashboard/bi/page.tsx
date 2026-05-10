'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Brain, TrendingUp, Clock, DollarSign, BarChart2,
  ChevronRight, Sparkles, AlertCircle, Car, RefreshCw,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import {
  getMLEstimate, getMLForecast, getMLTimeToSell,
  getDealerMarginCalc, getMarketComps,
  MLEstimate, MLForecast, MLTimeToSellEstimate, MarginCalcResult, OfferComps,
} from '@/lib/api';
import { formatQAR, formatKM, CAR_MAKES, FUEL_TYPES, GEAR_TYPES, CAR_TYPES, QATAR_CITIES, CONDITIONS } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BIResults {
  estimate: MLEstimate | null;
  forecast: MLForecast | null;
  timeToSell: MLTimeToSellEstimate | null;
  margin: MarginCalcResult | null;
  comps: OfferComps | null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-xl bg-[#003087]/10 flex items-center justify-center text-[#003087]">
        {icon}
      </div>
      <h2 className="text-base font-bold text-gray-800">{title}</h2>
    </div>
  );
}

function ResultCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function ProbBar({ label, pct }: { label: string; pct: number }) {
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-[#003087]' : 'bg-orange-400';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{label} days</span>
        <span className="font-bold text-gray-700">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TierRow({ label, tier, highlight = false }: {
  label: string;
  tier: { offer_qar: number; gross_qar: number; gross_pct: number; roi_pct: number };
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-[#003087]/5 border border-[#003087]/20' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-bold uppercase tracking-wide ${highlight ? 'text-[#003087]' : 'text-gray-500'}`}>{label}</span>
        {highlight && <span className="text-[10px] font-bold text-[#003087] bg-[#003087]/10 px-1.5 py-0.5 rounded-full">Recommended</span>}
      </div>
      <div className="text-lg font-black text-gray-900">{formatQAR(tier.offer_qar)}</div>
      <div className="flex gap-3 mt-1 text-xs text-gray-500">
        <span>Gross {formatQAR(tier.gross_qar)}</span>
        <span>·</span>
        <span className={tier.gross_pct >= 0 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
          {tier.gross_pct.toFixed(1)}% margin
        </span>
        <span>·</span>
        <span>ROI {tier.roi_pct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BIPage() {
  const { token } = useAuth();

  // Form state
  const [make, setMake] = useState('');
  const [className, setClassName] = useState('');
  const [year, setYear] = useState('');
  const [km, setKm] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [trim, setTrim] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [gearType, setGearType] = useState('');
  const [carType, setCarType] = useState('');
  const [city, setCity] = useState('');
  const [condition, setCondition] = useState('');
  const [makeSearch, setMakeSearch] = useState('');
  const [showMakeDrop, setShowMakeDrop] = useState(false);

  // Results state
  const [results, setResults] = useState<BIResults | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const filteredMakes = CAR_MAKES.filter(m =>
    m.toLowerCase().includes(makeSearch.toLowerCase())
  ).slice(0, 8);

  const canRun = make && className && year && km;

  async function runAnalysis() {
    if (!canRun) return;
    setRunning(true);
    setError('');
    setResults(null);

    const params = {
      make,
      class_name: className,
      manufacture_year: parseInt(year),
      km: parseInt(km),
      trim:      trim      || undefined,
      fuel_type: fuelType  || undefined,
      gear_type: gearType  || undefined,
      car_type:  carType   || undefined,
      city:      city      || undefined,
      condition: condition || undefined,
    };

    try {
      const [estimate, forecast, timeToSell, margin, comps] = await Promise.allSettled([
        getMLEstimate(params, token ?? undefined),
        getMLForecast(params, token ?? undefined),
        getMLTimeToSell({ ...params, price_qar: buyPrice ? parseInt(buyPrice) : undefined }, token ?? undefined),
        buyPrice
          ? getDealerMarginCalc(
              { make, class_name: className, trim: trim || undefined, year: parseInt(year), km: parseInt(km), buy_price: parseInt(buyPrice) },
              token!
            )
          : Promise.resolve(null),
        getMarketComps({ make, class_name: className, year: parseInt(year), km: parseInt(km) }, token ?? undefined),
      ]);

      setResults({
        estimate: estimate.status === 'fulfilled' ? estimate.value : null,
        forecast: forecast.status === 'fulfilled' ? forecast.value : null,
        timeToSell: timeToSell.status === 'fulfilled' ? timeToSell.value : null,
        margin: margin.status === 'fulfilled' ? margin.value : null,
        comps: comps.status === 'fulfilled' ? comps.value : null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed. Please try again.');
    } finally {
      setRunning(false);
    }
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />
      <div className="max-w-3xl mx-auto w-full px-4 py-8 flex-1">

        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#003087] transition-colors mb-3">
            <ArrowLeft size={15} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#003087] flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">AI Business Intelligence</h1>
              <p className="text-sm text-gray-500">Run all AI models on any vehicle instantly</p>
            </div>
          </div>
        </div>

        {/* Vehicle Form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
          <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
            <Car size={16} className="text-[#003087]" /> Vehicle Details
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            More fields = more accurate estimate. The AI uses the same model as the seller valuation wizard.
          </p>

          {/* ── Required ── */}
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Required</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">

            {/* Make — autocomplete */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Make *</label>
              <input
                value={makeSearch || make}
                onChange={e => { setMakeSearch(e.target.value); setMake(''); setShowMakeDrop(true); }}
                onFocus={() => setShowMakeDrop(true)}
                onBlur={() => setTimeout(() => setShowMakeDrop(false), 150)}
                placeholder="Toyota, BMW…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]"
              />
              {showMakeDrop && filteredMakes.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                  {filteredMakes.map(m => (
                    <button key={m} onMouseDown={() => { setMake(m); setMakeSearch(m); setShowMakeDrop(false); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[#003087]/5 transition-colors"
                    >{m}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Class / Model */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Model / Class *</label>
              <input
                value={className}
                onChange={e => setClassName(e.target.value)}
                placeholder="Camry, X5…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]"
              />
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Year *</label>
              <select
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087] bg-white"
              >
                <option value="">Select year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* KM */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Mileage (KM) *</label>
              <input
                type="number"
                value={km}
                onChange={e => setKm(e.target.value)}
                placeholder="85000"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]"
              />
            </div>
          </div>

          {/* ── Optional (improves accuracy) ── */}
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Optional — improves estimate accuracy</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">

            {/* Trim */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Trim</label>
              <input
                value={trim}
                onChange={e => setTrim(e.target.value)}
                placeholder="XLE, M Sport, Platinum…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]"
              />
            </div>

            {/* Condition */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Condition</label>
              <select value={condition} onChange={e => setCondition(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087] bg-white">
                <option value="">Select condition</option>
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* Fuel Type */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Fuel Type</label>
              <select value={fuelType} onChange={e => setFuelType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087] bg-white">
                <option value="">Any fuel type</option>
                {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {/* Gear Type */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Transmission</label>
              <select value={gearType} onChange={e => setGearType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087] bg-white">
                <option value="">Any transmission</option>
                {GEAR_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Car Type */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Body Type</label>
              <select value={carType} onChange={e => setCarType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087] bg-white">
                <option value="">Any body type</option>
                {CAR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">City</label>
              <select value={city} onChange={e => setCity(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087] bg-white">
                <option value="">Any city</option>
                {QATAR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* ── Dealer-only ── */}
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Dealer fields</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Your Buy Price (QAR) <span className="text-gray-300 font-normal normal-case">(unlocks margin analysis)</span>
              </label>
              <input
                type="number"
                value={buyPrice}
                onChange={e => setBuyPrice(e.target.value)}
                placeholder="75000"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={runAnalysis}
            disabled={!canRun || running}
            className="mt-5 w-full flex items-center justify-center gap-2 bg-[#003087] hover:bg-[#0057b8] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-all"
          >
            {running ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running AI Analysis…
              </>
            ) : (
              <>
                <Sparkles size={16} /> Run AI Analysis
              </>
            )}
          </button>
        </div>

        {/* Results */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >

              {/* ── Fair Market Value ── */}
              {results.estimate && (
                <ResultCard>
                  <SectionHeader icon={<DollarSign size={16} />} title="Fair Market Value" />
                  <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                    <div>
                      <div className="text-4xl font-black text-[#003087]">
                        {formatQAR(results.estimate.estimated_price_qar)}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Confidence range: {formatQAR(results.estimate.confidence_range[0])} – {formatQAR(results.estimate.confidence_range[1])}
                      </div>
                    </div>
                    <div className="sm:ml-auto flex flex-wrap gap-2">
                      <span className="bg-[#003087]/10 text-[#003087] text-xs font-bold px-3 py-1 rounded-full">
                        {results.estimate.segment}
                      </span>
                      <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                        R² {(results.estimate.r2 * 100).toFixed(1)}%
                      </span>
                      <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                        MAPE {results.estimate.mape.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </ResultCard>
              )}

              {/* ── Price Forecast ── */}
              {results.forecast && (
                <ResultCard>
                  <SectionHeader icon={<TrendingUp size={16} />} title="Price Forecast" />
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-sm font-bold ${results.forecast.market_trend_annual_pct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {results.forecast.market_trend_annual_pct >= 0 ? '▲' : '▼'} {Math.abs(results.forecast.market_trend_annual_pct).toFixed(1)}% annual market trend
                    </span>
                    <span className="text-xs text-gray-400">· {results.forecast.segment}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <div className="flex gap-3 min-w-0">
                      {/* Current */}
                      <div className="flex-1 min-w-[90px] bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Now</div>
                        <div className="text-sm font-black text-gray-900">{formatQAR(results.forecast.current.estimated_price_qar)}</div>
                      </div>
                      {results.forecast.forecast.map(pt => (
                        <div key={pt.horizon} className="flex-1 min-w-[90px] bg-gray-50 rounded-xl p-3 text-center">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{pt.horizon}</div>
                          <div className="text-sm font-black text-gray-900">{formatQAR(pt.estimated_price_qar)}</div>
                          <div className={`text-[10px] font-bold mt-0.5 ${pt.change_pct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {pt.change_pct >= 0 ? '+' : ''}{pt.change_pct.toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Assumes {formatKM(results.forecast.annual_km_assumption)} km added per year.
                  </p>
                </ResultCard>
              )}

              {/* ── Time to Sell ── */}
              {results.timeToSell && (
                <ResultCard>
                  <SectionHeader icon={<Clock size={16} />} title="Time to Sell Estimate" />
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-[#003087]/10 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xl font-black text-[#003087]">{results.timeToSell.estimated_days_to_sell}</span>
                      <span className="text-[10px] text-gray-500 font-semibold">days</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Est. {results.timeToSell.estimated_days_to_sell} days to sell</p>
                      <p className="text-sm text-gray-400">Sell probability by horizon</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {Object.entries(results.timeToSell.probability_by_horizon)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([days, prob]) => (
                        <ProbBar key={days} label={days} pct={Math.round(prob * 100)} />
                      ))}
                  </div>
                </ResultCard>
              )}

              {/* ── Margin Analysis ── */}
              {results.margin && results.margin.ok && results.margin.tiers && (
                <ResultCard>
                  <SectionHeader icon={<BarChart2 size={16} />} title="Margin Analysis" />
                  {results.margin.market_est_qar && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
                      <div className="text-xs text-blue-600 font-semibold mb-0.5">Market Value</div>
                      <div className="text-2xl font-black text-[#003087]">{formatQAR(results.margin.market_est_qar)}</div>
                      {results.margin.market_low_qar && results.margin.market_high_qar && (
                        <div className="text-xs text-blue-500 mt-0.5">
                          Range: {formatQAR(results.margin.market_low_qar)} – {formatQAR(results.margin.market_high_qar)}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    <TierRow label="Conservative" tier={results.margin.tiers.conservative} />
                    <TierRow label="Target" tier={results.margin.tiers.target} highlight />
                    <TierRow label="Aggressive" tier={results.margin.tiers.aggressive} />
                  </div>
                  {results.margin.fixed_costs_qar && (
                    <p className="text-xs text-gray-400 mt-3">Fixed cost assumption: {formatQAR(results.margin.fixed_costs_qar)}</p>
                  )}
                </ResultCard>
              )}
              {results.margin !== null && results.margin !== undefined && !results.margin?.ok && (
                <ResultCard>
                  <SectionHeader icon={<BarChart2 size={16} />} title="Margin Analysis" />
                  <p className="text-sm text-gray-400">
                    {results.margin?.reason ?? 'Enter a buy price above to unlock margin analysis.'}
                  </p>
                </ResultCard>
              )}
              {buyPrice === '' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-800 flex items-center gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 text-amber-500" />
                  Add your <strong>buy price</strong> above to unlock margin tier analysis.
                </div>
              )}

              {/* ── Market Comps ── */}
              {results.comps && results.comps.count > 0 && (
                <ResultCard>
                  <SectionHeader icon={<Car size={16} />} title="Market Comparables" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: 'Listings found', val: results.comps.count },
                      { label: 'Median price', val: results.comps.median ? formatQAR(results.comps.median) : '—' },
                      { label: 'P25 – P75', val: results.comps.p25 && results.comps.p75 ? `${formatQAR(results.comps.p25)} – ${formatQAR(results.comps.p75)}` : '—' },
                      { label: 'Avg price', val: results.comps.avg ? formatQAR(results.comps.avg) : '—' },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{s.label}</div>
                        <div className="text-sm font-black text-gray-900">{s.val}</div>
                      </div>
                    ))}
                  </div>
                  {results.comps.samples.length > 0 && (
                    <div className="space-y-2">
                      {results.comps.samples.slice(0, 3).map(s => (
                        <div key={s.product_id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{s.title}</p>
                            <p className="text-xs text-gray-400">{s.manufacture_year} · {formatKM(s.km)} · {s.city}</p>
                          </div>
                          <div className="text-sm font-black text-[#003087] ml-4 flex-shrink-0">{formatQAR(s.price_qar)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </ResultCard>
              )}

              {/* Re-run button */}
              <button
                onClick={runAnalysis}
                disabled={running}
                className="w-full flex items-center justify-center gap-2 border-2 border-[#003087] text-[#003087] font-bold py-3 rounded-xl text-sm hover:bg-[#003087]/5 transition-all disabled:opacity-50"
              >
                <RefreshCw size={15} /> Run Again with Different Values
              </button>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!results && !running && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <Brain size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Fill in the vehicle details above and hit <strong className="text-gray-600">Run AI Analysis</strong></p>
            <div className="flex flex-wrap justify-center gap-2 mt-4 text-xs text-gray-400">
              {['Fair Market Value', 'Price Forecast', 'Time to Sell', 'Margin Analysis', 'Market Comps'].map(t => (
                <span key={t} className="bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}
