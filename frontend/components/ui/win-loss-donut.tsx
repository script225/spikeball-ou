'use client';

interface WinLossDonutProps {
  wins: number;
  losses: number;
  size?: number;
  emptyMessage?: string;
}

export function WinLossDonut({ wins, losses, size = 160, emptyMessage = 'No matches yet' }: WinLossDonutProps) {
  const total = wins + losses;
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const winFraction = total > 0 ? wins / total : 0;
  const winRate = total > 0 ? Math.round(winFraction * 100) : 0;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <div className="w-full h-full rounded-full border-[14px] border-gray-100" />
        <p className="text-xs text-gray-400 text-center mt-2 absolute">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#fef2f2" strokeWidth="14" />
        {winFraction > 0 && (
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke="#16a34a" strokeWidth="14"
            strokeDasharray={`${winFraction * circumference} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
        {winFraction < 1 && (
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke="#ef4444" strokeWidth="14"
            strokeDasharray={`${(1 - winFraction) * circumference} ${circumference}`}
            strokeDashoffset={-(winFraction * circumference)}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{winRate}%</span>
        <span className="text-[10px] text-gray-400 mt-0.5">{wins}W – {losses}L</span>
      </div>
    </div>
  );
}
