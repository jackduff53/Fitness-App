export interface FoodEntry {
  id?: number;               // Auto-incremented by Dexie
  name: string;
  calories: number;
  protein: number;           // grams
  carbs: number;             // grams
  fat: number;               // grams
  fiber: number;             // grams
  heartUnhealthy: boolean;
  heartUnhealthyReason?: string;
  timestamp: number;         // Unix timestamp (ms)
  date: string;              // ISO date string "YYYY-MM-DD" for indexing
}

export interface DailyGoals {
  id?: number;               // Single row, id = 1
  calorieTarget: number;
  proteinTarget: number;     // grams
  carbsTarget: number;       // grams
  fatTarget: number;         // grams
  burnGoal: number;          // calories
}

export interface Workout {
  type: string;              // e.g., "Running", "Cycling", "Strength"
  durationMinutes: number;
  caloriesBurned: number;
  date: string;              // ISO date string "YYYY-MM-DD"
}

export interface DailySummary {
  id?: number;
  date: string;              // ISO date string "YYYY-MM-DD" (unique index)
  totalCaloriesConsumed: number;
  totalCaloriesBurned: number;
  stepCount: number;
  restingHeartRate: number | null;
  workouts: Workout[];
}

export interface GarminDailyData {
  steps: number;
  activeCaloriesBurned: number;
  workouts: Workout[];
  restingHeartRate: number | null;
}

export interface ParsedFoodResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  heartUnhealthy: boolean;
  heartUnhealthyReason?: string;
}

export interface HeartHealthInput {
  dailyFiber: number;
  hasCardioWorkout: boolean;
  caloriesConsumed: number;
  calorieTarget: number;
  fatConsumed: number;
  fatTarget: number;
  unhealthyFoodCount: number;
}

export type WorkoutRecommendation = "cardio" | "recovery";

export type HeartHealthColor = "green" | "yellow" | "red";
