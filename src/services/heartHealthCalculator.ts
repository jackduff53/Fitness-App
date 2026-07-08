import type { HeartHealthInput, HeartHealthColor } from "@/types";

export function calculateHeartHealthScore(input: HeartHealthInput): number {
  let score = 50;

  // Fiber bonus: +10 if fiber >= 25g
  if (input.dailyFiber >= 25) {
    score += 10;
  }

  // Fiber graduated bonus: +5 per 5g over 10g, capped at +15
  if (input.dailyFiber > 10) {
    const fiberOver10 = input.dailyFiber - 10;
    const fiberBonusSteps = Math.floor(fiberOver10 / 5);
    score += Math.min(fiberBonusSteps * 5, 15);
  }

  // Cardio bonus: +15 if any cardio workout completed
  if (input.hasCardioWorkout) {
    score += 15;
  }

  // Calorie target bonus: +10 if within target
  if (input.calorieTarget > 0 && input.caloriesConsumed <= input.calorieTarget) {
    score += 10;
  }

  // Fat target bonus: +10 if within target
  if (input.fatTarget > 0 && input.fatConsumed <= input.fatTarget) {
    score += 10;
  }

  // Unhealthy food penalty: -10 per flagged entry
  score -= input.unhealthyFoodCount * 10;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

export function getScoreColor(score: number): HeartHealthColor {
  if (score >= 70) return "green";
  if (score >= 40) return "yellow";
  return "red";
}
