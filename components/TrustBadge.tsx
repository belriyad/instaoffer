import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

type TrustLevel = 'high' | 'medium' | 'low';

const CONFIG: Record<TrustLevel, {
  label: string;
  icon: typeof ShieldCheck;
  className: string;
}> = {
  high: {
    label: 'High Trust',
    icon: ShieldCheck,
    className: 'bg-green-50 text-green-700 border border-green-200',
  },
  medium: {
    label: 'Medium Trust',
    icon: ShieldAlert,
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  low: {
    label: 'Low Trust',
    icon: ShieldX,
    className: 'bg-red-50 text-red-600 border border-red-200',
  },
};

interface TrustBadgeProps {
  level: TrustLevel;
  score?: number;
  completeness?: number;
  /** 'badge' = compact pill, 'card' = expanded with score bar */
  variant?: 'badge' | 'card';
}

export default function TrustBadge({ level, score, completeness, variant = 'badge' }: TrustBadgeProps) {
  const { label, icon: Icon, className } = CONFIG[level];

  if (variant === 'badge') {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${className}`}>
        <Icon size={12} />
        {label}
      </span>
    );
  }

  // card variant
  const scoreColor =
    level === 'high' ? 'bg-green-500' :
    level === 'medium' ? 'bg-amber-400' :
    'bg-red-400';

  return (
    <div className={`rounded-xl border p-3 ${className.split('border')[0]} bg-white border-gray-100`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${className.includes('green') ? 'text-green-700' : className.includes('amber') ? 'text-amber-700' : 'text-red-600'}`}>
          <Icon size={14} />
          {label}
        </span>
        {score !== undefined && (
          <span className="text-xs font-bold text-gray-700">{score}/100</span>
        )}
      </div>
      {score !== undefined && (
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
          <div
            className={`h-1.5 rounded-full transition-all ${scoreColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
      )}
      {completeness !== undefined && (
        <p className="text-xs text-gray-500">
          Listing completeness: <span className="font-semibold text-gray-700">{completeness}%</span>
        </p>
      )}
    </div>
  );
}
