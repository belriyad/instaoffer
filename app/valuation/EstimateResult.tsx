'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, TrendingUp, Shield, ArrowRight, BarChart2 } from 'lucide-react';
import { MLEstimate, OfferComps } from '@/lib/api';
import { formatQAR, formatKM } from '@/lib/utils';
import { ValuationData } from './page';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Props {
  estimate: MLEstimate;
  comps: OfferComps | null;
  data: ValuationData;
}

export default function EstimateResult({ estimate, comps, data }: Props) {
  const low = estimate.confidence_range[0];
  const high = estimate.confidence_range[1];
  const mid = estimate.estimated_price_qar;
  const rangeWidth = high - low;
  const midPct = ((mid - low) / rangeWidth) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* Estimate card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6"
        >
          {/* Car summary */}
          <div className="text-sm text-gray-500 mb-4 font-medium">
            {[data.year, data.make, data.class_name, data.trim].filter(Boolean).join(' ')}
            {data.km ? ` · ${formatKM(data.km)}` : ''}
            {data.city ? ` · ${data.city}` : ''}
          </div>

          <div className="text-center py-6">
            <p className="text-sm font-bold text-[#003087] uppercase tracking-widest mb-2">Estimated Market Value</p>
            <div className="text-5xl md:text-6xl font-black text-gray-900 mb-2">
              {formatQAR(Math.round(mid))}
            </div>

            {/* Range bar */}
            <div className="mt-6 px-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Low: {formatQAR(Math.round(low))}</span>
                <span>High: {formatQAR(Math.round(high))}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-200 via-[#003087] to-blue-200 opacity-30 rounded-full" />
                <div
                  className="absolute top-0 bottom-0 w-1 bg-[#003087] rounded-full"
                  style={{ left: `${midPct}%`, transform: 'translateX(-50%)' }}
                />
              </div>
              <div className="flex justify-between text-xs font-medium text-gray-500 mt-1">
                <span>Conservative</span>
                <span>Optimistic</span>
              </div>
            </div>
          </div>

          {/* Accuracy badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            <div className="flex items-center gap-1.5 bg-[#e8f0fd] text-[#003087] px-3 py-1.5 rounded-full text-xs font-semibold">
              <BarChart2 size={12} />
              Model accuracy: {(100 - estimate.mape).toFixed(0)}%
            </div>
            <div className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-xs font-semibold capitalize">
              {estimate.segment} segment
            </div>
            {comps && (
              <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                <TrendingUp size={12} />
                Based on {comps.count} similar cars
              </div>
            )}
          </div>
        </motion.div>

        {/* Market comps */}
        {comps && comps.count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
          >
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#003087]" />
              Qatar Market Prices for {data.make} {data.class_name}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Lowest', value: comps.min },
                { label: 'Average', value: comps.avg },
                { label: 'Highest', value: comps.max },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">{label}</div>
                  <div className="font-bold text-gray-900 text-sm">{value ? formatQAR(Math.round(value)) : '—'}</div>
                </div>
              ))}
            </div>
            {comps.samples.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Similar listings</p>
                {comps.samples.slice(0, 3).map((s) => (
                  <div key={s.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{s.title}</p>
                      <p className="text-xs text-gray-500">{s.manufacture_year} · {formatKM(s.km)} · {s.city}</p>
                    </div>
                    <div className="font-bold text-[#003087] text-sm">{formatQAR(s.price_qar)}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Privacy notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[#e8f0fd] border border-[#003087]/20 rounded-2xl p-5 mb-6"
        >
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-[#003087] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-[#003087] mb-1">Your privacy is protected</p>
              <p className="text-sm text-[#003087]/80">
                Dealers will not see your phone number unless you approve it. All offers are non-binding
                and subject to inspection. You stay in full control.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-3"
        >
          <Link
            href={`/submit-offer?${new URLSearchParams({
              make:       data.make,
              class_name: data.class_name,
              year:       String(data.year ?? ''),
              km:         String(data.km ?? ''),
              condition:  data.condition,
              city:       data.city,
              ...(data.model ? { model: data.model } : {}),
              ...(data.trim  ? { trim:  data.trim  } : {}),
            }).toString()}`}
            className="flex items-center justify-center gap-2 w-full bg-[#ff6600] hover:bg-[#e05a00] text-white font-bold py-4 rounded-xl text-lg transition-all shadow-md"
          >
            Get Real Dealer Offers
            <ChevronRight size={20} />
          </Link>
          <Link
            href="/valuation"
            className="flex items-center justify-center gap-2 w-full bg-white hover:bg-gray-50 text-[#003087] border border-gray-200 font-semibold py-4 rounded-xl text-base transition-all"
          >
            Value Another Car
            <ArrowRight size={18} />
          </Link>
        </motion.div>

        <p className="text-center text-xs text-gray-400 mt-6">
          This estimate is generated by an AI model trained on Qatar market data. It is not a guaranteed purchase price.
          Actual dealer offers may vary based on physical inspection.
        </p>
      </div>

      <Footer />
    </div>
  );
}
