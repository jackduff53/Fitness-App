import type { WorkoutRecommendation } from "@/types";

interface WorkoutRecommendationCardProps {
  recommendation: WorkoutRecommendation;
}

export function WorkoutRecommendationCard({ recommendation }: WorkoutRecommendationCardProps) {
  const isCardio = recommendation === "cardio";

  return (
    <div className="glow-orange gradient-card rounded-2xl p-5 border border-accent/20">
      <p className="text-xs font-medium text-accent uppercase tracking-wider mb-2">Today&apos;s Focus</p>
      <p className="text-xl font-bold text-white">
        {isCardio ? "🏃 Cardio Workout" : "💪 Recovery & Strength"}
      </p>
      <p className="text-sm text-text-secondary mt-2 leading-relaxed">
        {isCardio
          ? "You're below your burn goal. Try a run, bike ride, or brisk walk to close the gap."
          : "You've hit your burn goal! Focus on stretching, mobility, or light strength training."}
      </p>
    </div>
  );
}
