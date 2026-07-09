"use client";

import { useEffect, useState } from "react";
import { useGarminData } from "@/contexts/GarminDataContext";
import { useGoals } from "@/contexts/GoalsContext";
import { ProgressRing } from "@/components/ProgressRing";
import { MetricCard } from "@/components/MetricCard";
import { SparklineChart } from "@/components/SparklineChart";
import { WorkoutCard } from "@/components/WorkoutCard";
import { HeartHealthCard } from "@/components/HeartHealthCard";
import { WorkoutRecommendationCard } from "@/components/WorkoutRecommendationCard";
import { StreakCounter } from "@/components/StreakCounter";
import { aggregateDailyNutrition } from "@/services/nutritionCalculator";
import { calculateHeartHealthScore, getScoreColor } from "@/services/heartHealthCalculator";
import { getWorkoutRecommendation } from "@/services/workoutRecommendation";
import { calculateBurnStreak, calculateIntakeStreak } from "@/services/streakCalculator";
import { db } from "@/db/database";
import type { FoodEntry, DailySummary } from "@/types";

export default function Dashboard() {
  const { data: garminData, isLoading, error, refresh } = useGarminData();
  const { goals } = useGoals();
  const [todayEntries, setTodayEntries] = useState<FoodEntry[]>([]);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    async function loadData() {
      const entries = await db.foodEntries.where("date").equals(today).toArray();
      setTodayEntries(entries);
      const allSummaries = await db.dailySummaries.toArray();
      setSummaries(allSummaries);
    }
    loadData();
  }, [today]);

  const nutrition = aggregateDailyNutrition(todayEntries);
  const caloriesBurned = garminData?.activeCaloriesBurned || 0;
  const steps = garminData?.steps || 0;
  const workouts = garminData?.workouts || [];
  const restingHR = garminData?.restingHeartRate;
  const burnGoal = goals?.burnGoal || 500;
  const calorieTarget = goals?.calorieTarget || 2000;
  const fatTarget = goals?.fatTarget || 65;

  const hasCardio = workouts.some(w =>
    ["Running", "Cycling", "Walking", "Cardio", "Swimming"].includes(w.type)
  );

  const heartScore = calculateHeartHealthScore({
    dailyFiber: nutrition.totalFiber,
    hasCardioWorkout: hasCardio,
    caloriesConsumed: nutrition.totalCalories,
    calorieTarget,
    fatConsumed: nutrition.totalFat,
    fatTarget,
    unhealthyFoodCount: nutrition.unhealthyFoodCount,
  });

  const scoreColor = getScoreColor(heartScore);
  const recommendation = getWorkoutRecommendation(caloriesBurned, burnGoal);
  const burnStreak = calculateBurnStreak(summaries, burnGoal);
  const intakeStreak = calculateIntakeStreak(summaries, calorieTarget);

  // Sparkline data from summaries
  const recentSummaries = [...summaries].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  const burnedSparkline = recentSummaries.map(s => s.totalCaloriesBurned);
  const consumedSparkline = recentSummaries.map(s => s.totalCaloriesConsumed);
  const stepsSparkline = recentSummaries.map(s => s.stepCount);
  const hrSparkline = recentSummaries.map(s => s.restingHeartRate || 0).filter(v => v > 0);

  const [authError, setAuthError] = useState<string | null>(null);

  async function handleConnectStrava() {
    setAuthError(null);
    try {
      const res = await fetch("/api/garmin/auth", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setAuthError(data.error || "Failed to get authorization URL");
      }
    } catch (err) {
      setAuthError("Network error — check your connection");
    }
  }

  if (error === "auth") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-text-secondary text-center">Connect your Strava account to see your activity data</p>
        <button onClick={handleConnectStrava} className="bg-accent text-background font-semibold px-6 py-3 rounded-xl">
          Connect Strava
        </button>
        {authError && <p className="text-red-400 text-xs text-center">{authError}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="text-xs font-medium text-accent bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/20 disabled:opacity-40 transition-all hover:bg-accent/20"
        >
          {isLoading ? "⟳ Syncing" : "↻ Sync"}
        </button>
      </div>

      {error === "network" && (
        <p className="text-xs text-yellow-400 bg-yellow-900/20 rounded-lg p-2">
          Unable to reach Garmin — showing cached data
        </p>
      )}

      {/* 1. Calories Burned vs Goal */}
      <div className="flex justify-center relative">
        <ProgressRing current={caloriesBurned} goal={burnGoal} label="Calories Burned" />
      </div>

      {/* 3. Calories Consumed vs Goal */}
      <div className="flex justify-center relative">
        <ProgressRing current={nutrition.totalCalories} goal={calorieTarget} label="Calories Consumed" />
      </div>

      {/* 4. Steps */}
      <MetricCard title="Steps" value={steps.toLocaleString()} icon="👟" />

      {/* 5. Resting Heart Rate */}
      <MetricCard
        title="Resting Heart Rate"
        value={restingHR ? `${restingHR} bpm` : "—"}
        icon="💓"
        subtitle={restingHR ? undefined : "Data unavailable"}
      >
        {hrSparkline.length > 0 && (
          <div className="mt-2">
            <SparklineChart data={hrSparkline} label="7-day HR" color="#FF6B00" />
          </div>
        )}
      </MetricCard>

      {/* 6. Workout Stats */}
      <WorkoutCard workouts={workouts} />

      {/* 7. Heart Health Score */}
      <HeartHealthCard score={heartScore} color={scoreColor} unhealthyFoods={nutrition.unhealthyFoodNames} />

      {/* 8. Weekly Trends */}
      <div className="gradient-card rounded-2xl p-5 space-y-4">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Weekly Trends</p>
        <SparklineChart data={burnedSparkline} label="Calories Burned" />
        <SparklineChart data={consumedSparkline} label="Calories Consumed" />
        <SparklineChart data={stepsSparkline} label="Steps" />
      </div>

      {/* 9. Streak Counters */}
      <StreakCounter burnStreak={burnStreak} intakeStreak={intakeStreak} />
    </div>
  );
}
