import Dexie, { type Table } from "dexie";
import type { FoodEntry, DailyGoals, DailySummary } from "@/types";

export class FitnessDatabase extends Dexie {
  foodEntries!: Table<FoodEntry, number>;
  dailyGoals!: Table<DailyGoals, number>;
  dailySummaries!: Table<DailySummary, number>;

  constructor() {
    super("FitnessNutritionDB");
    this.version(1).stores({
      foodEntries: "++id, date, timestamp",
      dailyGoals: "id",
      dailySummaries: "++id, &date",
    });
  }
}

export const db = new FitnessDatabase();
