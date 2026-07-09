"use client";

import { useState, useEffect } from "react";
import { FoodEntryForm } from "@/components/FoodEntryForm";
import { FoodReviewCard } from "@/components/FoodReviewCard";
import { parseFoodDescription } from "@/services/openaiService";
import { db } from "@/db/database";
import type { FoodEntry, ParsedFoodResult } from "@/types";

export default function FoodLogPage() {
  const [todayEntries, setTodayEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedFoodResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    loadEntries();
  }, [today]);

  async function loadEntries() {
    const entries = await db.foodEntries.where("date").equals(today).toArray();
    setTodayEntries(entries.sort((a, b) => b.timestamp - a.timestamp));
  }

  async function handleSubmit(description: string) {
    setIsLoading(true);
    setError(null);
    setShowManual(false);
    try {
      const result = await parseFoodDescription(description);
      setParsedResult(result);
    } catch (err: any) {
      const msg = err?.message || "Unknown error";
      setError(`AI parsing failed: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirm(result: ParsedFoodResult) {
    const entry: FoodEntry = {
      ...result,
      timestamp: Date.now(),
      date: today,
    };
    await db.foodEntries.add(entry);
    setParsedResult(null);
    setShowManual(false);
    loadEntries();
  }

  function handleCancel() {
    setParsedResult(null);
    setError(null);
  }

  async function handleDelete(id: number) {
    await db.foodEntries.delete(id);
    loadEntries();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Food Log</h1>

      <FoodEntryForm onSubmit={handleSubmit} isLoading={isLoading} isOffline={isOffline} />

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3">
          <p className="text-xs text-red-400">{error}</p>
          <button 
            onClick={() => { setShowManual(true); setError(null); }}
            className="text-xs text-accent mt-2 underline"
          >
            Enter manually instead
          </button>
        </div>
      )}

      {parsedResult && (
        <FoodReviewCard
          parsedResult={parsedResult}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {(isOffline || showManual) && !parsedResult && (
        <div className="bg-card rounded-xl p-4">
          <h3 className="text-sm text-text-secondary mb-3">Manual Entry</h3>
          <ManualEntryForm onConfirm={handleConfirm} />
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm text-text-secondary">Today&apos;s Entries ({todayEntries.length})</h2>
        {todayEntries.length === 0 && (
          <p className="text-text-secondary text-sm">No food logged today</p>
        )}
        {todayEntries.map((entry) => (
          <div key={entry.id} className="bg-card rounded-xl p-3 flex justify-between items-center">
            <div>
              <p className="text-sm text-text-primary">{entry.name}</p>
              <p className="text-xs text-text-secondary">
                {entry.calories} cal · P:{entry.protein}g · C:{entry.carbs}g · F:{entry.fat}g
              </p>
            </div>
            <button onClick={() => entry.id && handleDelete(entry.id)} className="text-red-400 text-xs">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManualEntryForm({ onConfirm }: { onConfirm: (result: ParsedFoodResult) => void }) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      name: name || "Manual Entry",
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      fiber: Number(fiber) || 0,
      heartUnhealthy: false,
    });
    setName(""); setCalories(""); setProtein(""); setCarbs(""); setFat(""); setFiber("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Food name" className="w-full bg-background text-text-primary rounded-lg px-3 py-2 text-sm" />
      <div className="grid grid-cols-2 gap-2">
        <input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="Calories" className="bg-background text-text-primary rounded-lg px-3 py-2 text-sm" />
        <input type="number" value={protein} onChange={e => setProtein(e.target.value)} placeholder="Protein (g)" className="bg-background text-text-primary rounded-lg px-3 py-2 text-sm" />
        <input type="number" value={carbs} onChange={e => setCarbs(e.target.value)} placeholder="Carbs (g)" className="bg-background text-text-primary rounded-lg px-3 py-2 text-sm" />
        <input type="number" value={fat} onChange={e => setFat(e.target.value)} placeholder="Fat (g)" className="bg-background text-text-primary rounded-lg px-3 py-2 text-sm" />
        <input type="number" value={fiber} onChange={e => setFiber(e.target.value)} placeholder="Fiber (g)" className="bg-background text-text-primary rounded-lg px-3 py-2 text-sm" />
      </div>
      <button type="submit" className="w-full bg-accent text-background font-semibold py-2 rounded-lg">
        Add Entry
      </button>
    </form>
  );
}
