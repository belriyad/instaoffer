import Navbar from '@/components/Navbar';

export function FormSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 animate-pulse">
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 flex gap-1.5">
            <div className="h-1.5 rounded-full flex-1 bg-[#002b5b]/30" />
            <div className="h-1.5 rounded-full flex-1 bg-gray-200" />
          </div>
          <div className="w-8 h-3 bg-gray-200 rounded" />
        </div>

        {/* Card skeleton */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
          <div>
            <div className="h-7 w-48 bg-gray-200 rounded-lg mb-2" />
            <div className="h-4 w-36 bg-gray-100 rounded" />
          </div>
          <div className="h-14 w-full bg-gray-100 rounded-xl" />
          <div className="h-14 w-full bg-gray-100 rounded-xl" />
          <div className="h-14 w-full bg-gray-100 rounded-xl" />
          <div className="h-12 w-full bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function EstimateSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 animate-pulse space-y-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
          <div className="h-6 w-40 bg-gray-200 rounded" />
          <div className="h-12 w-64 bg-gray-200 rounded-xl" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-3">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 w-full bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-200 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-100 rounded" />
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Full-page detail skeleton (header card + sections) for request/lead detail pages. */
export function DetailSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 animate-pulse">
        <div className="h-4 w-28 bg-gray-100 rounded mb-6" />
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="h-7 w-2/3 bg-gray-200 rounded mb-3" />
          <div className="h-4 w-1/2 bg-gray-100 rounded mb-5" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 bg-gray-100 rounded-xl" />
            <div className="h-20 bg-gray-100 rounded-xl" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4 space-y-3">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-5/6 bg-gray-100 rounded" />
          <div className="h-4 w-2/3 bg-gray-100 rounded" />
        </div>
        <div className="h-12 w-full bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}
