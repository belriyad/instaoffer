'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Car, DollarSign, MapPin, FileText, Phone, User,
  Upload, X, CheckCircle2, AlertCircle, ChevronRight, Info,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { createListing, uploadFile, ListingCreate } from '@/lib/api';
import { QATAR_CITIES, formatQAR } from '@/lib/utils';
import { MakeSelect, ModelSelect, TrimSelect, YearTiles, KmBucketPicker, kmLabel } from '@/lib/form-controls';

const SELLER_TYPES   = [{ value: 'private', label: 'Private Seller' }, { value: 'dealer', label: 'Dealer / Company' }];
const WARRANTY_OPTS  = ['Under Warranty', 'Expired Warranty', 'No Warranty', 'Extended Warranty'];
const FUEL_TYPES     = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const GEAR_TYPES     = ['Automatic', 'Manual'];
const CAR_TYPES      = ['Sedan', 'SUV', 'Pickup', 'Hatchback', 'Coupe', 'Van', 'Wagon', 'Convertible'];
const CYLINDERS      = [3, 4, 5, 6, 8, 10, 12];
const COLORS         = ['White', 'Black', 'Silver', 'Grey', 'Red', 'Blue', 'Brown', 'Beige', 'Gold', 'Other'];
const MAX_PHOTOS     = 6;

export default function NewListingPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [make,        setMake]        = useState('');
  const [className,   setClassName]   = useState('');
  const [model,       setModel]       = useState('');
  const [trim,        setTrim]        = useState('');
  const [year,        setYear]        = useState<number | null>(null);
  const [km,          setKm]          = useState<number | null>(null);
  const [color,       setColor]       = useState('');
  const [carType,     setCarType]     = useState('');
  const [fuelType,    setFuelType]    = useState('');
  const [gearType,    setGearType]    = useState('');
  const [cylinders,   setCylinders]   = useState('');
  const [warranty,    setWarranty]    = useState('');
  const [title,       setTitle]       = useState('');
  const [priceQar,    setPriceQar]    = useState('');
  const [city,        setCity]        = useState('Doha');
  const [description, setDescription] = useState('');
  const [sellerType,  setSellerType]  = useState<'private' | 'dealer'>('private');
  const [sellerName,  setSellerName]  = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [photos,       setPhotos]       = useState<{ file: File; preview: string }[]>([]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState(false);

  // Auto-build title
  useEffect(() => {
    if (make && className && year) {
      setTitle([year, make, className, model, trim].filter(Boolean).join(' '));
    }
  }, [make, className, model, trim, year]);

  // Pre-fill seller from auth user
  useEffect(() => {
    if (user?.full_name && !sellerName) setSellerName(user.full_name);
    if (user?.phone    && !sellerPhone) setSellerPhone(user.phone);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) router.push('/login?redirect=/listings/new');
  }, [user, loading, router]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const toAdd = files.slice(0, MAX_PHOTOS - photos.length).map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setPhotos(prev => [...prev, ...toAdd]);
  }

  function removePhoto(idx: number) {
    setPhotos(prev => { URL.revokeObjectURL(prev[idx].preview); return prev.filter((_, i) => i !== idx); });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const price = parseFloat(priceQar);
    if (!make || !className || !price) { setError('Please fill in Make, Model, and Price.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const urls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        setUploadingIdx(i);
        const res = await uploadFile(photos[i].file, token);
        urls.push(res.url);
      }
      setUploadingIdx(null);

      // Extra vehicle attributes packed into properties_json (swagger ListingCreate schema)
      const props = [
        trim    && { key: 'Trim',      value: trim },
        color   && { key: 'Color',     value: color },
        carType && { key: 'Car Type',  value: carType },
        fuelType && { key: 'Fuel Type', value: fuelType },
        gearType && { key: 'Gearbox',   value: gearType },
      ].filter(Boolean);

      const payload: ListingCreate = {
        title:            title || `${year ?? ''} ${make} ${className}`.trim(),
        price_qar:        price,
        make,
        class_name:       className,
        model:            model     || undefined,
        manufacture_year: year      ?? undefined,
        km:               km        ?? undefined,
        city:             city      || undefined,
        description:      description || undefined,
        seller_name:      sellerName || undefined,
        seller_phone:     sellerPhone || undefined,
        seller_type:      sellerType,
        warranty_status:  warranty  || undefined,
        cylinder_count:   cylinders ? Number(cylinders) : undefined,
        main_image_url:   urls[0]   || undefined,
        image_urls_json:  urls.length > 0 ? JSON.stringify(urls) : undefined,
        properties_json:  props.length > 0 ? JSON.stringify(props) : undefined,
      };

      await createListing(payload, token);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#002b5b] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Listing Created!</h1>
          <p className="text-gray-500 mb-8">Your car has been listed successfully. It will be reviewed and published shortly.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => router.push('/')}
              className="px-6 py-2.5 bg-[#002b5b] text-white text-sm font-semibold rounded-xl hover:bg-[#001a3d] transition-colors">
              Back to Home
            </button>
            <button onClick={() => { setSuccess(false); setMake(''); setClassName(''); setTitle(''); setPriceQar(''); setPhotos([]); }}
              className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              List Another Car
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const selectCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002b5b]/20 focus:border-[#002b5b] appearance-none bg-white';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Breadcrumb + header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <span className="cursor-pointer hover:text-[#002b5b]" onClick={() => router.push('/')}>Home</span>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium">New Listing</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">List Your Car</h1>
          <p className="text-gray-500 mt-1 text-sm">Fill in your car details to reach thousands of buyers across Qatar.</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1: Vehicle Details */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Car size={18} className="text-[#002b5b]" /> Vehicle Details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Make *</label>
                  <MakeSelect value={make} onChange={v => { setMake(v); setClassName(''); setModel(''); setTrim(''); }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Model *</label>
                  <ModelSelect make={make} value={className} onChange={v => { setClassName(v); setModel(''); setTrim(''); }} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Variant</label>
                  <input type="text" value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. Sport, Platinum"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002b5b]/20 focus:border-[#002b5b]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Trim</label>
                  <TrimSelect model={className} value={trim} onChange={setTrim} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                <YearTiles value={year} onChange={setYear} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mileage *</label>
                <KmBucketPicker value={km} onChange={setKm} />
                {km && <p className="text-xs text-gray-500 mt-1">{kmLabel(km)}</p>}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Color</label>
                  <select value={color} onChange={e => setColor(e.target.value)} className={selectCls}>
                    <option value="">Select</option>
                    {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Body Type</label>
                  <select value={carType} onChange={e => setCarType(e.target.value)} className={selectCls}>
                    <option value="">Select</option>
                    {CAR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fuel Type</label>
                  <select value={fuelType} onChange={e => setFuelType(e.target.value)} className={selectCls}>
                    <option value="">Select</option>
                    {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Gearbox</label>
                  <select value={gearType} onChange={e => setGearType(e.target.value)} className={selectCls}>
                    <option value="">Select</option>
                    {GEAR_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cylinders</label>
                  <select value={cylinders} onChange={e => setCylinders(e.target.value)} className={selectCls}>
                    <option value="">Select</option>
                    {CYLINDERS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Warranty</label>
                  <select value={warranty} onChange={e => setWarranty(e.target.value)} className={selectCls}>
                    <option value="">Select</option>
                    {WARRANTY_OPTS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section 2: Listing Details */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
              <DollarSign size={18} className="text-[#002b5b]" /> Listing Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Listing Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. 2022 Toyota Land Cruiser GXR" required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002b5b]/20 focus:border-[#002b5b]" />
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Info size={11} /> Auto-filled from vehicle details — you can edit it</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Asking Price (QAR) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">QAR</span>
                  <input type="number" value={priceQar} onChange={e => setPriceQar(e.target.value)} placeholder="e.g. 120000" required min={1000}
                    className="w-full pl-14 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002b5b]/20 focus:border-[#002b5b]" />
                </div>
                {priceQar && Number(priceQar) >= 1000 && <p className="text-xs text-[#002b5b] mt-1 font-medium">{formatQAR(Number(priceQar))}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select value={city} onChange={e => setCity(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002b5b]/20 focus:border-[#002b5b] appearance-none bg-white">
                    {QATAR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                  placeholder="Describe your car — service history, condition, extras, reason for selling…"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002b5b]/20 focus:border-[#002b5b] resize-none" />
              </div>
            </div>
          </motion.div>

          {/* Section 3: Photos */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Upload size={18} className="text-[#002b5b]" /> Photos
            </h2>
            <p className="text-xs text-gray-400 mb-4">Up to {MAX_PHOTOS} photos. First photo is the cover image.</p>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                  {uploadingIdx === i && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {i === 0 && <span className="absolute top-1.5 left-1.5 bg-[#002b5b] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Cover</span>}
                  <button type="button" onClick={() => removePhoto(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#002b5b] hover:bg-blue-50/30 transition-colors">
                  <Upload size={20} className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-400">Add Photo</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                </label>
              )}
            </div>
          </motion.div>

          {/* Section 4: Seller Info */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
              <User size={18} className="text-[#002b5b]" /> Seller Info
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seller Type</label>
                <div className="flex gap-2">
                  {SELLER_TYPES.map(st => (
                    <button key={st.value} type="button" onClick={() => setSellerType(st.value as 'private' | 'dealer')}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${sellerType === st.value ? 'bg-[#002b5b] text-white border-[#002b5b]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#002b5b]'}`}>
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={sellerName} onChange={e => setSellerName(e.target.value)} placeholder="Contact name"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002b5b]/20 focus:border-[#002b5b]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={sellerPhone} onChange={e => setSellerPhone(e.target.value)} placeholder="+974 XXXX XXXX"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002b5b]/20 focus:border-[#002b5b]" />
                </div>
              </div>
            </div>
          </motion.div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <motion.button type="submit" disabled={submitting} whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 bg-[#002b5b] text-white font-bold text-sm rounded-2xl hover:bg-[#001a3d] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-md">
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {uploadingIdx !== null ? `Uploading photo ${uploadingIdx + 1} of ${photos.length}…` : 'Creating listing…'}
              </>
            ) : (
              <><FileText size={17} /> Publish Listing</>
            )}
          </motion.button>

          <p className="text-xs text-gray-400 text-center">
            By publishing, you agree to our{' '}
            <span className="text-[#002b5b] cursor-pointer hover:underline" onClick={() => router.push('/terms')}>Terms of Service</span>.
          </p>
        </form>
      </div>
      <Footer />
    </div>
  );
}
