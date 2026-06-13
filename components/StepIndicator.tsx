'use client';

interface StepIndicatorProps {
  steps: string[];
  current: number; // 0-indexed
}

export default function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    // Force LTR: the step count ("1 of 4") and the dot progression must read
    // left-to-right; in an RTL (Arabic) page the neutral-separated numbers would
    // otherwise visually flip (e.g. "2 / 1").
    <div className="mb-6" dir="ltr">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Step {current + 1} of {steps.length}
        </span>
        <span className="text-xs font-semibold text-gray-500">{steps[current]}</span>
      </div>
      <div className="flex items-center gap-0">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            {/* Dot */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                i < current
                  ? 'bg-[#002b5b] text-white'
                  : i === current
                  ? 'bg-[#002b5b] text-white ring-4 ring-[#002b5b]/20'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {i < current ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            {/* Connector */}
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 transition-all ${i < current ? 'bg-[#002b5b]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
