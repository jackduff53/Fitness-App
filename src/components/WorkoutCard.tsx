import type { Workout } from "@/types";

interface WorkoutCardProps {
  workouts: Workout[];
}

export function WorkoutCard({ workouts }: WorkoutCardProps) {
  if (workouts.length === 0) {
    return (
      <div className="gradient-card rounded-2xl p-5">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">Workouts</p>
        <p className="text-sm text-text-secondary italic">No workouts logged yet</p>
      </div>
    );
  }

  // Group workouts by date
  const grouped: Record<string, Workout[]> = {};
  for (const workout of workouts) {
    const date = workout.date || "Unknown";
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(workout);
  }

  // Sort dates newest first
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="gradient-card rounded-2xl p-5">
      <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">Workouts</p>
      <div className="space-y-4">
        {sortedDates.map((date) => (
          <div key={date}>
            <p className="text-xs font-medium text-accent mb-2">{formatDate(date)}</p>
            <div className="space-y-2">
              {grouped[date].map((workout, i) => (
                <div key={i} className="flex justify-between items-center bg-black/30 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <span className="text-sm">
                        {getWorkoutIcon(workout.type)}
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
        ))}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";

  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getWorkoutIcon(type: string): string {
  const icons: Record<string, string> = {
    Run: "🏃", Ride: "🚴", Swim: "🏊", Walk: "🚶", Hike: "🥾",
    WeightTraining: "🏋️", Crossfit: "💪", Yoga: "🧘", Rowing: "🚣",
    VirtualRide: "🚴", VirtualRun: "🏃", Trail: "⛰️", Soccer: "⚽",
    Tennis: "🎾", Basketball: "🏀",
  };
  return icons[type] || "💪";
}
