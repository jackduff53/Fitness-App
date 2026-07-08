interface MacroProgressBarProps {
  label: string;
  current: number;
  target: number;
  unit?: string;
}

export function MacroProgressBar({ label, current, target, unit = "g" }: MacroProgressBarProps) {
  const percentage = target > 0 ? Math.min(current / target, 1) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-text-primary">{label}</span>
        <span className="text-xs text-text-secondary">{Math.round(current)}/{target} {unit}</span>
      </div>
      <div className="w-full h-2 bg-background rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
