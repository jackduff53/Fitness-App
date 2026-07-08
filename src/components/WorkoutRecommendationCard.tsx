import type { WorkoutRecommendation } from "@/types";

interface WorkoutRecommendationCardProps {
  recommendation: WorkoutRecommendation;
}

export function WorkoutRecommendationCard({ recommendation }: WorkoutRecommendationCardProps) {
  const isCardio = recommendation === "cardio";

  return (
    <div className="bg-card rounded-xl p-4 border border-accent/20">
      <h3 className="text-sm text-text-secondary mb-1">Recommended Workout</h3>
      <p className="text-lg font-semibold text-text-primary">
        {isCardio ? "🏃 Cardio Workout" : "💪 Recovery & Strength"}
      </p>
      <p className="text-sm text-text-secondary mt-1">
        {isCardio
          ? "You're below your burn goal. Try a run, bike ride, or brisk walk."
          : "Great job hitting your burn goal! Focus on stretching or light strength training."}
      </p>
    </div>
  );
}
