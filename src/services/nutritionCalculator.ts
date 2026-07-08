import type { FoodEntry } from "@/types";

export function aggregateDailyNutrition(entries: FoodEntry[]) {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  let unhealthyFoodCount = 0;
  const unhealthyFoodNames: string[] = [];

  for (const entry of entries) {
    totalCalories += entry.calories;
    totalProtein += entry.protein;
    totalCarbs += entry.carbs;
    totalFat += entry.fat;
    totalFiber += entry.fiber;
    if (entry.heartUnhealthy) {
      unhealthyFoodCount++;
      unhealthyFoodNames.push(entry.name);
    }
  }

  return {
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    totalFiber,
    unhealthyFoodCount,
    unhealthyFoodNames,
  };
}
