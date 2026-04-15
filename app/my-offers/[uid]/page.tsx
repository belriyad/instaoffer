'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle2, X, MessageSquare, ChevronLeft, Clock, Shield, AlertCircle,
  Phone, Eye, FileText,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import {
  getOfferRequestDetail,
  OfferRequest,
  OfferBid,
  acceptBid,
  rejectBid,
  requestPhoneAccess,
  getPhoneRequests,
  approvePhoneRequest,
  rejectPhoneRequest,
  setDocumentVisibility,
  getDealerOnlineStatus,
  getPhoneApprovalLog,
} from '@/lib/api';
import { formatQAR, formatDate } from '@/lib/utils';
import {
  OFFER_REQUEST_STATUS_CONFIG,
  OfferRequestStatus,
  PhoneRequest,
  BidWithExpiry,
  formatBidExpiry,
  isBidExpired,
} from '@/lib/api-types';

type RequestWithBids = OfferRequest & {
  bids: OfferBid[];
  document_visibility?: 'all_dealers' | 'approved_only' | 'none';
  contact_whatsapp?: string | null;
};

// FE-008: Online status per dealer
interface OnlineStatus {
  is_online: boolean;
  last_seen: string | null;
}

// FE-006: Audit log entry
interface AuditEntry {
  dealer_id: string;
  action: string;
  timestamp: string;
  ip: string;
}

export default function OfferDetailPage({ params }: { params: Promise<{ uid: string }> }) {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [request, setRequest] = useState<RequestWithBids | null>(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [uid, setUid] = useState('');

  // FE-001: Phone requests
  const [phoneRequests, setPhoneRequests] = useState<PhoneRequest[]>([]);
  const [myPhoneRequest, setMyPhoneRequest] = useState<PhoneRequest | null>(null);
  const [phoneReqLoading, setPhoneReqLoading] = useState(false);

  // FE-008: Dealer online statuses (keyed by dealer_id)
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, OnlineStatus>>({});

  // FE-006: Audit log
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditLoaded, setAuditLoaded] = useState(false);

  // FE-007: Document visibility
  const [docVisibility, setDocVisibility] = useState<'all_dealers' | 'approved_only' | 'none'>('all_dealers');
  const [docVisUpdating, setDocVisUpdating] = useState(false);

  useEffect(() => {
    params.then(p => setUid(p.uid));
  }, [params]);

  useEffect(() => {
    if (!loading && !token) {
      router.push('/login');
      return;
    }
    if (token && uid) {
      setFetching(true);
      setFetchError(null);
      getOfferRequestDetail(uid, token)
        .then(r => {
          const req = r as RequestWithBids;
          setRequest(req);
          // FE-007: seed doc visibility from request
          if (req.document_visibility) setDocVisibility(req.document_visibility);
        })
        .catch(err => setFetchError(err instanceof Error ? err.message : 'Failed to load offer'))
        .finally(() => setFetching(false));
    }
  }, [token, loading, uid, router]);

  // FE-001: Fetch phone requests after main request loads
  useEffect(() => {
    if (!token || !uid || !request) return;

    getPhoneRequests(uid, token)
      .then(res => {
        const reqs = res.requests ?? [];
        setPhoneRequests(reqs);
        // For dealer: find own phone request
        if (user?.role === 'dealer' && user?.id) {
          const mine = reqs.find(r => r.dealer_id === user.id) ?? null;
          setMyPhoneRequest(mine);
        }
      })
      .catch(() => {});
  }, [token, uid, request, user]);

  // FE-008: Fetch online statuses for each unique dealer who bid
  useEffect(() => {
    if (!token || !request) return;
    const isSellerOrAdmin = user?.role === 'admin' || (user?.id && user.id === request.customer_id);
    if (!isSellerOrAdmin) return;

    const bids = request.bids ?? [];
    const dealerIds = [...new Set(bids.map(b => b.dealer_id))];

    dealerIds.forEach(dealerId => {
      getDealerOnlineStatus(dealerId, token)
        .then(status => {
          setOnlineStatuses(prev => ({ ...prev, [dealerId]: status }));
        })
        .catch(() => {}); // FE-008: silently ignore failures
    });
  }, [token, request, user]);

  // FE-001: Dealer requests phone access
  async function handlePhoneRequest() {
    if (!token || !uid) return;
    setPhoneReqLoading(true);
    try {
      await requestPhoneAccess(uid, token);
      // Refetch phone requests to get updated status
      const res = await getPhoneRequests(uid, token);
      const reqs = res.requests ?? [];
      setPhoneRequests(reqs);
      if (user?.id) {
        setMyPhoneRequest(reqs.find(r => r.dealer_id === user.id) ?? null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to request phone access');
    } finally {
      setPhoneReqLoading(false);
    }
  }

  // FE-001: Seller approves/rejects a phone request
  async function handlePhoneApprove(dealerId: string) {
    if (!token || !uid) return;
    // Optimistic update
    setPhoneRequests(prev => prev.map(r => r.dealer_id === dealerId ? { ...r, status: 'approved' } : r));
    try {
      await approvePhoneRequest(uid, dealerId, token);
    } catch {
      // Revert on error
      getPhoneRequests(uid, token).then(res => setPhoneRequests(res.requests ?? [])).catch(() => {});
    }
  }

  async function handlePhoneReject(dealerId: string) {
    if (!token || !uid) return;
    // Optimistic update
    setPhoneRequests(prev => prev.map(r => r.dealer_id === dealerId ? { ...r, status: 'denied' } : r));
    try {
      await rejectPhoneRequest(uid, dealerId, token);
    } catch {
      // Revert on error
      getPhoneRequests(uid, token).then(res => setPhoneRequests(res.requests ?? [])).catch(() => {});
    }
  }

  // FE-007: Update document visibility
  async function handleDocVisibilityChange(value: 'all_dealers' | 'approved_only' | 'none') {
    if (!token || !uid) return;
    setDocVisibility(value);
    setDocVisUpdating(true);
    try {
      await setDocumentVisibility(uid, value, token);
    } catch {
      // Revert
      if (request?.document_visibility) setDocVisibility(request.document_visibility);
    } finally {
      setDocVisUpdating(false);
    }
  }

  // FE-006: Load audit log on demand (admin only)
  async function loadAuditLog() {
    if (!token || !uid || auditLoaded) return;
    setAuditLoading(true);
    try {
      const res = await getPhoneApprovalLog(uid, token);
      setAuditLog(res.log ?? []);
      setAuditLoaded(true);
    } catch {
      setAuditLoaded(true);
    } finally {
      setAuditLoading(false);
    }
  }

  async function handleAccept(bidUid: string) {
    if (!token || !uid) return;
    setActionLoading(bidUid);
    try {
      await acceptBid(uid, bidUid, token);
      const updated = await getOfferRequestDetail(uid, token);
      setRequest(updated as RequestWithBids);
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
      setRequest(updated as RequestWithBids);
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
        <Footer />
      </div>
    );
  }

  if (fetchError || !request) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center max-w-md w-full shadow-sm">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Offer Not Found</h2>
            <p className="text-sm text-gray-500 mb-6">
              {fetchError || "This offer request doesn't exist or you don't have access to it."}
            </p>
            <Link
              href="/my-offers"
              className="inline-flex items-center gap-2 bg-[#003087] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#002070] transition-colors"
            >
              <ChevronLeft size={16} /> Back to My Offers
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const bids = (request.bids ?? []) as BidWithExpiry[];
  const acceptedBid = bids.find(b => b.status === 'accepted');
  const isDealer = user?.role === 'dealer';
  const isAdmin = user?.role === 'admin';
  const isSeller = !isDealer || isAdmin;

  // FE-009: WhatsApp number helpers
  function stripNonDigits(str: string) {
    return str.replace(/\D/g, '');
  }

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
              OFFER_REQUEST_STATUS_CONFIG[request.status as OfferRequestStatus]?.badgeClass ?? 'bg-gray-100 text-gray-500'
            }`}>
              {OFFER_REQUEST_STATUS_CONFIG[request.status as OfferRequestStatus]?.label ?? request.status.replace('_', ' ')}
            </span>
          </div>
          {request.description && (
            <p className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{request.description}</p>
          )}

          {/* FE-009: Seller always sees their own WhatsApp if set */}
          {isSeller && request.contact_whatsapp && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-700">
              <Phone size={14} className="text-green-600" />
              <span>WhatsApp: </span>
              <a
                href={`https://wa.me/${stripNonDigits(request.contact_whatsapp)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 font-semibold hover:underline"
              >
                {request.contact_whatsapp}
              </a>
            </div>
          )}

          {/* FE-007: Photo visibility control (seller only) */}
          {isSeller && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                <Eye size={14} /> Photo visibility
                {docVisUpdating && <span className="text-xs text-gray-400 font-normal ml-2">Saving…</span>}
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'all_dealers' as const, label: 'All dealers' },
                  { value: 'approved_only' as const, label: 'Approved dealers only' },
                  { value: 'none' as const, label: 'Nobody' },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="doc_visibility"
                      value={opt.value}
                      checked={docVisibility === opt.value}
                      onChange={() => handleDocVisibilityChange(opt.value)}
                      className="accent-[#003087]"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Privacy reminder */}
        <div className="bg-[#e8f0fd] border border-[#003087]/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Shield size={18} className="text-[#003087] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-[#003087]/90">
            <strong>Your phone number is private.</strong> Dealers must request access and you must approve before they can call or WhatsApp you.
          </p>
        </div>

        {/* FE-001: Phone access request button (dealer view) */}
        {isDealer && !isAdmin && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Phone size={15} /> Contact Access
            </h3>
            {/* FE-009: Dealer sees WhatsApp if approved */}
            {request.contact_whatsapp ? (
              <a
                href={`https://wa.me/${stripNonDigits(request.contact_whatsapp)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Phone size={15} /> WhatsApp Seller
              </a>
            ) : myPhoneRequest ? (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
                myPhoneRequest.status === 'approved'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : myPhoneRequest.status === 'denied'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {myPhoneRequest.status === 'approved' && <><CheckCircle2 size={15} /> Approved ✓</>}
                {myPhoneRequest.status === 'denied' && <><X size={15} /> Rejected ✗</>}
                {myPhoneRequest.status === 'pending' && <><Clock size={15} /> Pending approval&hellip;</>}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handlePhoneRequest}
                  disabled={phoneReqLoading}
                  className="inline-flex items-center gap-2 bg-[#003087] hover:bg-[#0057b8] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
                >
                  {phoneReqLoading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Phone size={15} />}
                  Request Phone Number
                </button>
                {/* FE-009: CTA if no WhatsApp and no request yet */}
                <p className="text-xs text-gray-400">Request phone access to view WhatsApp contact</p>
              </div>
            )}
          </div>
        )}

        {/* FE-001: Seller sees phone access requests section */}
        {isSeller && phoneRequests.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Phone size={15} /> Phone access requests
            </h3>
            <div className="space-y-2">
              {phoneRequests.map(pr => (
                <div key={pr.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    {/* FE-008: Online status dot */}
                    {onlineStatuses[pr.dealer_id] ? (
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${onlineStatuses[pr.dealer_id].is_online ? 'bg-green-500' : 'bg-gray-300'}`} title={
                        onlineStatuses[pr.dealer_id].is_online
                          ? 'Online'
                          : onlineStatuses[pr.dealer_id].last_seen
                          ? `Last seen ${new Date(onlineStatuses[pr.dealer_id].last_seen!).toLocaleString()}`
                          : 'Offline'
                      } />
                    ) : null}
                    <span className="text-sm text-gray-700 font-mono">{pr.dealer_id}</span>
                    {!onlineStatuses[pr.dealer_id]?.is_online && onlineStatuses[pr.dealer_id]?.last_seen && (
                      <span className="text-xs text-gray-400">
                        Last seen {Math.round((Date.now() - new Date(onlineStatuses[pr.dealer_id].last_seen!).getTime()) / 60000)}m ago
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      pr.status === 'approved' ? 'bg-green-50 text-green-700' :
                      pr.status === 'denied' ? 'bg-red-50 text-red-600' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {pr.status === 'denied' ? 'rejected' : pr.status}
                    </span>
                    {pr.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handlePhoneApprove(pr.dealer_id)}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handlePhoneReject(pr.dealer_id)}
                          className="text-xs border border-gray-200 hover:border-red-300 hover:text-red-600 text-gray-600 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FE-006: Phone Approval Audit Log (admin only) */}
        {isAdmin && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <FileText size={15} /> Phone Approval Log
                <span className="text-xs text-gray-400 font-normal bg-gray-100 px-2 py-0.5 rounded-full">Admin only</span>
              </h3>
              {!auditLoaded && (
                <button
                  onClick={loadAuditLog}
                  disabled={auditLoading}
                  className="text-xs text-[#003087] font-semibold hover:underline disabled:opacity-50"
                >
                  {auditLoading ? 'Loading…' : 'Load log'}
                </button>
              )}
            </div>
            {auditLoaded && (
              auditLog.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No phone approval events yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-gray-100">
                        <th className="pb-2 font-semibold text-gray-500 text-xs">Dealer ID</th>
                        <th className="pb-2 font-semibold text-gray-500 text-xs">Action</th>
                        <th className="pb-2 font-semibold text-gray-500 text-xs">Timestamp</th>
                        <th className="pb-2 font-semibold text-gray-500 text-xs">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLog.map((entry, i) => (
                        <tr key={i} className="border-b border-gray-50 last:border-0">
                          <td className="py-2 font-mono text-xs text-gray-700">{entry.dealer_id}</td>
                          <td className="py-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              entry.action === 'approved' ? 'bg-green-50 text-green-700' :
                              entry.action === 'rejected' ? 'bg-red-50 text-red-600' :
                              'bg-blue-50 text-blue-700'
                            }`}>
                              {entry.action}
                            </span>
                          </td>
                          <td className="py-2 text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</td>
                          <td className="py-2 text-xs text-gray-400 font-mono">{entry.ip}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        )}

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
                .map((bid, i) => {
                  const bidExpired = isBidExpired(bid);
                  const expiryLabel = formatBidExpiry(bid.expires_at);
                  const onlineInfo = onlineStatuses[bid.dealer_id];

                  return (
                    <motion.div
                      key={bid.bid_uid}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={`bg-white rounded-2xl border-2 p-5 shadow-sm transition-opacity ${
                        bidExpired ? 'opacity-50' :
                        bid.status === 'accepted' ? 'border-green-400' :
                        bid.status === 'rejected' ? 'border-gray-200 opacity-60' :
                        'border-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl font-black text-gray-900">{formatQAR(bid.amount_qar)}</div>
                          {/* FE-008: Online dot for dealer */}
                          {onlineInfo && (
                            <span
                              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${onlineInfo.is_online ? 'bg-green-500' : 'bg-gray-300'}`}
                              title={onlineInfo.is_online ? 'Online' : 'Offline'}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* FE-005: Expired label */}
                          {bidExpired && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">Expired</span>
                          )}
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            bid.status === 'accepted' ? 'bg-green-50 text-green-700' :
                            bid.status === 'rejected' ? 'bg-red-50 text-red-700' :
                            bid.status === 'withdrawn' ? 'bg-gray-100 text-gray-500' :
                            bidExpired ? 'bg-gray-100 text-gray-400' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {bid.status === 'pending' && !bidExpired ? 'New Offer' : bidExpired ? 'expired' : bid.status}
                          </span>
                        </div>
                      </div>

                      {bid.message && (
                        <p className="text-sm text-gray-600 mb-3 bg-gray-50 rounded-xl p-3 italic">&ldquo;{bid.message}&rdquo;</p>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                        <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(bid.created_at)}</span>
                        {/* FE-005: Expiry countdown */}
                        {expiryLabel && !bidExpired && (
                          <span className="text-amber-600 font-medium">{expiryLabel}</span>
                        )}
                        {bid.expires_at && bidExpired && (
                          <span>Expired {formatDate(bid.expires_at)}</span>
                        )}
                        {bid.expires_at && !bidExpired && !expiryLabel && (
                          <span>Expires {formatDate(bid.expires_at)}</span>
                        )}
                      </div>

                      {/* FE-008: Last seen for offline dealers */}
                      {onlineInfo && !onlineInfo.is_online && onlineInfo.last_seen && (
                        <p className="text-xs text-gray-400 mb-3">
                          Dealer last seen {Math.round((Date.now() - new Date(onlineInfo.last_seen).getTime()) / 60000)}m ago
                        </p>
                      )}

                      {bid.status === 'pending' && !bidExpired && request.status !== 'accepted' && (
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
                  );
                })}
            </div>
          )}
        </div>

        {/* FE-007: Dealer view — photos placeholder if not visible */}
        {isDealer && !isAdmin && (!request.photo_urls_json || request.photo_urls_json === '[]' || request.photo_urls_json === 'null') && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center mb-6">
            <Eye size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 font-medium">Photos available after phone approval</p>
            <p className="text-xs text-gray-400 mt-1">Request phone access to unlock seller photos.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
