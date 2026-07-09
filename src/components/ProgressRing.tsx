"use client";

interface ProgressRingProps {
  current: number;
  goal: number;
  label: string;
  unit?: string;
  size?: number;
}

export function ProgressRing({ current, goal, label, unit = "cal", size = 180 }: ProgressRingProps) {
  const percentage = goal > 0 ? Math.min(current / goal, 1) * 100 : 0;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3 relative">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id={`grad-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6B00" />
              <stop offset="100%" stopColor="#FF9500" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1A1A1A"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#grad-${label})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
            style={{ filter: "drop-shadow(0 0 6px rgba(255, 107, 0, 0.4))" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{Math.round(percentage)}%</span>
          <span className="text-xs text-text-secondary mt-1">{Math.round(current)}/{Math.round(goal)} {unit}</span>
        </div>
      </div>
      <span className="text-sm font-medium text-text-secondary tracking-wide uppercase">{label}</span>
    </div>
  );
}
