interface StreakCounterProps {
  burnStreak: number;
  intakeStreak: number;
}

export function StreakCounter({ burnStreak, intakeStreak }: StreakCounterProps) {
  return (
    <div className="bg-card rounded-xl p-4">
      <h3 className="text-sm text-text-secondary mb-3">Streaks</h3>
      <div className="flex justify-around">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-accent">{burnStreak}</span>
          <span className="text-xs text-text-secondary">Burn Goal</span>
          <span className="text-xs text-text-secondary">days</span>
        </div>
        <div className="w-px bg-gray-700" />
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-accent">{intakeStreak}</span>
          <span className="text-xs text-text-secondary">Intake Target</span>
          <span className="text-xs text-text-secondary">days</span>
        </div>
      </div>
    </div>
  );
}
