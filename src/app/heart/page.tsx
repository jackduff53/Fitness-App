"use client";

import { useState, useEffect } from "react";
import { useGarminData } from "@/contexts/GarminDataContext";
import { useGoals } from "@/contexts/GoalsContext";
import { calculateHeartHealthScore, getScoreColor } from "@/services/heartHealthCalculator";
import { aggregateDailyNutrition } from "@/services/nutritionCalculator";
import { db } from "@/db/database";
import type { FoodEntry, HeartHealthColor } from "@/types";

interface Insights {
  overallAssessment: string;
  positives: string[];
  improvements: string[];
  recommendations: { title: string; detail: string }[];
  scoreBreakdown?: {
    fiberScore: number;
    cardioScore: number;
    calorieScore: number;
    fatScore: number;
    penaltyScore: number;
  };
}

const scoreColorClass: Record<HeartHealthColor, string> = {
  green: "text-green-400",
  yellow: "text-amber-400",
  red: "text-red-400",
};

const scoreGlowClass: Record<HeartHealthColor, string> = {
  green: "shadow-[0_0_40px_rgba(74,222,128,0.3)]",
  yellow: "shadow-[0_0_40px_rgba(251,191,36,0.3)]",
  red: "shadow-[0_0_40px_rgba(248,113,113,0.3)]",
};

export default function HeartHealthPage() {
  const { data: garminData } = useGarminData();
  const { goals } = useGoals();
  const [weekEntries, setWeekEntries] = useState<FoodEntry[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyScores, setDailyScores] = useState<{ date: string; score: number }[]>([]);

  // Load 7 days of food entries
  useEffect(() => {
    async function loadWeekData() {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const startDate = sevenDaysAgo.toISOString().split("T")[0];

      const entries = await db.foodEntries
        .where("date")
        .aboveOrEqual(startDate)
        .toArray();
      setWeekEntries(entries);

      // Compute daily scores
      const dateMap: Record<string, FoodEntry[]> = {};
      entries.forEach((e) => {
        if (!dateMap[e.date]) dateMap[e.date] = [];
        dateMap[e.date].push(e);
      });

      const scores = Object.entries(dateMap).map(([date, dayEntries]) => {
        const nutrition = aggregateDailyNutrition(dayEntries);
        const hasCardio = (garminData?.workouts || []).some((w) =>
          w.date === date && ["Run", "Ride", "Swim", "Walk", "Hike"].includes(w.type)
        );
        const score = calculateHeartHealthScore({
          dailyFiber: nutrition.totalFiber,
          hasCardioWorkout: hasCardio,
          caloriesConsumed: nutrition.totalCalories,
          calorieTarget: goals?.calorieTarget || 2000,
          fatConsumed: nutrition.totalFat,
          fatTarget: goals?.fatTarget || 65,
          unhealthyFoodCount: nutrition.unhealthyFoodCount,
        });
        return { date, score };
      }).sort((a, b) => a.date.localeCompare(b.date));

      setDailyScores(scores);
    }
    loadWeekData();
  }, [garminData, goals]);

  // Compute current score
  const today = new Date().toISOString().split("T")[0];
  const todayEntries = weekEntries.filter((e) => e.date === today);
  const todayNutrition = aggregateDailyNutrition(todayEntries);
  const hasCardioToday = (garminData?.workouts || []).some((w) =>
    w.date === today && ["Run", "Ride", "Swim", "Walk", "Hike"].includes(w.type)
  );
  const currentScore = calculateHeartHealthScore({
    dailyFiber: todayNutrition.totalFiber,
    hasCardioWorkout: hasCardioToday,
    caloriesConsumed: todayNutrition.totalCalories,
    calorieTarget: goals?.calorieTarget || 2000,
    fatConsumed: todayNutrition.totalFat,
    fatTarget: goals?.fatTarget || 65,
    unhealthyFoodCount: todayNutrition.unhealthyFoodCount,
  });
  const scoreColor = getScoreColor(currentScore);
  const avgScore = dailyScores.length > 0
    ? Math.round(dailyScores.reduce((sum, d) => sum + d.score, 0) / dailyScores.length)
    : currentScore;

  async function generateInsights() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/heart-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodEntries: weekEntries,
          workouts: garminData?.workouts || [],
          goals,
          currentScore: avgScore,
        }),
      });
      const data = await res.json();
      if (data.overallAssessment) {
        setInsights(data);
      }
    } catch {}
    finally { setIsLoading(false); }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black tracking-tight">Heart Health</h1>

      {/* Score Hero */}
      <div className={`gradient-card rounded-2xl p-6 text-center ${scoreGlowClass[scoreColor]}`}>
        <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Today&apos;s Score</p>
        <p className={`text-6xl font-black ${scoreColorClass[scoreColor]}`}>{currentScore}</p>
        <p className="text-xs text-text-secondary mt-2">7-day average: {avgScore}</p>
        <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden mt-4">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              scoreColor === "green" ? "bg-green-400" : scoreColor === "yellow" ? "bg-amber-400" : "bg-red-400"
            }`}
            style={{ width: `${currentScore}%` }}
          />
        </div>
      </div>

      {/* 7-day score history */}
      {dailyScores.length > 0 && (
        <div className="gradient-card rounded-2xl p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-3">7-Day Score Trend</p>
          <div className="flex justify-between items-end h-20 gap-1">
            {dailyScores.map((d, i) => {
              const color = getScoreColor(d.score);
              const barColor = color === "green" ? "bg-green-400" : color === "yellow" ? "bg-amber-400" : "bg-red-400";
              return (
                <div key={i} className="flex flex-col items-center flex-1 gap-1">
                  <span className="text-[10px] text-text-secondary">{d.score}</span>
                  <div className="w-full rounded-t-sm flex-1 relative" style={{ height: `${d.score}%` }}>
                    <div className={`absolute bottom-0 w-full rounded-sm ${barColor}`} style={{ height: `${d.score}%` }} />
                  </div>
                  <span className="text-[9px] text-text-secondary">
                    {new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "narrow" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Score breakdown */}
      <div className="gradient-card rounded-2xl p-4">
        <p className="text-xs text-text-secondary uppercase tracking-wider mb-3">Score Breakdown (Today)</p>
        <div className="space-y-2">
          <BreakdownRow label="Fiber intake" value={todayNutrition.totalFiber >= 25 ? "Excellent (≥25g)" : todayNutrition.totalFiber > 10 ? `Good (${Math.round(todayNutrition.totalFiber)}g)` : `Low (${Math.round(todayNutrition.totalFiber)}g)`} positive={todayNutrition.totalFiber >= 10} />
          <BreakdownRow label="Cardio today" value={hasCardioToday ? "Yes ✓" : "None yet"} positive={hasCardioToday} />
          <BreakdownRow label="Calorie target" value={todayNutrition.totalCalories <= (goals?.calorieTarget || 2000) ? "Within target" : "Over target"} positive={todayNutrition.totalCalories <= (goals?.calorieTarget || 2000)} />
          <BreakdownRow label="Fat target" value={todayNutrition.totalFat <= (goals?.fatTarget || 65) ? "Within target" : "Over target"} positive={todayNutrition.totalFat <= (goals?.fatTarget || 65)} />
          <BreakdownRow label="Unhealthy foods" value={todayNutrition.unhealthyFoodCount === 0 ? "None ✓" : `${todayNutrition.unhealthyFoodCount} flagged`} positive={todayNutrition.unhealthyFoodCount === 0} />
        </div>
      </div>

      {/* AI Insights */}
      <div className="gradient-card rounded-2xl p-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs text-text-secondary uppercase tracking-wider">AI Insights & Recommendations</p>
          <button
            onClick={generateInsights}
            disabled={isLoading}
            className="text-xs font-medium text-accent bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/20 disabled:opacity-40"
          >
            {isLoading ? "⟳ Analyzing..." : "✨ Analyze"}
          </button>
        </div>

        {!insights && !isLoading && (
          <p className="text-sm text-text-secondary">Tap Analyze to get personalized heart health insights based on your last 7 days.</p>
        )}

        {insights && (
          <div className="space-y-4">
            <p className="text-sm text-white/90 leading-relaxed">{insights.overallAssessment}</p>

            <div>
              <p className="text-xs font-semibold text-green-400 mb-2">✓ What you did well</p>
              {insights.positives.map((p, i) => (
                <p key={i} className="text-sm text-white/80 ml-4 mb-1">• {p}</p>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-amber-400 mb-2">⚡ Areas to improve</p>
              {insights.improvements.map((imp, i) => (
                <p key={i} className="text-sm text-white/80 ml-4 mb-1">• {imp}</p>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-accent mb-2">🎯 Recommendations for next week</p>
              <div className="space-y-2">
                {insights.recommendations.map((rec, i) => (
                  <div key={i} className="bg-black/30 rounded-lg p-3 border border-white/5">
                    <p className="text-sm font-medium text-white">{rec.title}</p>
                    <p className="text-xs text-text-secondary mt-1">{rec.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BreakdownRow({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className="flex justify-between items-center bg-black/30 rounded-lg px-3 py-2">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={`text-sm font-medium ${positive ? "text-green-400" : "text-amber-400"}`}>{value}</span>
    </div>
  );
}
