import type { WorkoutRecommendation } from "@/types";

export function getWorkoutRecommendation(
  caloriesBurned: number,
  burnGoal: number
): WorkoutRecommendation {
  if (caloriesBurned < burnGoal) {
    return "cardio";
  }
  return "recovery";
}
