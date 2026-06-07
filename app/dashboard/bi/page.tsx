'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Brain, TrendingUp, Clock, DollarSign, BarChart2,
  ChevronRight, Sparkles, AlertCircle, Car, RefreshCw, Lock,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import {
  getMLEstimate, getMLForecast, getMLTimeToSell,
  getDealerMarginCalc, getMarketComps,
  MLEstimate, MLForecast, MLTimeToSellEstimate, MarginCalcResult, OfferComps,
} from '@/lib/api';
import { formatQAR, formatKM, MODEL_DEFAULTS, WARRANTY_STATUSES, SELLER_TYPES } from '@/lib/utils';
import {
  MakeSelect, ModelSelect, TrimSelect,
  YearTiles, KmBucketPicker, kmLabel,
  ConditionPicker, CityPicker, PillGroupPicker, PriceSlider, CylinderPicker,
} from '@/lib/form-controls';
import { FUEL_TYPES, GEAR_TYPES, CAR_TYPES } from '@/lib/utils';

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
  const [year, setYear] = useState<number | null>(null);
  const [km, setKm] = useState<number | null>(null);
  const [buyPrice, setBuyPrice] = useState<number | null>(null);
  const [trim, setTrim] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [gearType, setGearType] = useState('');
  const [carType, setCarType] = useState('');
  const [city, setCity] = useState('Doha');
  const [condition, setCondition] = useState('');
  const [cylinderCount, setCylinderCount] = useState<number | null>(null);
  const [warrantyStatus, setWarrantyStatus] = useState('Under Warranty');
  const [sellerType, setSellerType] = useState('private');

  // Results state
  const [results, setResults] = useState<BIResults | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const canRun = make && className && year && km;

  async function runAnalysis() {
    if (!canRun) return;
    setRunning(true);
    setError('');
    setResults(null);

    const params = {
      make,
      class_name: className,
      manufacture_year: year!,
      km: km!,
      trim:            trim           || undefined,
      fuel_type:       fuelType       || undefined,
      gear_type:       gearType       || undefined,
      car_type:        carType        || undefined,
      city:            city           || undefined,
      condition:       condition      || undefined,
      cylinder_count:  cylinderCount  ?? undefined,
      warranty_status: warrantyStatus || undefined,
      seller_type:     sellerType     || undefined,
    };

    try {
      // Estimate first so we can use it as the listing price for time-to-sell
      // (the endpoint requires price_qar) when the dealer hasn't entered a buy price.
      const estimate = await getMLEstimate(params, token ?? undefined).catch(() => null);
      const priceForTts = buyPrice ?? estimate?.estimated_price_qar;

      const [forecast, timeToSell, margin, comps] = await Promise.allSettled([
        getMLForecast(params, token ?? undefined),
        priceForTts
          ? getMLTimeToSell({ ...params, price_qar: priceForTts }, token ?? undefined)
          : Promise.resolve(null),
        buyPrice
          ? getDealerMarginCalc(
              { make, class_name: className, trim: trim || undefined, year: year!, km: km!, buy_price: buyPrice },
              token!
            )
          : Promise.resolve(null),
        getMarketComps({ make, class_name: className, year: year!, km: km! }, token ?? undefined),
      ]);

      setResults({
        estimate,
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

          {/* ── Make ── */}
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Make *</p>
          <MakeSelect
            value={make}
            onChange={m => { setMake(m); setClassName(''); setTrim(''); setFuelType(''); setGearType(''); setCarType(''); }}
          />

          {/* ── Model ── */}
          {make && (
            <div className="mt-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Model * <span className="normal-case text-gray-300">· {make}</span>
              </p>
              <ModelSelect
                make={make}
                value={className}
                onChange={m => {
                  setClassName(m);
                  setTrim('');
                  const d = MODEL_DEFAULTS[m] ?? {};
                  setFuelType(d.fuel_type ?? '');
                  setGearType(d.gear_type ?? '');
                  setCarType(d.car_type ?? '');
                }}
              />
            </div>
          )}

          {/* ── Trim ── */}
          {className && (
            <div className="mt-4">
              <TrimSelect model={className} value={trim} onChange={setTrim} />
            </div>
          )}

          {/* ── Year ── */}
          <div className="mt-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Year *</p>
            <YearTiles value={year} onChange={setYear} />
          </div>

          {/* ── KM ── */}
          <div className="mt-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Mileage * {km != null && <span className="normal-case text-gray-400 font-normal">— {kmLabel(km)}</span>}
            </p>
            <KmBucketPicker value={km} onChange={setKm} />
          </div>

          {/* ── Condition ── */}
          <div className="mt-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Condition</p>
            <ConditionPicker value={condition} onChange={setCondition} />
          </div>

          {/* ── City ── */}
          <div className="mt-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">City</p>
            <CityPicker value={city} onChange={setCity} />
          </div>

          {/* ── Fuel / Body / Transmission ── */}
          {(() => {
            const d = className ? (MODEL_DEFAULTS[className] ?? {}) : {};
            const locked = Object.keys(d);
            const hasLocked = locked.length > 0;
            const hasUnlocked = !d.fuel_type || !d.gear_type || !d.car_type;
            return (
              <div className="mt-5">
                {/* Locked auto-detected fields */}
                {hasLocked && (
                  <div className="mb-3 flex flex-wrap gap-2 items-center">
                    <Lock size={12} className="text-gray-400" />
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mr-1">Auto-detected</span>
                    {d.fuel_type  && <span className="inline-flex items-center gap-1 bg-[#e8f0fd] text-[#003087] text-xs font-semibold px-3 py-1 rounded-full">{d.fuel_type}</span>}
                    {d.gear_type  && <span className="inline-flex items-center gap-1 bg-[#e8f0fd] text-[#003087] text-xs font-semibold px-3 py-1 rounded-full">{d.gear_type}</span>}
                    {d.car_type   && <span className="inline-flex items-center gap-1 bg-[#e8f0fd] text-[#003087] text-xs font-semibold px-3 py-1 rounded-full">{d.car_type}</span>}
                  </div>
                )}
                {/* Only show pickers for fields NOT auto-detected */}
                {hasUnlocked && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {!d.fuel_type && (
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fuel</p>
                        <PillGroupPicker options={FUEL_TYPES} value={fuelType} onChange={setFuelType} />
                      </div>
                    )}
                    {!d.gear_type && (
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Transmission</p>
                        <PillGroupPicker options={GEAR_TYPES} value={gearType} onChange={setGearType} />
                      </div>
                    )}
                    {!d.car_type && (
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Body</p>
                        <PillGroupPicker options={CAR_TYPES} value={carType} onChange={setCarType} />
                      </div>
                    )}
                  </div>
                )}
                {/* No model selected yet — show all pickers */}
                {!className && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fuel</p>
                      <PillGroupPicker options={FUEL_TYPES} value={fuelType} onChange={setFuelType} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Transmission</p>
                      <PillGroupPicker options={GEAR_TYPES} value={gearType} onChange={setGearType} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Body</p>
                      <PillGroupPicker options={CAR_TYPES} value={carType} onChange={setCarType} />
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Cylinders ── */}
          <div className="mt-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cylinders</p>
            <CylinderPicker value={cylinderCount} onChange={setCylinderCount} />
          </div>

          {/* ── Warranty ── */}
          <div className="mt-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Warranty</p>
            <PillGroupPicker options={WARRANTY_STATUSES} value={warrantyStatus} onChange={setWarrantyStatus} />
          </div>

          {/* ── Seller Type ── */}
          <div className="mt-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Seller Type</p>
            <div className="flex gap-2">
              {SELLER_TYPES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSellerType(s)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold capitalize transition-all ${
                    sellerType === s
                      ? 'border-[#003087] bg-[#003087] text-white'
                      : 'border-gray-200 text-gray-600 hover:border-[#003087] hover:text-[#003087]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ── Dealer: Buy Price ── */}
          <div className="mt-5 border-t border-gray-100 pt-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              Your Buy Price <span className="normal-case text-gray-300 font-normal">(optional — unlocks margin analysis)</span>
            </p>
            <PriceSlider
              value={buyPrice}
              onChange={setBuyPrice}
              label=""
              hint={<p className="text-xs text-gray-400">Leave at minimum to skip margin analysis</p>}
              minValue={0}
            />
            {buyPrice === 0 && (
              <p className="text-xs text-amber-600 mt-1">Set a buy price above 0 to enable margin analysis</p>
            )}
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
              {buyPrice == null && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-800 flex items-center gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 text-amber-500" />
                  Add your <strong>buy price</strong> above to unlock margin tier analysis.
                </div>
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
              {['Fair Market Value', 'Price Forecast', 'Time to Sell', 'Margin Analysis'].map(t => (
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
