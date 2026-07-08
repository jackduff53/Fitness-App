import type { DailySummary } from "@/types";

export function calculateBurnStreak(summaries: DailySummary[], burnGoal: number): number {
  const sorted = [...summaries].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;

  for (const summary of sorted) {
    if (summary.totalCaloriesBurned >= burnGoal) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function calculateIntakeStreak(summaries: DailySummary[], calorieTarget: number): number {
  const sorted = [...summaries].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;

  for (const summary of sorted) {
    if (summary.totalCaloriesConsumed <= calorieTarget) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
