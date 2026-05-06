'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  Fuel, Zap, Car, Calculator, CreditCard, Banknote, ChevronDown, ChevronUp,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  getWakalatFilters, getWakalatCars,
  WakalatFilterOptions, WakalatCarSummary, WakalatCarsParams,
  wakalatImageUrl,
} from '@/lib/api';
import { formatQAR } from '@/lib/utils';

// ─── Finance calculator ───────────────────────────────────────────────────────
function calcMonthlyPayment(price: number, downPayment: number, annualRate: number, termMonths: number): number {
  const principal = price - downPayment;
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualRate === 0) return principal / termMonths;
  const r = annualRate / 100 / 12;
  return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

// ─── Budget mode ──────────────────────────────────────────────────────────────
type BudgetMode = 'cash' | 'finance';

const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'year_desc', label: 'Newest First' },
  { value: 'year_asc', label: 'Oldest First' },
  { value: 'make_asc', label: 'Make A–Z' },
] as const;

const FUEL_ICONS: Record<string, React.ReactNode> = {
  Electric: <Zap size={12} />,
  Hybrid: <Zap size={12} />,
};

export default function CarsPage() {
  const [filters, setFilters] = useState<WakalatFilterOptions | null>(null);
  const [cars, setCars] = useState<WakalatCarSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const perPage = 24;

  // ── Search & filter state ──
  const [q, setQ] = useState('');
  const [selMakes, setSelMakes] = useState<string[]>([]);
  const [selModels, setSelModels] = useState<string[]>([]);
  const [selDealers, setSelDealers] = useState<string[]>([]);
  const [selBodyTypes, setSelBodyTypes] = useState<string[]>([]);
  const [selFuelTypes, setSelFuelTypes] = useState<string[]>([]);
  const [selTransmissions, setSelTransmissions] = useState<string[]>([]);
  const [selDrivetrains, setSelDrivetrains] = useState<string[]>([]);
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [sort, setSort] = useState<WakalatCarsParams['sort']>('price_asc');

  // ── Budget mode ──
  const [budgetMode, setBudgetMode] = useState<BudgetMode>('cash');
  const [cashBudget, setCashBudget] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [loanTerm, setLoanTerm] = useState('60');
  const [interestRate, setInterestRate] = useState('4.5');
  const [monthlyBudget, setMonthlyBudget] = useState('');

  // Computed: max price from finance inputs
  const maxPriceFromFinance = (() => {
    const monthly = Number(monthlyBudget);
    const dp = Number(downPayment);
    const term = Number(loanTerm);
    const rate = Number(interestRate);
    if (!monthly || !term) return undefined;
    if (rate === 0) return dp + monthly * term;
    const r = rate / 100 / 12;
    const principal = (monthly * (Math.pow(1 + r, term) - 1)) / (r * Math.pow(1 + r, term));
    return Math.round(dp + principal);
  })();

  // ── Fetch ──
  const fetchCars = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params: WakalatCarsParams = {
        page: pg,
        per_page: perPage,
        sort,
        ...(q ? { q } : {}),
        ...(selMakes.length ? { make: selMakes.join(',') } : {}),
        ...(selModels.length ? { model: selModels.join(',') } : {}),
        ...(selDealers.length ? { dealer: selDealers.join(',') } : {}),
        ...(selBodyTypes.length ? { body_type: selBodyTypes.join(',') } : {}),
        ...(selFuelTypes.length ? { fuel_type: selFuelTypes.join(',') } : {}),
        ...(selTransmissions.length ? { transmission: selTransmissions.join(',') } : {}),
        ...(selDrivetrains.length ? { drivetrain: selDrivetrains.join(',') } : {}),
        ...(yearMin ? { year_min: Number(yearMin) } : {}),
        ...(yearMax ? { year_max: Number(yearMax) } : {}),
      };

      // Budget filter
      if (budgetMode === 'cash' && cashBudget) {
        params.price_max = Number(cashBudget);
      } else if (budgetMode === 'finance' && maxPriceFromFinance) {
        params.price_max = maxPriceFromFinance;
      }

      const res = await getWakalatCars(params);
      setCars(res.cars);
      setTotal(res.total);
      setPage(res.page);
      setPages(res.pages);
    } catch {
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, [q, selMakes, selModels, selDealers, selBodyTypes, selFuelTypes, selTransmissions, selDrivetrains, yearMin, yearMax, sort, budgetMode, cashBudget, maxPriceFromFinance]);

  // Fetch filter options once
  useEffect(() => {
    getWakalatFilters().then(setFilters).catch(() => {});
  }, []);

  // Debounced search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { fetchCars(1); }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchCars]);

  // Toggle helpers
  function toggle(arr: string[], val: string, set: (v: string[]) => void) {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
    setPage(1);
  }

  const activeFilterCount = [
    selMakes, selModels, selDealers, selBodyTypes, selFuelTypes, selTransmissions, selDrivetrains,
  ].reduce((n, a) => n + a.length, 0) +
    (yearMin ? 1 : 0) + (yearMax ? 1 : 0) +
    (budgetMode === 'cash' && cashBudget ? 1 : 0) +
    (budgetMode === 'finance' && monthlyBudget ? 1 : 0);

  function clearAll() {
    setSelMakes([]); setSelModels([]); setSelDealers([]);
    setSelBodyTypes([]); setSelFuelTypes([]); setSelTransmissions([]); setSelDrivetrains([]);
    setYearMin(''); setYearMax('');
    setCashBudget(''); setMonthlyBudget(''); setDownPayment('');
    setQ('');
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />

      {/* Hero bar */}
      <div className="bg-[#003087] text-white py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black mb-1">New Cars in Qatar</h1>
          <p className="text-blue-200 text-sm">Browse new cars from authorised dealerships across Qatar</p>

          {/* Search bar */}
          <div className="mt-5 flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow">
              <Search size={18} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={q}
                onChange={e => { setQ(e.target.value); setPage(1); }}
                placeholder="Search make, model or dealer…"
                className="flex-1 text-gray-900 text-sm outline-none bg-transparent placeholder:text-gray-400"
              />
              {q && (
                <button onClick={() => { setQ(''); setPage(1); }}>
                  <X size={16} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${showFilters ? 'bg-[#ff6600] text-white' : 'bg-white text-[#003087]'}`}
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${showFilters ? 'bg-white text-[#ff6600]' : 'bg-[#003087] text-white'}`}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1">

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-6">

                {/* Budget toggle */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Calculator size={15} className="text-[#003087]" /> Budget
                    </h3>
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                      <button
                        onClick={() => setBudgetMode('cash')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${budgetMode === 'cash' ? 'bg-white shadow text-[#003087]' : 'text-gray-500'}`}
                      >
                        <Banknote size={13} /> Cash
                      </button>
                      <button
                        onClick={() => setBudgetMode('finance')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${budgetMode === 'finance' ? 'bg-white shadow text-[#003087]' : 'text-gray-500'}`}
                      >
                        <CreditCard size={13} /> Finance
                      </button>
                    </div>
                  </div>

                  {budgetMode === 'cash' ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          value={cashBudget}
                          onChange={e => { setCashBudget(e.target.value); setPage(1); }}
                          placeholder="Max budget (QAR)"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#003087]"
                        />
                        {cashBudget && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">QAR</span>
                        )}
                      </div>
                      {cashBudget && (
                        <div className="text-sm font-bold text-[#003087] whitespace-nowrap">
                          Up to {formatQAR(Number(cashBudget))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 font-medium block mb-1">Monthly Budget (QAR)</label>
                          <input
                            type="number"
                            value={monthlyBudget}
                            onChange={e => { setMonthlyBudget(e.target.value); setPage(1); }}
                            placeholder="e.g. 3500"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#003087]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-medium block mb-1">Down Payment (QAR)</label>
                          <input
                            type="number"
                            value={downPayment}
                            onChange={e => setDownPayment(e.target.value)}
                            placeholder="e.g. 20000"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#003087]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-medium block mb-1">Loan Term (months)</label>
                          <select
                            value={loanTerm}
                            onChange={e => setLoanTerm(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#003087]"
                          >
                            {[12, 24, 36, 48, 60, 72, 84].map(m => (
                              <option key={m} value={m}>{m} months ({m / 12}yr)</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-medium block mb-1">Interest Rate (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={interestRate}
                            onChange={e => setInterestRate(e.target.value)}
                            placeholder="e.g. 4.5"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#003087]"
                          />
                        </div>
                      </div>
                      {maxPriceFromFinance && monthlyBudget && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
                          <Calculator size={16} className="text-[#003087] flex-shrink-0" />
                          <div>
                            <span className="text-xs text-gray-500">Estimated max car price: </span>
                            <span className="font-black text-[#003087]">{formatQAR(maxPriceFromFinance)}</span>
                            <span className="text-xs text-gray-400 ml-2">
                              (QAR {Number(monthlyBudget).toLocaleString()}/mo × {loanTerm}m @ {interestRate}% + QAR {Number(downPayment || 0).toLocaleString()} down)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Filter grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <FilterGroup label="Make" items={filters?.makes ?? []} selected={selMakes} onToggle={v => toggle(selMakes, v, setSelMakes)} />
                  <FilterGroup label="Body Type" items={filters?.body_types ?? []} selected={selBodyTypes} onToggle={v => toggle(selBodyTypes, v, setSelBodyTypes)} />
                  <FilterGroup label="Fuel Type" items={filters?.fuel_types ?? []} selected={selFuelTypes} onToggle={v => toggle(selFuelTypes, v, setSelFuelTypes)} />
                  <FilterGroup label="Transmission" items={filters?.transmissions ?? []} selected={selTransmissions} onToggle={v => toggle(selTransmissions, v, setSelTransmissions)} />
                  <FilterGroup label="Drivetrain" items={filters?.drivetrains ?? []} selected={selDrivetrains} onToggle={v => toggle(selDrivetrains, v, setSelDrivetrains)} />
                  <FilterGroup label="Dealer" items={filters?.dealers ?? []} selected={selDealers} onToggle={v => toggle(selDealers, v, setSelDealers)} />
                </div>

                {/* Year range */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Year Range</h4>
                  <div className="flex items-center gap-2">
                    <input type="number" value={yearMin} onChange={e => { setYearMin(e.target.value); setPage(1); }} placeholder="From" className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#003087]" />
                    <span className="text-gray-400">–</span>
                    <input type="number" value={yearMax} onChange={e => { setYearMax(e.target.value); setPage(1); }} placeholder="To" className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#003087]" />
                  </div>
                </div>

                {/* Footer */}
                {activeFilterCount > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
                    <button onClick={clearAll} className="text-sm text-red-500 font-semibold hover:text-red-700 flex items-center gap-1">
                      <X size={14} /> Clear all
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="text-sm text-gray-600">
            {loading ? 'Loading…' : <><span className="font-bold text-gray-900">{total.toLocaleString()}</span> cars found</>}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={e => { setSort(e.target.value as WakalatCarsParams['sort']); setPage(1); }}
              className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#003087]"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Car grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-44 bg-gray-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-5 bg-gray-100 rounded w-1/3 mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : cars.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <Car size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="font-bold text-gray-700 text-lg mb-1">No cars found</p>
            <p className="text-gray-400 text-sm">Try adjusting your filters or search</p>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="mt-4 text-sm text-[#003087] font-semibold hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cars.map((car, i) => (
              <CarCard key={car.slug} car={car} index={i}
                financeMode={budgetMode === 'finance' && !!monthlyBudget}
                downPayment={Number(downPayment || 0)}
                loanTerm={Number(loanTerm)}
                interestRate={Number(interestRate)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => fetchCars(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-[#003087] hover:text-[#003087] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span className="text-sm text-gray-500 px-2">
              Page <span className="font-bold text-gray-900">{page}</span> of <span className="font-bold text-gray-900">{pages}</span>
            </span>
            <button
              onClick={() => fetchCars(page + 1)}
              disabled={page >= pages}
              className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-[#003087] hover:text-[#003087] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

// ─── Car card ─────────────────────────────────────────────────────────────────
function CarCard({
  car, index, financeMode, downPayment, loanTerm, interestRate
}: {
  car: WakalatCarSummary;
  index: number;
  financeMode: boolean;
  downPayment: number;
  loanTerm: number;
  interestRate: number;
}) {
  const monthly = car.base_price_qar
    ? calcMonthlyPayment(car.base_price_qar, downPayment, interestRate, loanTerm)
    : 0;

  const imgSrc = car.thumbnail ? wakalatImageUrl(car.thumbnail) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
    >
      <Link href={`/cars/${car.slug}`} className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-[#003087]/30 transition-all h-full">
        {/* Image */}
        <div className="relative h-44 bg-gray-50 overflow-hidden">
          {imgSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc}
              alt={`${car.year} ${car.make} ${car.model}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car size={48} className="text-gray-200" />
            </div>
          )}
          {/* Fuel badge */}
          {car.fuel_type && (
            <span className={`absolute top-2 right-2 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              car.fuel_type === 'Electric' ? 'bg-green-500 text-white' :
              car.fuel_type === 'Hybrid' ? 'bg-teal-500 text-white' :
              'bg-black/60 text-white'
            }`}>
              {FUEL_ICONS[car.fuel_type] ?? <Fuel size={11} />}
              {car.fuel_type}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-xs text-gray-400 font-medium mb-0.5">{car.dealer}</p>
          <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-[#003087] transition-colors">
            {car.year} {car.make} {car.model}
          </h3>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {car.body_type && <Tag>{car.body_type.replace(' Cars', '')}</Tag>}
            {car.transmission && <Tag>{car.transmission}</Tag>}
            {car.engine && <Tag>{car.engine}</Tag>}
          </div>

          {/* Price */}
          <div className="mt-3 pt-3 border-t border-gray-50">
            {car.base_price_qar ? (
              <>
                <div className="text-lg font-black text-[#003087]">{formatQAR(car.base_price_qar)}</div>
                {financeMode && monthly > 0 && (
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <CreditCard size={11} />
                    ~{formatQAR(Math.round(monthly))}/mo
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-400 font-medium">Price on request</div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Filter group ─────────────────────────────────────────────────────────────
function FilterGroup({ label, items, selected, onToggle }: {
  label: string;
  items: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const show = expanded ? items : items.slice(0, 6);

  if (!items.length) return null;

  return (
    <div>
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{label}</h4>
      <div className="flex flex-wrap gap-1.5">
        {show.map(item => (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              selected.includes(item)
                ? 'bg-[#003087] text-white border-[#003087]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#003087] hover:text-[#003087]'
            }`}
          >
            {item}
          </button>
        ))}
        {items.length > 6 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-400 hover:text-[#003087] flex items-center gap-1"
          >
            {expanded ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> +{items.length - 6} more</>}
          </button>
        )}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md border border-gray-100">
      {children}
    </span>
  );
}
