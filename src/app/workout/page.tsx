"use client";

import { useGarminData } from "@/contexts/GarminDataContext";
import { useGoals } from "@/contexts/GoalsContext";
import { getWorkoutRecommendation } from "@/services/workoutRecommendation";
import { WorkoutCard } from "@/components/WorkoutCard";

export default function WorkoutPage() {
  const { data: garminData } = useGarminData();
  const { goals } = useGoals();

  const caloriesBurned = garminData?.activeCaloriesBurned || 0;
  const burnGoal = goals?.burnGoal || 500;
  const workouts = garminData?.workouts || [];
  const recommendation = getWorkoutRecommendation(caloriesBurned, burnGoal);
  const isCardio = recommendation === "cardio";
  const progress = burnGoal > 0 ? Math.min(caloriesBurned / burnGoal, 1) * 100 : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black tracking-tight">Workout</h1>

      {/* Recommendation hero */}
      <div className="glow-orange-strong gradient-card rounded-2xl p-6 border border-accent/30">
        <p className="text-xs font-medium text-accent uppercase tracking-wider mb-3">Today&apos;s Recommendation</p>
        <p className="text-2xl font-black text-white mb-2">
          {isCardio ? "🏃 Get Moving — Cardio" : "💪 Recovery & Strength"}
        </p>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          {isCardio
            ? "You're below your burn goal. A run, bike ride, or brisk walk will help you close the gap."
            : "You've crushed your burn goal today! Focus on recovery — stretching, yoga, or light strength work."}
        </p>
        <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-orange-400 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-text-secondary mt-2">
          {Math.round(caloriesBurned)} / {burnGoal} cal burned ({Math.round(progress)}%)
        </p>
      </div>

      {/* Suggested workouts */}
      <div className="gradient-card rounded-2xl p-5">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-4">Suggested Activities</p>
        <div className="space-y-3">
          {isCardio ? (
            <>
              <SuggestedWorkout emoji="🏃" name="Running" duration="30 min" cals="~300 cal" />
              <SuggestedWorkout emoji="🚴" name="Cycling" duration="45 min" cals="~400 cal" />
              <SuggestedWorkout emoji="🚶" name="Brisk Walk" duration="45 min" cals="~200 cal" />
              <SuggestedWorkout emoji="🏊" name="Swimming" duration="30 min" cals="~250 cal" />
            </>
          ) : (
            <>
              <SuggestedWorkout emoji="🧘" name="Yoga / Stretching" duration="30 min" cals="~100 cal" />
              <SuggestedWorkout emoji="💪" name="Strength Training" duration="45 min" cals="~250 cal" />
              <SuggestedWorkout emoji="🤸" name="Mobility Work" duration="20 min" cals="~80 cal" />
              <SuggestedWorkout emoji="🚶" name="Easy Walk" duration="30 min" cals="~120 cal" />
            </>
          )}
        </div>
      </div>

      {/* Today's completed workouts */}
      <WorkoutCard workouts={workouts} />
    </div>
  );
}

function SuggestedWorkout({ emoji, name, duration, cals }: { emoji: string; name: string; duration: string; cals: string }) {
  return (
    <div className="flex justify-between items-center bg-black/30 rounded-xl p-3 border border-white/5">
      <div className="flex items-center gap-3">
        <span className="text-lg">{emoji}</span>
        <span className="text-sm text-white font-medium">{name}</span>
      </div>
      <div className="flex gap-3 text-right">
        <span className="text-xs text-text-secondary">{duration}</span>
        <span className="text-xs text-accent">{cals}</span>
      </div>
    </div>
  );
}
