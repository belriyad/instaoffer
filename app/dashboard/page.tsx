'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Filter, Send, Clock, ChevronRight, Car, MessageSquare, Settings, Bookmark, X, Calendar } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { getAllOfferRequests, OfferRequest, placeBid, getDealerSubscription, getSavedFilters, createSavedFilter, deleteSavedFilter, getDealerBids, imgProxyUrl } from '@/lib/api';
import { formatQAR, formatDate, formatKM, CAR_MAKES } from '@/lib/utils';
import {
  OFFER_REQUEST_STATUS_CONFIG,
  isBiddingClosed,
  OfferRequestStatus,
  DealerSubscription,
  SubscriptionLoadState,
  SavedFilter,
  BidWithExpiry,
  formatBidExpiry,
  isBidExpired,
} from '@/lib/api-types';

const TABS = ['Leads', 'My Bids', 'Messages', 'Settings'] as const;
type Tab = typeof TABS[number];

interface BidModal {
  request: OfferRequest;
}

export default function DashboardPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('Leads');
  const [requests, setRequests] = useState<OfferRequest[]>([]);
  const [fetching, setFetching] = useState(true);
  const [bidModal, setBidModal] = useState<BidModal | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [bidExpiresAt, setBidExpiresAt] = useState('');
  const [bidSubmitting, setBidSubmitting] = useState(false);

  // Filters
  const [filterMake, setFilterMake] = useState('');
  const [filterStatus, setFilterStatus] = useState('open');

  const isApprovedDealer = user?.role === 'dealer' || user?.role === 'admin';

  // FE-003: Subscription
  const [subscription, setSubscription] = useState<DealerSubscription | null>(null);
  const [subLoadState, setSubLoadState] = useState<SubscriptionLoadState>('loading');

  // FE-004: Saved Filters
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [savingFilter, setSavingFilter] = useState(false);

  // My Bids
  const [myBids, setMyBids] = useState<(BidWithExpiry & { request_uid?: string; make?: string; class_name?: string; year?: number; km?: number })[]>([]);
  const [myBidsFetching, setMyBidsFetching] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login/dealer');
    }
  }, [user, loading, router]);

  // FE-003: Fetch subscription on load
  useEffect(() => {
    if (token) {
      setSubLoadState('loading');
      getDealerSubscription(token)
        .then(sub => {
          setSubscription(sub);
          setSubLoadState(sub.is_active ? 'active' : 'inactive');
        })
        .catch(() => setSubLoadState('error'));
    }
  }, [token]);

  // FE-004: Fetch saved filters on load
  useEffect(() => {
    if (token) {
      getSavedFilters(token)
        .then(res => setSavedFilters(res.filters ?? []))
        .catch(() => {});
    }
  }, [token]);

  // My Bids: fetch when tab is active
  useEffect(() => {
    if (token && tab === 'My Bids') {
      setMyBidsFetching(true);
      getDealerBids(token)
        .then(data => {
          const bids = ((data as { bids?: unknown[] }).bids ?? (data as unknown[])) as typeof myBids;
          setMyBids(Array.isArray(bids) ? bids : []);
        })
        .catch(() => {})
        .finally(() => setMyBidsFetching(false));
    }
  }, [token, tab]);

  useEffect(() => {
    if (token) {
      setFetching(true);
      getAllOfferRequests(token, {
        status: filterStatus || undefined,
        make: filterMake || undefined,
        limit: 50,
      })
        .then(res => setRequests((res as { rows?: OfferRequest[] }).rows || []))
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [token, filterMake, filterStatus]);

  async function handleBid() {
    if (!token || !bidModal || !bidAmount) return;
    setBidSubmitting(true);
    try {
      await placeBid(bidModal.request.request_uid, {
        amount_qar: Number(bidAmount),
        message: bidMessage || undefined,
        expires_at: bidExpiresAt || undefined,
      }, token);
      setBidModal(null);
      setBidAmount('');
      setBidMessage('');
      setBidExpiresAt('');
      // Refresh
      const res = await getAllOfferRequests(token, { status: filterStatus || undefined, make: filterMake || undefined, limit: 50 }) as { rows?: OfferRequest[] };
      setRequests(res.rows || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit bid');
    } finally {
      setBidSubmitting(false);
    }
  }

  // FE-004: Apply a saved filter to the current feed state
  function applySavedFilter(filter: SavedFilter) {
    if (filter.filters.makes && filter.filters.makes.length > 0) {
      setFilterMake(filter.filters.makes[0]);
    }
    // cities filter is not in the current filter UI but we reset make
  }

  // FE-004: Save current filter preset
  async function handleSaveFilter() {
    if (!token) return;
    const name = window.prompt('Name this filter preset:');
    if (!name) return;
    setSavingFilter(true);
    try {
      const res = await createSavedFilter({
        name,
        filters: {
          makes: filterMake ? [filterMake] : undefined,
        },
      }, token);
      setSavedFilters(prev => [...prev, res.filter]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save filter');
    } finally {
      setSavingFilter(false);
    }
  }

  // FE-004: Delete a saved filter
  async function handleDeleteFilter(id: number) {
    if (!token) return;
    setSavedFilters(prev => prev.filter(f => f.id !== id));
    try {
      await deleteSavedFilter(id, token);
    } catch {
      // Revert on failure by refetching
      getSavedFilters(token).then(res => setSavedFilters(res.filters ?? [])).catch(() => {});
    }
  }

  if (loading || subLoadState === 'loading') {
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

  // FE-003: Subscription gate — only block non-approved-dealer roles.
  // Approved dealers (role === 'dealer' | 'admin') always get access while
  // BE-003 subscription enforcement is pending.
  if (!isApprovedDealer && subLoadState === 'inactive' && subscription) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-10 text-center max-w-md w-full shadow-sm"
          >
            <div className="w-16 h-16 bg-[#003087]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car size={32} className="text-[#003087]" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Dealer Access Required</h2>
            <p className="text-gray-500 mb-6">Subscribe to access dealer features including leads, bids, and messaging.</p>
            <div className="bg-[#f5f7fa] rounded-xl p-4 mb-6 text-left">
              <div className="text-sm font-semibold text-gray-700 mb-1">{subscription.plan_name}</div>
              <div className="text-3xl font-black text-[#003087]">{subscription.price_qar != null ? subscription.price_qar.toLocaleString() : '—'} QAR<span className="text-base font-normal text-gray-500">/mo</span></div>
            </div>
            <a
              href="/for-dealers"
              className="inline-flex items-center gap-2 bg-[#003087] text-white font-bold px-8 py-3 rounded-xl text-base hover:bg-[#0057b8] transition-colors"
            >
              Subscribe to access dealer features <ChevronRight size={18} />
            </a>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />

      <div className="max-w-6xl mx-auto w-full px-4 py-8 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Dealer Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Welcome back, {user?.full_name?.split(' ')[0]}
              <span className="ml-2 inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">● Active</span>
              {/* FE-003: Show subscription expiry */}
              {subscription?.is_active && subscription.expires_at && (
                <span className="ml-2 inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  <Calendar size={10} /> Sub expires {new Date(subscription.expires_at).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {/* Notification bell — TODO: wire up notification drawer when BE ships */}
          </div>
        </div>

        {/* Pending approval banner */}
        {!isApprovedDealer && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <div className="font-bold text-amber-800">Account pending dealer approval</div>
              <div className="text-sm text-amber-700 mt-0.5">
                Your account has been created. Our team will upgrade it to dealer access within 24 hours.
                You&apos;ll receive an email at <strong>{user?.email}</strong> once approved.
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Open Leads', value: requests.filter(r => r.status === 'open').length, color: 'text-[#003087]' },
            { label: 'My Active Bids', value: myBids.filter((b: BidWithExpiry) => b.status === 'pending').length, color: 'text-orange-600' },
            { label: 'Accepted', value: requests.filter(r => r.status === 'accepted').length, color: 'text-green-600' },
            {
              label: 'Subscription',
              value: subscription?.price_qar != null ? `${subscription.price_qar.toLocaleString()} QAR/mo` : '—',
              color: 'text-gray-700',
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick links to acquisition tools */}
        {isApprovedDealer && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { href: '/dashboard/good-deals', label: 'Good Deal Feed', sub: 'Listings below market' },
              { href: '/dashboard/margin',     label: 'Margin Calculator', sub: 'Estimate acquisition ROI' },
              { href: '/dashboard/analytics',  label: 'Analytics',       sub: 'Performance & activity' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-[#003087] hover:shadow-md transition-all group"
              >
                <p className="font-bold text-gray-900 text-sm group-hover:text-[#003087] transition-colors">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
              </Link>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white shadow-sm text-[#003087]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Leads tab */}
        {tab === 'Leads' && !isApprovedDealer && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <span className="text-5xl block mb-4">🔒</span>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Leads unlock after approval</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Once our team approves your dealer account, you&apos;ll see all available car sell requests here and be able to place bids.
            </p>
          </div>
        )}
        {tab === 'Leads' && isApprovedDealer && (
          <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#003087]"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="pending">Under Offer</option>
                <option value="under_offer">Offer Received</option>
                <option value="accepted">Accepted</option>
              </select>
              <select
                value={filterMake}
                onChange={e => setFilterMake(e.target.value)}
                className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#003087]"
              >
                <option value="">All Makes</option>
                {CAR_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              {/* FE-004: Save filter button */}
              <button
                onClick={handleSaveFilter}
                disabled={savingFilter}
                className="flex items-center gap-1.5 border border-gray-200 bg-white px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:border-[#003087] hover:text-[#003087] transition-colors disabled:opacity-50"
              >
                <Bookmark size={14} /> Save filter
              </button>

              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Filter size={14} />
                {requests.length} leads matching
              </div>
            </div>

            {/* FE-004: Saved filter chips */}
            {savedFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {savedFilters.map(sf => (
                  <div
                    key={sf.id}
                    className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-100 transition-colors group"
                  >
                    <button
                      onClick={() => applySavedFilter(sf)}
                      className="flex items-center gap-1.5"
                    >
                      <Bookmark size={12} />
                      {sf.name}
                      {sf.match_count > 0 && (
                        <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">{sf.match_count}</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteFilter(sf.id)}
                      className="ml-1 text-blue-400 hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {fetching ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Car size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No leads found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req, i) => {
                  // FE-005: Cast bids to BidWithExpiry
                  const reqBids = ((req as OfferRequest & { bids?: BidWithExpiry[] }).bids ?? []) as BidWithExpiry[];
                  const expired = reqBids.some(b => isBidExpired(b));
                  return (
                    <motion.div
                      key={req.request_uid}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {(() => {
                          let thumbUrl: string | null = null;
                          try {
                            const urls = JSON.parse(req.photo_urls_json || '[]');
                            if (Array.isArray(urls) && urls.length > 0) thumbUrl = urls[0];
                          } catch { /* ignore */ }
                          return thumbUrl ? (
                            <img
                              src={imgProxyUrl(thumbUrl)}
                              alt={`${req.make} ${req.class_name}`}
                              className="w-20 h-16 object-cover rounded-xl flex-shrink-0"
                            />
                          ) : null;
                        })()}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-gray-900">
                              {req.year} {req.make} {req.class_name}
                            </h3>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              OFFER_REQUEST_STATUS_CONFIG[req.status as OfferRequestStatus]?.badgeClass ?? 'bg-gray-100 text-gray-500'
                            }`}>
                              {OFFER_REQUEST_STATUS_CONFIG[req.status as OfferRequestStatus]?.label ?? req.status.replace('_', ' ')}
                            </span>
                            {/* FE-005: Show expired badge */}
                            {expired && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Bid Expired</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                            <span>{formatKM(req.km)}</span>
                            <span>·</span>
                            <span>{req.city}</span>
                            <span>·</span>
                            <span className="capitalize">{req.condition} condition</span>
                          </div>
                          {req.asking_price_qar && (
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                              Asking: {formatQAR(req.asking_price_qar)}
                            </p>
                          )}
                          {req.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{req.description}</p>
                          )}
                          {/* FE-005: Show bid expiry countdown on req cards */}
                          {reqBids.map(b => {
                            const expiry = formatBidExpiry(b.expires_at);
                            if (!expiry) return null;
                            return (
                              <p key={b.bid_uid} className="text-xs text-amber-600 mt-1 font-medium">{expiry}</p>
                            );
                          })}
                          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <Clock size={11} /> {formatDate(req.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {!isBiddingClosed(req.status as OfferRequestStatus) && (
                            <button
                              onClick={() => setBidModal({ request: req })}
                              className="flex items-center gap-1.5 bg-[#003087] hover:bg-[#0057b8] text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
                            >
                              <Send size={14} /> Send Offer
                            </button>
                          )}
                          <Link
                            href={`/messages/${req.request_uid}?recipient=${req.customer_id}`}
                            className="flex items-center justify-center gap-1.5 border border-gray-200 hover:border-[#003087] text-gray-600 hover:text-[#003087] font-semibold px-4 py-2 rounded-xl text-sm transition-all"
                          >
                            <MessageSquare size={14} /> Message
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'My Bids' && (
          <div>
            {myBidsFetching ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
              </div>
            ) : myBids.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Send size={36} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No bids submitted yet</p>
                <p className="text-sm text-gray-400 mt-1">Your submitted offers will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myBids.map((bid, i) => {
                  const expired = isBidExpired(bid);
                  const expiryLabel = formatBidExpiry(bid.expires_at);
                  return (
                    <motion.div
                      key={bid.bid_uid}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm transition-opacity ${expired ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {bid.make && bid.year && (
                              <h3 className="font-bold text-gray-900">{bid.year} {bid.make} {bid.class_name}</h3>
                            )}
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              bid.status === 'accepted' ? 'bg-green-50 text-green-700' :
                              bid.status === 'rejected' ? 'bg-red-50 text-red-700' :
                              bid.status === 'withdrawn' ? 'bg-gray-100 text-gray-500' :
                              expired ? 'bg-gray-100 text-gray-400' :
                              'bg-blue-50 text-blue-700'
                            }`}>
                              {expired ? 'Expired' : bid.status === 'pending' ? 'Awaiting response' : bid.status}
                            </span>
                          </div>
                          <div className="text-2xl font-black text-gray-900 mb-1">{formatQAR(bid.amount_qar)}</div>
                          {bid.message && (
                            <p className="text-sm text-gray-500 italic mb-1">&ldquo;{bid.message}&rdquo;</p>
                          )}
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <Clock size={11} /> {formatDate(bid.created_at)}
                            {expiryLabel && !expired && (
                              <span className="ml-2 text-amber-600 font-medium">{expiryLabel}</span>
                            )}
                          </p>
                        </div>
                        {bid.request_uid && (
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <Link
                              href={`/my-offers/${bid.request_uid}`}
                              className="flex items-center justify-center gap-1.5 border border-gray-200 hover:border-[#003087] text-gray-600 hover:text-[#003087] font-semibold px-4 py-2 rounded-xl text-sm transition-all"
                            >
                              <Car size={14} /> View Offer
                            </Link>
                            <Link
                              href={`/messages/${bid.request_uid}?recipient=${bid.request_uid}`}
                              className="flex items-center justify-center gap-1.5 border border-gray-200 hover:border-[#003087] text-gray-600 hover:text-[#003087] font-semibold px-4 py-2 rounded-xl text-sm transition-all"
                            >
                              <MessageSquare size={14} /> Message
                            </Link>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {tab === 'Messages' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <MessageSquare size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Conversations with sellers will appear here</p>
          </div>
        )}
        {tab === 'Settings' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Settings size={18} /> Preferences
            </h2>
            <p className="text-sm text-gray-500">Configure the makes, cities, and mileage ranges you want to receive leads for.</p>
            <Link href="/dashboard/preferences" className="inline-flex items-center gap-2 mt-4 bg-[#003087] text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-[#0057b8] transition-colors">
              Edit Preferences <ChevronRight size={16} />
            </Link>
          </div>
        )}
      </div>

      {/* Bid Modal — FE-005: optional expires_at field */}
      {bidModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
          >
            <h2 className="text-xl font-black text-gray-900 mb-1">Send Offer</h2>
            <p className="text-sm text-gray-500 mb-6">
              {bidModal.request.year} {bidModal.request.make} {bidModal.request.class_name} · {formatKM(bidModal.request.km)}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Your Offer Amount (QAR) *</label>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  placeholder="e.g. 85000"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-xl font-bold focus:outline-none focus:border-[#003087]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Message to Seller <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={bidMessage}
                  onChange={e => setBidMessage(e.target.value)}
                  rows={3}
                  placeholder="e.g. I can arrange pickup at your location..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087] resize-none"
                />
              </div>
              {/* FE-005: Optional bid expiry date-time */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Clock size={14} /> Offer Expires At <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={bidExpiresAt}
                  onChange={e => setBidExpiresAt(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#003087]"
                />
              </div>
              <p className="text-xs text-gray-400">This offer is non-binding and subject to physical inspection.</p>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => { setBidModal(null); setBidExpiresAt(''); }}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBid}
                disabled={!bidAmount || bidSubmitting}
                className="flex-1 flex items-center justify-center gap-2 bg-[#003087] hover:bg-[#0057b8] text-white font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-60"
              >
                {bidSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={16} /> Submit Offer</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}
