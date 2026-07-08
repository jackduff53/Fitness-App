"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { GarminDailyData } from "@/types";
import { fetchGarminData, GarminAuthError, GarminNetworkError } from "@/services/garminService";

interface GarminDataState {
  data: GarminDailyData | null;
  isLoading: boolean;
  error: "auth" | "network" | null;
  lastFetched: number | null;
  refresh: () => Promise<void>;
}

const GarminDataContext = createContext<GarminDataState>({
  data: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  refresh: async () => {},
});

export function GarminDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<GarminDailyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<"auth" | "network" | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchGarminData();
      setData(result);
      setLastFetched(Date.now());
    } catch (err) {
      if (err instanceof GarminAuthError) {
        setError("auth");
      } else if (err instanceof GarminNetworkError) {
        setError("network");
      } else {
        setError("network");
      }
      // Retain last data on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <GarminDataContext.Provider value={{ data, isLoading, error, lastFetched, refresh }}>
      {children}
    </GarminDataContext.Provider>
  );
}

export function useGarminData() {
  return useContext(GarminDataContext);
}
