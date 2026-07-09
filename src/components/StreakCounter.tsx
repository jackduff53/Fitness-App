interface StreakCounterProps {
  burnStreak: number;
  intakeStreak: number;
}

export function StreakCounter({ burnStreak, intakeStreak }: StreakCounterProps) {
  return (
    <div className="gradient-card rounded-2xl p-5">
      <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-4">Streaks</p>
      <div className="flex justify-around">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mb-2">
            <span className="text-2xl font-black text-accent">{burnStreak}</span>
          </div>
          <span className="text-xs text-text-secondary">Burn Goal</span>
        </div>
        <div className="w-px bg-white/5" />
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mb-2">
            <span className="text-2xl font-black text-accent">{intakeStreak}</span>
          </div>
          <span className="text-xs text-text-secondary">Intake Target</span>
        </div>
      </div>
    </div>
  );
}
