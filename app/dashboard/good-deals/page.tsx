'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { getDealerGoodDeals, GoodDealRow, imgProxyUrl } from '@/lib/api';
import { formatQAR, formatKM } from '@/lib/utils';

function DiscountBadge({ pct }: { pct: number }) {
  const abs = Math.abs(pct);
  const cls =
    abs >= 15 ? 'bg-green-600 text-white' :
    abs >= 10 ? 'bg-green-100 text-green-700 border border-green-200' :
    'bg-amber-50 text-amber-700 border border-amber-200';
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>
      -{abs.toFixed(1)}%
    </span>
  );
}

function DealCard({ row }: { row: GoodDealRow }) {
  const saving = row.discount_qar ? Math.abs(row.discount_qar) : null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4 items-start hover:shadow-md transition-shadow">
      {row.main_image_url && (
        <img
          src={imgProxyUrl(row.main_image_url)}
          alt={row.title}
          className="w-24 h-16 object-cover rounded-xl shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-900 text-sm truncate">
            {row.manufacture_year} {row.make} {row.class_name}{row.trim ? ` ${row.trim}` : ''}
          </span>
          <DiscountBadge pct={row.discount_pct} />
        </div>
        <div className="flex gap-3 mt-1 text-xs text-gray-500 flex-wrap">
          <span>{formatKM(row.km)}</span>
          {row.city && <span>{row.city}</span>}
          {row.seller_type && <span className="capitalize">{row.seller_type}</span>}
        </div>
        <div className="flex items-baseline gap-3 mt-2">
          <span className="text-lg font-black text-gray-900">{formatQAR(row.price_qar)}</span>
          {row.expected_price_qar && (
            <span className="text-xs text-gray-400 line-through">{formatQAR(row.expected_price_qar)} est.</span>
          )}
          {saving && (
            <span className="text-xs text-green-600 font-semibold">save ~{formatQAR(saving)}</span>
          )}
        </div>
      </div>
      {row.url && (
        <Link
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 text-xs text-[#003087] hover:underline font-semibold"
        >
          View <ExternalLink size={12} />
        </Link>
      )}
    </div>
  );
}

const LIMIT = 20;
const DISCOUNT_OPTIONS = [5, 8, 12, 15, 20];

export default function GoodDealsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [minDiscount, setMinDiscount] = useState(8);
  const [page, setPage] = useState(0);
  const [data, setData] = useState<{ rows: GoodDealRow[]; total: number; threshold_pct: number } | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login/dealer');
  }, [user, loading, router]);

  const load = useCallback(() => {
    if (!token) return;
    setFetching(true);
    getDealerGoodDeals({ min_discount: -minDiscount, limit: LIMIT, offset: page * LIMIT }, token)
      .then(setData)
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [token, minDiscount, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />
      <div className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Good Deal Feed</h1>
            <p className="text-gray-500 mt-1">Listings priced below market — sorted by biggest discount first.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">Min discount:</span>
            {DISCOUNT_OPTIONS.map(v => (
              <button
                key={v}
                onClick={() => { setMinDiscount(v); setPage(0); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  minDiscount === v
                    ? 'bg-[#003087] border-[#003087] text-white'
                    : 'border-gray-200 text-gray-600 bg-white hover:border-[#003087] hover:text-[#003087]'
                }`}
              >
                {v}%+
              </button>
            ))}
          </div>
        </div>

        {fetching && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
          </div>
        )}

        {data && !fetching && (
          <>
            <p className="text-xs text-gray-400 mb-3">
              {data.total.toLocaleString()} listings ≥{Math.abs(data.threshold_pct)}% below market
            </p>
            <div className="space-y-3">
              {data.rows.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <p className="text-gray-500 font-medium">No deals found at this threshold.</p>
                </div>
              )}
              {data.rows.map(row => <DealCard key={row.product_id} row={row} />)}
            </div>

            {data.total > LIMIT && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="flex items-center gap-1 border border-gray-200 bg-white px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 disabled:opacity-40 hover:border-[#003087] transition-colors"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-sm text-gray-500">Page {page + 1} of {Math.ceil(data.total / LIMIT)}</span>
                <button
                  disabled={(page + 1) * LIMIT >= data.total}
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1 border border-gray-200 bg-white px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 disabled:opacity-40 hover:border-[#003087] transition-colors"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
