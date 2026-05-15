'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, ChevronRight, Car, AlertCircle, Lock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { getMyOfferRequests, OfferRequest } from '@/lib/api';
import { formatQAR, formatDate } from '@/lib/utils';
import { Suspense } from 'react';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-blue-50 text-blue-700' },
  under_offer: { label: 'Offer Received', color: 'bg-orange-50 text-orange-700' },
  accepted: { label: 'Accepted', color: 'bg-green-50 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700' },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-500' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500' },
  pending:   { label: 'Pending Review', color: 'bg-yellow-50 text-yellow-700' },
};

// ─── Unauthenticated teaser ───────────────────────────────────────────────────
function UnauthenticatedState() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">My Offers</h1>
          <p className="text-gray-500">See what dealers are willing to pay for your car</p>
        </motion.div>

        {/* Blurred mock offer cards */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="relative mb-8">
          <div className="space-y-3">
            {[
              { dealer: 'Al Meera Cars', amount: '285,000 QAR', badge: '🏆 Best Offer', color: 'border-orange-200' },
              { dealer: 'Qatar Premium Auto', amount: '271,000 QAR', badge: null, color: 'border-gray-100' },
              { dealer: 'Gulf Motors', amount: '268,500 QAR', badge: null, color: 'border-gray-100' },
            ].map((card, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl border-2 ${card.color} p-5 flex items-center justify-between select-none`}
                style={{ filter: 'blur(4px)', userSelect: 'none' }}
              >
                <div>
                  <p className="font-bold text-gray-900">{card.dealer}</p>
                  <p className="text-sm text-gray-400">Toyota Camry 2022 · 45,000 km</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-lg text-[#003087]">{card.amount}</p>
                  {card.badge && <span className="text-xs font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{card.badge}</span>}
                </div>
              </div>
            ))}
          </div>
          {/* Lock overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-[#f5f7fa]/60 to-[#f5f7fa]/90 rounded-2xl">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-6 py-4 flex items-center gap-3">
              <Lock size={20} className="text-[#003087]" />
              <p className="font-bold text-gray-800 text-sm">List your car to unlock real offers</p>
            </div>
          </div>
        </motion.div>

        {/* 3-step funnel */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center justify-center gap-2 mb-8 text-sm">
          {[
            { num: '1', label: 'Enter car details' },
            { num: '2', label: 'Get estimate' },
            { num: '3', label: 'Dealers compete' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-[#003087] text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                  {step.num}
                </div>
                <span className="text-gray-600 font-medium whitespace-nowrap">{step.label}</span>
              </div>
              {i < 2 && <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />}
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
          <Link
            href="/urgent-sale"
            className="flex items-center justify-center gap-2 w-full bg-[#ff6600] hover:bg-[#e05a00] text-white font-black py-4 rounded-xl text-lg shadow-md transition-all hover:scale-[1.02]"
          >
            <Car size={20} /> Get My First Offer — Free
          </Link>
          <p className="text-center text-xs text-gray-400">No account needed to get your estimate</p>
          <div className="text-center pt-1">
            <span className="text-sm text-gray-500">Already have an account? </span>
            <Link href="/login?redirect=/my-offers" className="text-sm font-bold text-[#003087] hover:underline">
              Sign in to see your offers
            </Link>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

// ─── Authenticated view ───────────────────────────────────────────────────────
function MyOffersContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<OfferRequest[]>([]);
  const [fetching, setFetching] = useState(true);
  const submitted = searchParams.get('submitted');

  useEffect(() => {
    if (token) {
      getMyOfferRequests(token)
        .then(res => setRequests((res as { rows?: OfferRequest[] }).rows || []))
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [token]);

  if (fetching) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900">My Offers</h1>
            <p className="text-gray-500 mt-1">Track all your car offer requests</p>
          </div>
          <Link href="/submit-offer" className="flex items-center gap-2 bg-[#ff6600] hover:bg-[#e05a00] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
            <Car size={16} /> New Request
          </Link>
        </div>

        {/* Submitted confirmation */}
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-start gap-3"
          >
            <CheckCircle2 size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-green-800">Request submitted successfully!</p>
              <p className="text-sm text-green-700 mt-0.5">Dealers will start reviewing your car and sending offers shortly.</p>
            </div>
          </motion.div>
        )}

        {requests.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Car size={48} className="text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No offer requests yet</h3>
            <p className="text-gray-500 mb-6">Start by getting a free valuation on your car</p>
            <Link href="/valuation" className="inline-flex items-center gap-2 bg-[#003087] hover:bg-[#0057b8] text-white font-bold px-6 py-3 rounded-xl transition-colors">
              Get Free Valuation <ChevronRight size={18} />
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const status = STATUS_CONFIG[req.status] || { label: req.status, color: 'bg-gray-100 text-gray-500' };
              return (
                <motion.div
                  key={req.request_uid}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-lg">
                          {req.year} {req.make} {req.class_name}
                        </h3>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {req.km?.toLocaleString()} km · {req.city} · {req.condition}
                      </p>
                      {req.asking_price_qar && (
                        <p className="text-sm text-gray-600 mt-1">Asking: {formatQAR(req.asking_price_qar)}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Clock size={12} /> Submitted {formatDate(req.created_at)}
                      </p>
                    </div>
                    <Link
                      href={`/my-offers/${req.request_uid}`}
                      className="flex-shrink-0 flex items-center gap-1 text-sm font-semibold text-[#003087] hover:text-[#0057b8] bg-[#e8f0fd] px-4 py-2 rounded-xl transition-colors"
                    >
                      View <ChevronRight size={16} />
                    </Link>
                  </div>

                  {req.status === 'under_offer' && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-sm text-orange-600">
                      <AlertCircle size={14} />
                      You have new dealer offers waiting — review them now!
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default function MyOffersPage() {
  return (
    <Suspense fallback={<div />}>
      <MyOffersRouter />
    </Suspense>
  );
}

function MyOffersRouter() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
        </div>
      </div>
    );
  }
  if (!user) return <UnauthenticatedState />;
  return <MyOffersContent />;
}
