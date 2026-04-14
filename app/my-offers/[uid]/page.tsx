'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, X, MessageSquare, ChevronLeft, Clock, Shield, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { getOfferRequestDetail, OfferRequest, acceptBid, rejectBid } from '@/lib/api';
import { formatQAR, formatDate } from '@/lib/utils';

interface OfferBidWithDealer {
  bid_uid: string;
  amount_qar: number;
  message: string | null;
  status: string;
  dealer_id: string;
  expires_at: string | null;
  created_at: string;
}

export default function OfferDetailPage({ params }: { params: Promise<{ uid: string }> }) {
  const { token, loading } = useAuth();
  const router = useRouter();
  const [request, setRequest] = useState<OfferRequest & { bids?: OfferBidWithDealer[] } | null>(null);
  const [fetching, setFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [uid, setUid] = useState('');

  useEffect(() => {
    params.then(p => setUid(p.uid));
  }, [params]);

  useEffect(() => {
    if (!loading && !token) {
      router.push('/login');
      return;
    }
    if (token && uid) {
      getOfferRequestDetail(uid, token)
        .then(r => setRequest(r as OfferRequest & { bids?: OfferBidWithDealer[] }))
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [token, loading, uid, router]);

  async function handleAccept(bidUid: string) {
    if (!token || !uid) return;
    setActionLoading(bidUid);
    try {
      await acceptBid(uid, bidUid, token);
      const updated = await getOfferRequestDetail(uid, token);
      setRequest(updated as OfferRequest & { bids?: OfferBidWithDealer[] });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to accept offer');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(bidUid: string) {
    if (!token || !uid) return;
    setActionLoading(bidUid + '_reject');
    try {
      await rejectBid(uid, bidUid, token);
      const updated = await getOfferRequestDetail(uid, token);
      setRequest(updated as OfferRequest & { bids?: OfferBidWithDealer[] });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject offer');
    } finally {
      setActionLoading(null);
    }
  }

  if (fetching || loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!request) return null;

  const bids = request.bids || [];
  const pendingBids = bids.filter(b => b.status === 'pending');
  const acceptedBid = bids.find(b => b.status === 'accepted');

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <Link href="/my-offers" className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#003087] mb-6 transition-colors">
          <ChevronLeft size={16} /> Back to My Offers
        </Link>

        {/* Request summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                {request.year} {request.make} {request.class_name}
              </h1>
              <p className="text-gray-500 mt-1">
                {request.km?.toLocaleString()} km · {request.city} · {request.condition}
              </p>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Clock size={12} /> Submitted {formatDate(request.created_at)}
              </p>
            </div>
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
              request.status === 'open' ? 'bg-blue-50 text-blue-700' :
              request.status === 'under_offer' ? 'bg-orange-50 text-orange-700' :
              request.status === 'accepted' ? 'bg-green-50 text-green-700' :
              'bg-gray-100 text-gray-500'
            }`}>
              {request.status.replace('_', ' ')}
            </span>
          </div>
          {request.description && (
            <p className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{request.description}</p>
          )}
        </div>

        {/* Privacy reminder */}
        <div className="bg-[#e8f0fd] border border-[#003087]/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Shield size={18} className="text-[#003087] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-[#003087]/90">
            <strong>Your phone number is private.</strong> Dealers must request access and you must approve before they can call or WhatsApp you.
          </p>
        </div>

        {/* Accepted bid */}
        {acceptedBid && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 border-2 border-green-400 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={22} className="text-green-600" />
              <h2 className="font-black text-green-800 text-lg">Offer Accepted!</h2>
            </div>
            <div className="text-3xl font-black text-green-700 mb-2">{formatQAR(acceptedBid.amount_qar)}</div>
            {acceptedBid.message && <p className="text-sm text-green-700 mb-3">&ldquo;{acceptedBid.message}&rdquo;</p>}
            <p className="text-xs text-green-600">This offer is non-binding and subject to physical inspection by the dealer.</p>
          </motion.div>
        )}

        {/* Dealer offers */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Dealer Offers {bids.length > 0 && <span className="text-gray-400 font-normal">({bids.length})</span>}
          </h2>

          {bids.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <Clock size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No offers yet</p>
              <p className="text-sm text-gray-400 mt-1">Dealers are reviewing your request. You&apos;ll be notified when offers arrive.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bids
                .sort((a, b) => b.amount_qar - a.amount_qar)
                .map((bid, i) => (
                  <motion.div
                    key={bid.bid_uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`bg-white rounded-2xl border-2 p-5 shadow-sm ${
                      bid.status === 'accepted' ? 'border-green-400' :
                      bid.status === 'rejected' ? 'border-gray-200 opacity-60' :
                      'border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl font-black text-gray-900">{formatQAR(bid.amount_qar)}</div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        bid.status === 'accepted' ? 'bg-green-50 text-green-700' :
                        bid.status === 'rejected' ? 'bg-red-50 text-red-700' :
                        bid.status === 'withdrawn' ? 'bg-gray-100 text-gray-500' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {bid.status === 'pending' ? 'New Offer' : bid.status}
                      </span>
                    </div>

                    {bid.message && (
                      <p className="text-sm text-gray-600 mb-3 bg-gray-50 rounded-xl p-3 italic">&ldquo;{bid.message}&rdquo;</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                      <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(bid.created_at)}</span>
                      {bid.expires_at && <span>Expires {formatDate(bid.expires_at)}</span>}
                    </div>

                    {bid.status === 'pending' && request.status !== 'accepted' && (
                      <>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                          <AlertCircle size={12} />
                          Offer is non-binding and subject to inspection
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(bid.bid_uid)}
                            disabled={actionLoading !== null}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all disabled:opacity-60"
                          >
                            {actionLoading === bid.bid_uid ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={16} />}
                            Accept Offer
                          </button>
                          <button
                            onClick={() => handleReject(bid.bid_uid)}
                            disabled={actionLoading !== null}
                            className="flex items-center justify-center gap-1.5 border border-gray-200 hover:border-red-300 hover:text-red-600 text-gray-600 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
                          >
                            <X size={16} /> Decline
                          </button>
                          <Link
                            href={`/messages/${request.request_uid}?dealer=${bid.dealer_id}`}
                            className="flex items-center justify-center gap-1.5 border border-gray-200 hover:border-[#003087] hover:text-[#003087] text-gray-600 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
                          >
                            <MessageSquare size={16} /> Chat
                          </Link>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
