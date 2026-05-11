import { Flame, TrendingUp, Eye, MinusCircle } from 'lucide-react';

type DealClass = 'hot' | 'good' | 'watch' | 'skip';

const CONFIG: Record<DealClass, {
  label: string;
  icon: typeof Flame;
  className: string;
}> = {
  hot: {
    label: '🔥 Hot Deal',
    icon: Flame,
    className: 'bg-red-50 text-red-600 border border-red-200',
  },
  good: {
    label: '✅ Good Deal',
    icon: TrendingUp,
    className: 'bg-green-50 text-green-700 border border-green-200',
  },
  watch: {
    label: '👀 Watch',
    icon: Eye,
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  skip: {
    label: 'Skip',
    icon: MinusCircle,
    className: 'bg-gray-100 text-gray-500 border border-gray-200',
  },
};

interface DealBadgeProps {
  type: DealClass;
  score?: number;
  explanation?: string[];
  /** 'badge' = compact pill, 'card' = score + explanation bullets */
  variant?: 'badge' | 'card';
}

export default function DealBadge({ type, score, explanation, variant = 'badge' }: DealBadgeProps) {
  const { label, className } = CONFIG[type];

  if (variant === 'badge') {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${className}`}>
        {label}
      </span>
    );
  }

  // card variant
  const barColor =
    type === 'hot' ? 'bg-red-500' :
    type === 'good' ? 'bg-green-500' :
    type === 'watch' ? 'bg-amber-400' :
    'bg-gray-300';

  return (
    <div className={`rounded-xl p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm">{label}</span>
        {score !== undefined && (
          <span className="text-xs font-bold opacity-80">{score}/100</span>
        )}
      </div>
      {score !== undefined && (
        <div className="w-full bg-white/50 rounded-full h-1.5 mb-2">
          <div
            className={`h-1.5 rounded-full transition-all ${barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
      )}
      {explanation && explanation.length > 0 && (
        <ul className="text-xs space-y-0.5 opacity-80">
          {explanation.map((e, i) => (
            <li key={i} className="flex items-start gap-1">
              <span className="mt-0.5 shrink-0">•</span>
              <span>{e}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
