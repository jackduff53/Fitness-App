"use client";

interface SparklineChartProps {
  data: number[];
  label: string;
  height?: number;
  color?: string;
}

export function SparklineChart({ data, label, height = 40, color = "#FF6B00" }: SparklineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-text-secondary">{label}</span>
        <div style={{ height }} className="flex items-center justify-center text-xs text-text-secondary">
          No data
        </div>
      </div>
    );
  }

  const width = 200;
  const padding = 4;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * (width - 2 * padding);
    const y = padding + (1 - (value - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-text-secondary">{label}</span>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
