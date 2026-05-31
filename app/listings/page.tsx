'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, MapPin, Fuel, Car, X,
  ExternalLink, ChevronDown, ChevronUp, Zap, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getListings, Listing, imgProxyUrl } from '@/lib/api';
import { formatQAR, formatKM, CAR_MAKES } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'price_asc',   label: 'Price: Low → High' },
  { value: 'price_desc',  label: 'Price: High → Low' },
  { value: 'year_desc',   label: 'Newest First' },
  { value: 'km_asc',      label: 'Lowest KM' },
  { value: 'created_desc', label: 'Recently Added' },
];

const YEAR_MIN = 2000;
const YEAR_MAX = new Date().getFullYear() + 1;

function CarCard({ car }: { car: Listing }) {
  const [imgErr, setImgErr] = useState(false);
  const thumb = car.main_image_url && !imgErr ? imgProxyUrl(car.main_image_url) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
    >
      {/* Image */}
      <div className="aspect-[16/10] bg-gray-100 relative overflow-hidden">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={car.title}
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car size={40} className="text-gray-300" />
          </div>
        )}
        {car.seller_type === 'dealer' && (
          <span className="absolute top-2 left-2 bg-[#003087] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Dealer
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
          {car.title}
        </h3>

        <div className="flex items-center gap-3 text-xs text-gray-400 mt-2 flex-wrap">
          {car.manufacture_year && <span>{car.manufacture_year}</span>}
          {car.km != null && <span>{formatKM(car.km)}</span>}
          {car.city && (
            <span className="flex items-center gap-0.5">
              <MapPin size={11} /> {car.city}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-[#003087] font-black text-base">{formatQAR(car.price_qar)}</span>
          <Link
            href={`/listings/${car.product_id}`}
            className="flex items-center gap-1 text-xs font-semibold text-[#ff6600] hover:text-[#e05a00] transition-colors"
          >
            View <ExternalLink size={11} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function BrowseCarsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BrowseCarsInner />
    </Suspense>
  );
}

function BrowseCarsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter state — initialise from URL params
  const [search,    setSearch]    = useState(searchParams.get('search') || '');
  const [make,      setMake]      = useState(searchParams.get('make') || '');
  const [minYear,   setMinYear]   = useState(searchParams.get('min_year') || '');
  const [maxYear,   setMaxYear]   = useState(searchParams.get('max_year') || '');
  const [minPrice,  setMinPrice]  = useState(searchParams.get('min_price') || '');
  const [maxPrice,  setMaxPrice]  = useState(searchParams.get('max_price') || '');
  const [city,      setCity]      = useState(searchParams.get('city') || '');
  const [sort,      setSort]      = useState(searchParams.get('sort') || 'created_desc');
  const [dealsOnly, setDealsOnly] = useState(searchParams.get('deals_only') === '1');

  const [cars,       setCars]       = useState<Listing[]>([]);
  const [makes,      setMakes]      = useState<string[]>([]);
  const [cities,     setCities]     = useState<string[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = [make, minYear, maxYear, minPrice, maxPrice, city, dealsOnly ? '1' : ''].filter(Boolean).length;

  const fetchCars = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getListings({
        search:    search    || undefined,
        make:      make      || undefined,
        city:      city      || undefined,
        sort:      sort      || undefined,
        min_year:  minYear   ? Number(minYear)  : undefined,
        max_year:  maxYear   ? Number(maxYear)  : undefined,
        min_price: minPrice  ? Number(minPrice) : undefined,
        max_price: maxPrice  ? Number(maxPrice) : undefined,
        deals_only: dealsOnly ? '1' : '0',
        limit: 120,
      });
      setCars(res.rows || []);
      if (res.makes?.length)  setMakes(res.makes);
      if (res.cities?.length) setCities(res.cities);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [search, make, city, sort, minYear, maxYear, minPrice, maxPrice, dealsOnly]);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  function clearFilters() {
    setMake(''); setMinYear(''); setMaxYear('');
    setMinPrice(''); setMaxPrice(''); setCity(''); setDealsOnly(false);
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087] bg-white';
  const selectCls = inputCls + ' appearance-none';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero strip */}
      <div className="bg-[#003087] text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-black mb-1">Browse Cars</h1>
          <p className="text-blue-200 text-sm">Dealer inventory across Qatar — find your next car</p>

          {/* Main search bar */}
          <div className="mt-5 flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchCars()}
                placeholder="Search by make, model, title…"
                className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff6600]"
              />
            </div>
            <button
              onClick={fetchCars}
              className="bg-[#ff6600] hover:bg-[#e05a00] text-white text-sm font-bold px-5 rounded-xl transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Filter bar */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort */}
            <div className="relative">
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087]">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Make quick filter */}
            <div className="relative">
              <select value={make} onChange={e => setMake(e.target.value)}
                className="pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087]">
                <option value="">All Makes</option>
                {(makes.length ? makes : CAR_MAKES).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Deals toggle */}
            <button
              onClick={() => setDealsOnly(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                dealsOnly ? 'bg-[#ff6600] text-white border-[#ff6600]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#003087]'
              }`}
            >
              <Zap size={13} /> Good Deals Only
            </button>

            {/* Advanced filters toggle */}
            <button
              onClick={() => setFiltersOpen(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors relative ${
                filtersOpen ? 'bg-[#003087] text-white border-[#003087]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#003087]'
              }`}
            >
              <SlidersHorizontal size={13} /> Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#ff6600] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              {filtersOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                <X size={12} /> Clear filters
              </button>
            )}
          </div>

          <span className="text-sm text-gray-400">
            {loading ? 'Loading…' : `${cars.length} car${cars.length !== 1 ? 's' : ''} found`}
          </span>
        </div>

        {/* Expanded filter panel */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-white rounded-2xl border border-gray-100 p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">City</label>
                  <select value={city} onChange={e => setCity(e.target.value)} className={selectCls}>
                    <option value="">All Cities</option>
                    {(cities.length ? cities : ['Doha','Al Rayyan','Al Wakrah','Lusail','Al Khor']).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Min Year</label>
                  <input type="number" value={minYear} onChange={e => setMinYear(e.target.value)} min={YEAR_MIN} max={YEAR_MAX} placeholder={String(YEAR_MIN)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Max Year</label>
                  <input type="number" value={maxYear} onChange={e => setMaxYear(e.target.value)} min={YEAR_MIN} max={YEAR_MAX} placeholder={String(YEAR_MAX)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Min Price (QAR)</label>
                  <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0" min={0} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Max Price (QAR)</label>
                  <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Any" min={0} className={inputCls} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-4 border border-red-100">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-1/3 mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-24">
            <Car size={48} className="text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-400">No cars found</h3>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search term.</p>
            <button onClick={clearFilters} className="mt-4 px-5 py-2 bg-[#003087] text-white text-sm font-semibold rounded-xl hover:bg-[#002570] transition-colors">
              Clear Filters
            </button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {cars.map(car => <CarCard key={car.product_id} car={car} />)}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
