'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Fuel, Zap, ChevronLeft as Prev, ChevronRight as Next, CreditCard, Calculator, RefreshCw, MessageSquare, BarChart2, CheckSquare, Square } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getWakalatCar, WakalatCarDetail, wakalatImageUrl, createOfferRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatQAR } from '@/lib/utils';
import { COMPARE_KEY, MAX_COMPARE } from '../compare/page';

function calcMonthlyPayment(price: number, downPayment: number, annualRate: number, termMonths: number): number {
  const principal = price - downPayment;
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualRate === 0) return principal / termMonths;
  const r = annualRate / 100 / 12;
  return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

export default function CarDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { ensureGuestToken } = useAuth();
  const [car, setCar] = useState<WakalatCarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [selectedTrim, setSelectedTrim] = useState(0);

  // Finance calculator
  const [downPayment, setDownPayment] = useState('');
  const [loanTerm, setLoanTerm] = useState('60');
  const [interestRate, setInterestRate] = useState('4.5');

  // Compare state — mirrors listing page's CompareCar shape
  const [compareList, setCompareList] = useState<string[]>([]);
  const isCompared = slug ? compareList.includes(slug) : false;
  const compareDisabled = compareList.length >= MAX_COMPARE && !isCompared;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COMPARE_KEY);
      if (!saved) return;
      // Support both old string format and new JSON array format
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed[0]?.slug) {
          setCompareList(parsed.map((c: { slug: string }) => c.slug).slice(0, MAX_COMPARE));
          return;
        }
      } catch { /* not JSON, fall through */ }
      setCompareList(saved.split(',').filter(Boolean).slice(0, MAX_COMPARE));
    } catch { /* ok */ }
  }, []);

  function toggleCompare() {
    if (!slug || !car) return;
    const thumbnail = car.images?.find(i => i.type === 'card' || i.type === 'detail')?.url
      ?? car.image_urls_json?.[0]
      ?? null;
    try {
      const saved = localStorage.getItem(COMPARE_KEY);
      let items: { slug: string; name: string; thumbnail: string | null; price: number | null }[] = [];
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed[0]?.slug) items = parsed;
        } catch { /* ok */ }
      }
      if (items.some(c => c.slug === slug)) {
        items = items.filter(c => c.slug !== slug);
      } else {
        if (items.length >= MAX_COMPARE) return;
        items = [...items, {
          slug,
          name: `${car.year} ${car.make} ${car.model}`,
          thumbnail,
          price: car.base_price_qar ?? null,
        }];
      }
      localStorage.setItem(COMPARE_KEY, JSON.stringify(items));
      setCompareList(items.map(c => c.slug));
    } catch { /* ok */ }
  }

  // Contact Dealer — fire-and-forget dealer_inquiry, then open WhatsApp
  const handleContactDealer = useCallback(async () => {
    if (!car) return;
    const waUrl = `https://wa.me/?text=Hi%2C+I%27m+interested+in+the+${encodeURIComponent(`${car.year} ${car.make} ${car.model}`)}+listed+on+InstaOffer`;
    // Open WhatsApp immediately — do not block on API call
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    // Fire-and-forget: log the inquiry as an opportunity
    try {
      const guestToken = await ensureGuestToken();
      await createOfferRequest({
        make: car.make,
        class_name: car.model,
        year: car.year ?? undefined,
        km: 0,
        condition: 'new',
        city: 'Doha',
        lead_type: 'dealer_inquiry',
        description: `Dealer inquiry for ${car.year ?? ''} ${car.make} ${car.model}${car.dealer ? ` at ${car.dealer}` : ''}. Target car ID: ${car.car_id}`,
      }, guestToken ?? undefined);
    } catch {
      // Silently ignore — WhatsApp already opened
    }
  }, [car, ensureGuestToken]);

  useEffect(() => {
    if (!slug) return;
    getWakalatCar(slug)
      .then(res => setCar(res.car))
      .catch(() => setCar(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!car) return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 font-medium">Car not found</p>
        <Link href="/listings" className="text-[#003087] font-semibold hover:underline flex items-center gap-1">
          <ChevronLeft size={16} /> Browse Vehicles
        </Link>
      </div>
    </div>
  );

  const images = car.images?.filter(i => i.type === 'detail' || i.type === 'card') ?? [];
  const allImgUrls = images.length > 0
    ? images.map(i => wakalatImageUrl(i.url))
    : car.image_urls_json?.map(wakalatImageUrl) ?? [];

  const trimPrice = car.trims?.[selectedTrim]?.price_qar ?? car.base_price_qar;
  const monthly = trimPrice ? calcMonthlyPayment(trimPrice, Number(downPayment || 0), Number(interestRate), Number(loanTerm)) : 0;

  const specs = [
    { label: 'Engine', value: car.engine },
    { label: 'Horsepower', value: car.horsepower_hp ? `${car.horsepower_hp} HP` : null },
    { label: 'Torque', value: car.torque_nm ? `${car.torque_nm} Nm` : null },
    { label: '0–100 km/h', value: car.accel_0_100_s ? `${car.accel_0_100_s}s` : null },
    { label: 'Top Speed', value: car.top_speed_kmh ? `${car.top_speed_kmh} km/h` : null },
    { label: 'Fuel Consumption', value: car.fuel_consumption_l100 ? `${car.fuel_consumption_l100} L/100km` : null },
    { label: 'Fuel Tank', value: car.tank_l ? `${car.tank_l} L` : null },
    { label: 'Battery', value: car.battery_kwh ? `${car.battery_kwh} kWh` : null },
    { label: 'Displacement', value: car.displacement_cc ? `${car.displacement_cc} cc` : null },
    { label: 'Transmission', value: car.transmission },
    { label: 'Drivetrain', value: car.drivetrain },
    { label: 'Body Type', value: car.body_type },
    { label: 'Dimensions', value: car.dimensions_mm },
  ].filter(s => s.value);

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />
      <div className="max-w-5xl mx-auto w-full px-4 py-6 flex-1">
        {/* Back */}
        <Link href="/listings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#003087] font-medium mb-5 transition-colors">
          <ChevronLeft size={16} /> Browse Vehicles
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Images */}
          <div>
            <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm aspect-[4/3]">
              {allImgUrls.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={allImgUrls[imgIndex]} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-200 text-6xl">🚗</div>
              )}
              {allImgUrls.length > 1 && (
                <>
                  <button onClick={() => setImgIndex(i => (i - 1 + allImgUrls.length) % allImgUrls.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow transition-all">
                    <Prev size={18} className="text-gray-700" />
                  </button>
                  <button onClick={() => setImgIndex(i => (i + 1) % allImgUrls.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow transition-all">
                    <Next size={18} className="text-gray-700" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {allImgUrls.map((_, i) => (
                      <button key={i} onClick={() => setImgIndex(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIndex ? 'bg-white w-4' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {allImgUrls.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {allImgUrls.slice(0, 8).map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt="" onClick={() => setImgIndex(i)}
                    className={`w-16 h-12 object-cover rounded-lg cursor-pointer border-2 flex-shrink-0 transition-all ${i === imgIndex ? 'border-[#003087]' : 'border-transparent opacity-60 hover:opacity-100'}`} />
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div>
            <p className="text-sm text-gray-400 font-medium">{car.dealer}</p>
            <h1 className="text-2xl font-black text-gray-900 mt-0.5">{car.year} {car.make} {car.model}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {car.fuel_type && (
                <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  car.fuel_type === 'Electric' ? 'bg-green-100 text-green-700' :
                  car.fuel_type === 'Hybrid' ? 'bg-teal-100 text-teal-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {car.fuel_type === 'Electric' || car.fuel_type === 'Hybrid' ? <Zap size={11} /> : <Fuel size={11} />}
                  {car.fuel_type}
                </span>
              )}
              {car.body_type && <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-semibold">{car.body_type.replace(' Cars', '')}</span>}
              {car.transmission && <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-semibold">{car.transmission}</span>}
            </div>

            {/* Trims */}
            {car.trims && car.trims.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Trim</h3>
                <div className="flex flex-wrap gap-2">
                  {car.trims.map((trim, i) => (
                    <button key={i} onClick={() => setSelectedTrim(i)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${selectedTrim === i ? 'bg-[#003087] text-white border-[#003087]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#003087]'}`}>
                      {trim.name}
                      {trim.price_qar && <span className="ml-1.5 text-xs opacity-75">{formatQAR(trim.price_qar)}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="mt-5 bg-[#003087]/5 rounded-2xl p-4">
              <div className="text-3xl font-black text-[#003087]">
                {trimPrice ? formatQAR(trimPrice) : 'Price on request'}
              </div>
              {trimPrice && <p className="text-xs text-gray-500 mt-0.5">Starting price · VAT may apply</p>}
            </div>

            {/* Primary CTAs */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={handleContactDealer}
                className="flex flex-col items-center gap-1.5 bg-[#003087] hover:bg-[#002070] text-white font-bold px-4 py-3.5 rounded-2xl text-sm transition-colors text-center"
              >
                <MessageSquare size={18} />
                <span>Contact Dealer</span>
                <span className="text-xs font-normal opacity-75">Ask about this vehicle</span>
              </button>
              <Link
                href={`/trade-in?target_car_id=${car.car_id}&target_slug=${car.slug}&target_name=${encodeURIComponent(`${car.year} ${car.make} ${car.model}`)}&target_price=${trimPrice ?? ''}&target_dealer=${encodeURIComponent(car.dealer ?? '')}`}
                className="flex flex-col items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-3.5 rounded-2xl text-sm transition-colors text-center"
              >
                <RefreshCw size={18} />
                <span>Trade In My Car</span>
                <span className="text-xs font-normal opacity-75">Use my car toward this</span>
              </Link>
            </div>

            {/* Compare button */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={toggleCompare}
                disabled={compareDisabled}
                className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-2xl border transition-all ${
                  isCompared
                    ? 'bg-[#003087] text-white border-[#003087]'
                    : compareDisabled
                      ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                      : 'border-[#003087] text-[#003087] hover:bg-[#e8f0fd]'
                }`}
              >
                {isCompared ? <><CheckSquare size={16} /> Remove from Compare</> : <><Square size={16} /> Add to Compare</>}
              </button>
              {compareList.length >= 1 && (
                <Link
                  href={`/cars/compare?slugs=${compareList.join(',')}`}
                  className="flex items-center gap-1.5 text-sm font-bold text-white bg-[#ff6600] hover:bg-[#e65c00] px-4 py-2.5 rounded-2xl transition-colors whitespace-nowrap"
                >
                  <BarChart2 size={15} />
                  Compare {compareList.length}
                </Link>
              )}
            </div>
            {compareDisabled && (
              <p className="text-xs text-orange-500 text-center mt-1">Max {MAX_COMPARE} cars — remove one to add this</p>
            )}

            <p className="text-xs text-gray-400 mt-2 text-center">
              Trade-in: get an estimated value for your car and send one combined request to this dealer.
            </p>
            {trimPrice && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 bg-white rounded-2xl border border-gray-100 p-4">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <Calculator size={15} className="text-[#003087]" /> Finance Calculator
                </h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-gray-400 font-medium block mb-1">Down Payment</label>
                    <input type="number" value={downPayment} onChange={e => setDownPayment(e.target.value)}
                      placeholder="QAR 0"
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#003087]" />
                  </div>
                  <div>
                    <label className="text-gray-400 font-medium block mb-1">Term</label>
                    <select value={loanTerm} onChange={e => setLoanTerm(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#003087]">
                      {[12,24,36,48,60,72,84].map(m => <option key={m} value={m}>{m}mo</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 font-medium block mb-1">Rate %</label>
                    <input type="number" step="0.1" value={interestRate} onChange={e => setInterestRate(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#003087]" />
                  </div>
                </div>
                {monthly > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
                    <CreditCard size={15} className="text-[#003087]" />
                    <span className="text-sm text-gray-600">Est. monthly payment:</span>
                    <span className="text-lg font-black text-[#003087]">{formatQAR(Math.round(monthly))}/mo</span>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Specs */}
        {specs.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4 text-lg">Specifications</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {specs.map(s => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        {car.features_json && car.features_json.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4 text-lg">Features</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {car.features_json.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-[#003087] mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trim features */}
        {car.trims?.[selectedTrim]?.features?.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4 text-lg">{car.trims[selectedTrim].name} — Included Features</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {car.trims[selectedTrim].features.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-[#ff6600] mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
