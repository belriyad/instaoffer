'use client';

import { useEffect, useState } from 'react';
import { Info, TrendingUp } from 'lucide-react';
import { getMLEstimate } from '@/lib/api';
import { formatQAR } from '@/lib/utils';

interface Props {
  make: string;
  class_name: string;
  year: string;
  km: string;
  city?: string;
}

interface Bands {
  privatePartyLow: number;
  privatePartyHigh: number;
  tradeInLow: number;
  tradeInHigh: number;
  instantLow: number;
  instantHigh: number;
}

function computeBands(estimate: number, low: number, high: number): Bands {
  const rangeRatio = (high - low) / estimate;
  const demandDiscount = Math.min(0.04, rangeRatio * 0.3);
  return {
    privatePartyLow:  Math.round((low  * 0.98) / 1000) * 1000,
    privatePartyHigh: Math.round((high * 1.01) / 1000) * 1000,
    tradeInLow:       Math.round((estimate * (1 - 0.10 - demandDiscount)) / 1000) * 1000,
    tradeInHigh:      Math.round((estimate * (1 - 0.06 - demandDiscount * 0.5)) / 1000) * 1000,
    instantLow:       Math.round((estimate * (1 - 0.18 - demandDiscount)) / 1000) * 1000,
    instantHigh:      Math.round((estimate * (1 - 0.12 - demandDiscount * 0.5)) / 1000) * 1000,
  };
}

export default function PriceGuidanceCard({ make, class_name, year, km, city = 'Doha' }: Props) {
  const [bands, setBands] = useState<Bands | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const ready = make && class_name && year && km;

  useEffect(() => {
    if (!ready) { setBands(null); setFailed(false); return; }
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    getMLEstimate({
      make,
      class_name,
      manufacture_year: parseInt(year),
      km: parseInt(km.replace(/,/g, '')),
      city,
      condition: 'good',
    })
      .then((res) => {
        if (!controller.signal.aborted) {
          if ('error' in res) { setFailed(true); }
          else {
            const [lo, hi] = res.confidence_range;
            setBands(computeBands(res.estimated_price_qar, lo, hi));
          }
        }
      })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [make, class_name, year, km, city, ready]);

  if (!ready || failed) return null;

  return (
    <div className="bg-gradient-to-br from-[#f0f4ff] to-white border border-[#003087]/15 rounded-xl p-4 mb-0">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={15} className="text-[#003087]" />
        <span className="text-sm font-bold text-[#003087]">Estimated options for your car</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
          <div className="w-4 h-4 border-2 border-[#003087]/40 border-t-[#003087] rounded-full animate-spin" />
          Calculating…
        </div>
      ) : bands ? (
        <>
          <div className="space-y-2">
            {[
              { label: 'Private sale',   low: bands.privatePartyLow,  high: bands.privatePartyHigh,  color: 'text-gray-800' },
              { label: 'Trade-in',       low: bands.tradeInLow,       high: bands.tradeInHigh,       color: 'text-green-700' },
              { label: 'Instant offer',  low: bands.instantLow,       high: bands.instantHigh,       color: 'text-[#ff6600]' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-xs text-gray-500 w-28">{row.label}</span>
                <span className={`text-sm font-bold ${row.color}`}>
                  {formatQAR(row.low)} – {formatQAR(row.high)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-1.5 mt-3 pt-3 border-t border-[#003087]/10">
            <Info size={11} className="text-gray-400 mt-0.5 shrink-0" />
            <p className="text-[10px] text-gray-400 leading-relaxed">
              These are estimates. Actual dealer offers depend on photos, inspection, and market demand.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
