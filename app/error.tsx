'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa] items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h1 className="text-xl font-black text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-500 mb-6">
          An unexpected error occurred. Please try again — your data has not been lost.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full bg-[#003087] hover:bg-[#0057b8] text-white font-bold py-3 rounded-xl transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="w-full border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:border-[#003087] hover:text-[#003087] transition-colors"
          >
            Back to Home
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-gray-300 mt-4">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
