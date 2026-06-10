'use client';

interface EloPoint {
  date: string;
  elo: number;
}

interface Divider {
  index: number;
  label: string;
}

interface EloLineChartProps {
  data: EloPoint[];
  dividers?: Divider[];
  height?: number;
  emptyMessage?: string;
}

export function EloLineChart({ data, dividers = [], height = 220, emptyMessage = 'No ELO history yet — play a match to get started!' }: EloLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
        {emptyMessage}
      </div>
    );
  }

  const width = 800;
  const padding = { top: 22, right: 16, bottom: 28, left: 42 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const elos = data.map((d) => d.elo);
  let min = Math.min(...elos);
  let max = Math.max(...elos);
  if (min === max) {
    min -= 10;
    max += 10;
  }
  const buffer = (max - min) * 0.12;
  min -= buffer;
  max += buffer;

  const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;
  const xScale = (i: number) => padding.left + i * xStep;
  const yScale = (v: number) => padding.top + innerH - ((v - min) / (max - min)) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(2)} ${yScale(d.elo).toFixed(2)}`).join(' ');
  const areaPath = `${linePath} L ${xScale(data.length - 1).toFixed(2)} ${(padding.top + innerH).toFixed(2)} L ${xScale(0).toFixed(2)} ${(padding.top + innerH).toFixed(2)} Z`;

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const showDots = data.length <= 60;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="eloFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFB81C" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FFB81C" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* gridlines + y labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = padding.top + innerH * t;
        const value = Math.round(max - (max - min) * t);
        return (
          <g key={t}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f0f0f0" strokeWidth="1" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#bbb">{value}</text>
          </g>
        );
      })}

      {/* season dividers */}
      {dividers.map((d) => (
        <g key={d.index}>
          <line x1={xScale(d.index)} y1={padding.top} x2={xScale(d.index)} y2={padding.top + innerH} stroke="#e0e0e0" strokeWidth="1" strokeDasharray="4 4" />
          <text x={xScale(d.index)} y={padding.top - 8} textAnchor="middle" fontSize="10" fill="#999">{d.label}</text>
        </g>
      ))}

      {/* area + line */}
      <path d={areaPath} fill="url(#eloFill)" />
      <path d={linePath} fill="none" stroke="#FFB81C" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* dots */}
      {showDots && data.map((d, i) => (
        <circle key={i} cx={xScale(i)} cy={yScale(d.elo)} r={3} fill="#FFB81C" stroke="#fff" strokeWidth="1.5" />
      ))}

      {/* x labels */}
      <text x={padding.left} y={height - 6} textAnchor="start" fontSize="11" fill="#bbb">{fmtDate(data[0].date)}</text>
      {data.length > 1 && (
        <text x={width - padding.right} y={height - 6} textAnchor="end" fontSize="11" fill="#bbb">{fmtDate(data[data.length - 1].date)}</text>
      )}
    </svg>
  );
}
