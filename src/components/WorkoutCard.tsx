import type { Workout } from "@/types";

interface WorkoutCardProps {
  workouts: Workout[];
}

export function WorkoutCard({ workouts }: WorkoutCardProps) {
  if (workouts.length === 0) {
    return (
      <div className="gradient-card rounded-2xl p-5">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">Today&apos;s Workouts</p>
        <p className="text-sm text-text-secondary italic">No workouts logged yet</p>
      </div>
    );
  }

  return (
    <div className="gradient-card rounded-2xl p-5">
      <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">Today&apos;s Workouts</p>
      <div className="space-y-2">
        {workouts.map((workout, i) => (
          <div key={i} className="flex justify-between items-center bg-black/30 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <span className="text-accent text-sm">
                  {workout.type === "Run" ? "🏃" : workout.type === "Ride" ? "🚴" : workout.type === "Swim" ? "🏊" : "💪"}
                </span>
              </div>
              <span className="text-sm text-white font-medium">{workout.type}</span>
            </div>
            <div className="flex gap-4 text-right">
              <span className="text-sm text-text-secondary">{workout.durationMinutes}m</span>
              <span className="text-sm font-semibold text-accent">{workout.caloriesBurned} cal</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
