"use client";

import { useState } from "react";
import type { ParsedFoodResult } from "@/types";

interface FoodReviewCardProps {
  parsedResult: ParsedFoodResult;
  onConfirm: (entry: ParsedFoodResult) => void;
  onCancel: () => void;
}

export function FoodReviewCard({ parsedResult, onConfirm, onCancel }: FoodReviewCardProps) {
  const [name, setName] = useState(parsedResult.name);
  const [calories, setCalories] = useState(String(parsedResult.calories));
  const [protein, setProtein] = useState(String(parsedResult.protein));
  const [carbs, setCarbs] = useState(String(parsedResult.carbs));
  const [fat, setFat] = useState(String(parsedResult.fat));
  const [fiber, setFiber] = useState(String(parsedResult.fiber));

  const handleConfirm = () => {
    onConfirm({
      name,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      fiber: Number(fiber) || 0,
      heartUnhealthy: parsedResult.heartUnhealthy,
      heartUnhealthyReason: parsedResult.heartUnhealthyReason,
    });
  };

  return (
    <div className="bg-card rounded-xl p-4 border border-accent/30">
      <h3 className="text-sm text-text-secondary mb-3">Review Parsed Food</h3>
      <div className="space-y-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-background text-text-primary rounded-lg px-3 py-2 text-sm"
          placeholder="Food name"
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-text-secondary">Calories</label>
            <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} className="w-full bg-background text-text-primary rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-text-secondary">Protein (g)</label>
            <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} className="w-full bg-background text-text-primary rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-text-secondary">Carbs (g)</label>
            <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} className="w-full bg-background text-text-primary rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-text-secondary">Fat (g)</label>
            <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} className="w-full bg-background text-text-primary rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-text-secondary">Fiber (g)</label>
            <input type="number" value={fiber} onChange={(e) => setFiber(e.target.value)} className="w-full bg-background text-text-primary rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        {parsedResult.heartUnhealthy && (
          <p className="text-xs text-red-400">⚠️ Heart Unhealthy: {parsedResult.heartUnhealthyReason}</p>
        )}
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={handleConfirm} className="flex-1 bg-accent text-background font-semibold py-2 rounded-lg">
          Confirm
        </button>
        <button onClick={onCancel} className="flex-1 bg-background text-text-secondary py-2 rounded-lg border border-gray-700">
          Cancel
        </button>
      </div>
    </div>
  );
}
