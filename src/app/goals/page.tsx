"use client";

import { useEffect, useState } from "react";
import { useGoals } from "@/contexts/GoalsContext";
import { MacroProgressBar } from "@/components/MacroProgressBar";
import { aggregateDailyNutrition } from "@/services/nutritionCalculator";
import { db } from "@/db/database";
import type { FoodEntry } from "@/types";

export default function GoalsPage() {
  const { goals, updateGoals, isLoading } = useGoals();
  const [todayEntries, setTodayEntries] = useState<FoodEntry[]>([]);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    async function load() {
      const entries = await db.foodEntries.where("date").equals(today).toArray();
      setTodayEntries(entries);
    }
    load();
  }, [today]);

  const nutrition = aggregateDailyNutrition(todayEntries);

  if (isLoading || !goals) {
    return <div className="text-text-secondary text-center py-10">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Goals & Settings</h1>

      <div className="bg-card rounded-xl p-4 space-y-4">
        <h2 className="text-sm text-text-secondary">Daily Targets</h2>
        <GoalField label="Calorie Target (cal)" value={goals.calorieTarget} onChange={(v) => updateGoals({ calorieTarget: v })} />
        <GoalField label="Burn Goal (cal)" value={goals.burnGoal} onChange={(v) => updateGoals({ burnGoal: v })} />
        <GoalField label="Protein (g)" value={goals.proteinTarget} onChange={(v) => updateGoals({ proteinTarget: v })} />
        <GoalField label="Carbs (g)" value={goals.carbsTarget} onChange={(v) => updateGoals({ carbsTarget: v })} />
        <GoalField label="Fat (g)" value={goals.fatTarget} onChange={(v) => updateGoals({ fatTarget: v })} />
      </div>

      <div className="bg-card rounded-xl p-4 space-y-3">
        <h2 className="text-sm text-text-secondary">Today&apos;s Progress</h2>
        <MacroProgressBar label="Calories" current={nutrition.totalCalories} target={goals.calorieTarget} unit="cal" />
        <MacroProgressBar label="Protein" current={nutrition.totalProtein} target={goals.proteinTarget} />
        <MacroProgressBar label="Carbs" current={nutrition.totalCarbs} target={goals.carbsTarget} />
        <MacroProgressBar label="Fat" current={nutrition.totalFat} target={goals.fatTarget} />
        <MacroProgressBar label="Fiber" current={nutrition.totalFiber} target={25} />
      </div>
    </div>
  );
}

function GoalField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex justify-between items-center">
      <label className="text-sm text-text-primary">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-24 bg-background text-text-primary text-right rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );
}
