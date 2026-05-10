'use client';

/**
 * Unified form control components — used identically across every form on the site.
 * Every data-entry field that appears in more than one place lives here.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  CAR_MAKES, CAR_MODELS, CAR_TRIMS,
  CONDITIONS,
  FUEL_TYPES, GEAR_TYPES, CAR_TYPES, QATAR_CITIES,
  formatQAR, formatKM,
} from '@/lib/utils';
import type { MLEstimate } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Year tiles split: recent 8 shown by default, older revealed on demand */
const RECENT_YEARS = Array.from({ length: 8 }, (_, i) => 2025 - i);
const OLDER_YEARS  = Array.from({ length: 18 }, (_, i) => 2017 - i);

/** 6 KM buckets — each carries a display label and the midpoint value sent to the API */
export const KM_BUCKETS = [
  { label: 'Under 20k',  value: 10_000  },
  { label: '20 – 50k',   value: 35_000  },
  { label: '50 – 80k',   value: 65_000  },
  { label: '80 – 120k',  value: 100_000 },
  { label: '120 – 200k', value: 160_000 },
  { label: 'Over 200k',  value: 220_000 },
] as const;

/** Price slider config: 10k – 600k in 5k steps */
const PRICE_MIN  = 10_000;
const PRICE_MAX  = 600_000;
const PRICE_STEP = 5_000;

// ─── Shared dropdown style ────────────────────────────────────────────────────
const SELECT_CLS =
  'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white ' +
  'focus:outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10 ' +
  'appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ' +
  'transition-colors hover:border-gray-300';

// ─── MakeSelect ───────────────────────────────────────────────────────────────
export function MakeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (make: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={SELECT_CLS}
      >
        <option value="">Select make…</option>
        {CAR_MAKES.map(make => (
          <option key={make} value={make}>{make}</option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

// ─── ModelSelect ──────────────────────────────────────────────────────────────
export function ModelSelect({
  make,
  value,
  onChange,
}: {
  make: string;
  value: string;
  onChange: (model: string) => void;
}) {
  const models = make ? (CAR_MODELS[make] ?? []) : [];

  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={!make || models.length === 0}
        className={SELECT_CLS}
      >
        <option value="">{make ? 'Select model…' : 'Select make first'}</option>
        {models.map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

// ─── TrimSelect ───────────────────────────────────────────────────────────────
export function TrimSelect({
  model,
  value,
  onChange,
}: {
  model: string;
  value: string;
  onChange: (trim: string) => void;
}) {
  const trims = model ? (CAR_TRIMS[model] ?? []) : [];

  if (!model || trims.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-bold text-gray-700 mb-2">
        Trim <span className="text-gray-400 font-normal text-xs">(optional — improves accuracy)</span>
      </p>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={SELECT_CLS}
        >
          <option value="">Any trim</option>
          {trims.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  );
}

// ─── YearTiles ────────────────────────────────────────────────────────────────
/** Tile grid of years — recent 8 visible, older expand on demand */
export function YearTiles({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (year: number) => void;
}) {
  const [showOlder, setShowOlder] = useState(false);

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {RECENT_YEARS.map(y => (
          <button
            key={y}
            type="button"
            onClick={() => onChange(y)}
            className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
              value === y
                ? 'border-[#003087] bg-[#003087] text-white'
                : 'border-gray-200 hover:border-[#003087] text-gray-700'
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowOlder(v => !v)}
        className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-[#003087] transition-colors font-medium"
      >
        {showOlder ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {showOlder ? 'Hide older years' : 'Older than 2018'}
      </button>

      <AnimatePresence>
        {showOlder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-5 gap-2 mt-2">
              {OLDER_YEARS.map(y => (
                <button
                  key={y}
                  type="button"
                  onClick={() => onChange(y)}
                  className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                    value === y
                      ? 'border-[#003087] bg-[#003087] text-white'
                      : 'border-gray-200 hover:border-[#003087] text-gray-600'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── KmBucketPicker ───────────────────────────────────────────────────────────
/** 6 visual KM bucket buttons — no free-text fallback */
export function KmBucketPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (km: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {KM_BUCKETS.map(b => (
        <button
          key={b.label}
          type="button"
          onClick={() => onChange(b.value)}
          className={`py-2.5 rounded-xl border-2 text-xs font-semibold transition-all text-center ${
            value === b.value
              ? 'border-[#003087] bg-[#003087] text-white'
              : 'border-gray-200 hover:border-[#003087] text-gray-600'
          }`}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}

/** Returns the human-readable label for a KM bucket value, or the formatted raw km. */
export function kmLabel(km: number | null): string {
  if (km == null) return '';
  const bucket = KM_BUCKETS.find(b => b.value === km);
  return bucket ? bucket.label : formatKM(km);
}

// ─── ConditionPicker ──────────────────────────────────────────────────────────
/** 2×2 grid of condition card buttons */
export function ConditionPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {CONDITIONS.map(c => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          className={`p-3 rounded-xl border-2 text-left transition-all ${
            value === c.value
              ? 'border-[#003087] bg-[#e8f0fd]'
              : 'border-gray-200 hover:border-[#003087]'
          }`}
        >
          <div className={`text-sm font-bold ${value === c.value ? 'text-[#003087]' : 'text-gray-900'}`}>
            {c.label}
          </div>
          <div className="text-xs text-gray-400 mt-0.5 leading-tight">{c.description}</div>
        </button>
      ))}
    </div>
  );
}

// ─── CityPicker ───────────────────────────────────────────────────────────────
/** Pill-chip row of Qatar cities */
export function CityPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {QATAR_CITIES.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
            value === c
              ? 'border-[#003087] bg-[#003087] text-white'
              : 'border-gray-200 text-gray-600 hover:border-[#003087]'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

// ─── PillGroupPicker ──────────────────────────────────────────────────────────
/** Generic pill-chip list — used for Fuel, Gear, Body type */
export function PillGroupPicker({
  options,
  value,
  onChange,
  multi = false,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  multi?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(multi ? opt : (value === opt ? '' : opt))}
          className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
            value === opt
              ? 'border-[#003087] bg-[#003087] text-white'
              : 'border-gray-200 text-gray-600 hover:border-[#003087] hover:text-[#003087]'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── PriceSlider ──────────────────────────────────────────────────────────────
/** Price input as a slider — consistent across every price field on the site */
export function PriceSlider({
  value,
  onChange,
  label = 'Price (QAR)',
  hint,
  minValue = PRICE_MIN,
  maxValue = PRICE_MAX,
  step = PRICE_STEP,
}: {
  value: number | null;
  onChange: (v: number) => void;
  label?: string;
  hint?: React.ReactNode;
  minValue?: number;
  maxValue?: number;
  step?: number;
}) {
  const display = value ?? minValue;
  const pct = ((display - minValue) / (maxValue - minValue)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-gray-700">{label}</span>
        <span className="text-lg font-black text-[#003087]">{formatQAR(display)}</span>
      </div>
      <input
        type="range"
        min={minValue}
        max={maxValue}
        step={step}
        value={display}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#003087]"
        style={{
          background: `linear-gradient(to right, #003087 ${pct}%, #e5e7eb ${pct}%)`,
        }}
      />
      <div className="flex justify-between mt-1 text-[10px] text-gray-400">
        <span>{formatQAR(minValue)}</span>
        <span>{formatQAR(maxValue)}</span>
      </div>
      {hint && <div className="mt-2">{hint}</div>}
    </div>
  );
}

// ─── PriceBandDisplay ─────────────────────────────────────────────────────────
/** Displays an MLEstimate price as a range band — the canonical price output UI */
export function PriceBandDisplay({ estimate }: { estimate: MLEstimate }) {
  const low  = Math.round(estimate.confidence_range[0]);
  const high = Math.round(estimate.confidence_range[1]);
  const mid  = Math.round(estimate.estimated_price_qar);
  const rangeWidth = high - low;
  const pct = rangeWidth > 0 ? (((mid - low) / rangeWidth) * 100).toFixed(0) : '50';

  return (
    <div>
      {/* AI badge */}
      <div className="flex items-center justify-center gap-1.5 mb-5">
        <span className="inline-flex items-center gap-1 bg-[#003087] text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-wide uppercase">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-80">
            <circle cx="5" cy="5" r="4" stroke="white" strokeWidth="1.5"/>
            <path d="M5 3v2l1.5 1" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          AI Valuation
        </span>
      </div>

      {/* Three-stat row: Low / Estimate / High */}
      <div className="grid grid-cols-3 gap-0 mb-5">
        <div className="text-center px-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Low</p>
          <p className="text-lg font-bold text-gray-500">{formatQAR(low)}</p>
        </div>
        <div className="text-center border-x border-gray-100 px-2">
          <p className="text-[11px] font-semibold text-[#003087] uppercase tracking-wide mb-1">Estimate</p>
          <p className="text-2xl font-black text-gray-900">{formatQAR(mid)}</p>
        </div>
        <div className="text-center px-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">High</p>
          <p className="text-lg font-bold text-gray-500">{formatQAR(high)}</p>
        </div>
      </div>

      {/* Visual range bar */}
      <div className="mx-auto max-w-xs mb-5">
        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-300 via-[#003087] to-gray-300 rounded-full" />
          <div
            className="absolute top-[-2px] bottom-[-2px] w-1 rounded-full bg-[#003087] ring-2 ring-white shadow"
            style={{ left: `calc(${pct}% - 2px)` }}
          />
        </div>
      </div>

      {/* Accuracy badges */}
      <div className="flex flex-wrap justify-center gap-2">
        <span className="bg-[#e8f0fd] text-[#003087] text-[11px] font-bold px-3 py-1 rounded-full">
          {(100 - estimate.mape).toFixed(0)}% accuracy
        </span>
        <span className="bg-gray-100 text-gray-500 text-[11px] font-semibold px-3 py-1 rounded-full capitalize">
          {estimate.segment}
        </span>
        <span className="bg-gray-100 text-gray-500 text-[11px] font-semibold px-3 py-1 rounded-full">
          ±{((rangeWidth / 2 / mid) * 100).toFixed(1)}% range
        </span>
      </div>
    </div>
  );
}
