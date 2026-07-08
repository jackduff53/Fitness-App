"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { DailyGoals } from "@/types";
import { db } from "@/db/database";

interface GoalsState {
  goals: DailyGoals | null;
  isLoading: boolean;
  updateGoals: (goals: Partial<DailyGoals>) => Promise<void>;
}

const GoalsContext = createContext<GoalsState>({
  goals: null,
  isLoading: true,
  updateGoals: async () => {},
});

const DEFAULT_GOALS: DailyGoals = {
  id: 1,
  calorieTarget: 2000,
  proteinTarget: 150,
  carbsTarget: 250,
  fatTarget: 65,
  burnGoal: 500,
};

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<DailyGoals | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadGoals() {
      try {
        const stored = await db.dailyGoals.get(1);
        if (stored) {
          setGoals(stored);
        } else {
          await db.dailyGoals.put(DEFAULT_GOALS);
          setGoals(DEFAULT_GOALS);
        }
      } catch {
        setGoals(DEFAULT_GOALS);
      } finally {
        setIsLoading(false);
      }
    }
    loadGoals();
  }, []);

  const updateGoals = useCallback(async (updates: Partial<DailyGoals>) => {
    const updated = { ...goals, ...updates, id: 1 } as DailyGoals;
    await db.dailyGoals.put(updated);
    setGoals(updated);
  }, [goals]);

  return (
    <GoalsContext.Provider value={{ goals, isLoading, updateGoals }}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  return useContext(GoalsContext);
}
