"use client";

interface ProgressRingProps {
  current: number;
  goal: number;
  label: string;
  unit?: string;
  size?: number;
}

export function ProgressRing({ current, goal, label, unit = "cal", size = 160 }: ProgressRingProps) {
  const percentage = goal > 0 ? Math.min(current / goal, 1) * 100 : 0;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#141A29"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#33FFE0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-bold text-text-primary">{Math.round(percentage)}%</span>
        <span className="text-xs text-text-secondary">{Math.round(current)}/{Math.round(goal)} {unit}</span>
      </div>
      <span className="text-sm text-text-secondary">{label}</span>
    </div>
  );
}
