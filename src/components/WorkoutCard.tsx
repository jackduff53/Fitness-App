import type { Workout } from "@/types";

interface WorkoutCardProps {
  workouts: Workout[];
}

export function WorkoutCard({ workouts }: WorkoutCardProps) {
  if (workouts.length === 0) {
    return (
      <div className="bg-card rounded-xl p-4">
        <h3 className="text-sm text-text-secondary mb-2">Today&apos;s Workouts</h3>
        <p className="text-text-secondary text-sm">No workouts logged today</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4">
      <h3 className="text-sm text-text-secondary mb-3">Today&apos;s Workouts</h3>
      <div className="space-y-2">
        {workouts.map((workout, i) => (
          <div key={i} className="flex justify-between items-center bg-background rounded-lg p-3">
            <span className="text-text-primary text-sm">{workout.type}</span>
            <div className="flex gap-3">
              <span className="text-text-secondary text-sm">{workout.durationMinutes} min</span>
              <span className="text-accent text-sm">{workout.caloriesBurned} cal</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
