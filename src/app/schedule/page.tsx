"use client";

import { useState, useEffect } from "react";
import { useGarminData } from "@/contexts/GarminDataContext";

interface DayPlan {
  day: string;
  type: string;
  emoji: string;
  focus: string;
  description: string;
  heartNote: string;
  intensity?: string;
}

const DEFAULT_SCHEDULE: DayPlan[] = [
  { day: "Sunday", type: "Active Recovery", emoji: "🧘", focus: "Mobility & Light Cardio", description: "30 min easy walk or yoga. Focus on stretching and joint mobility.", heartNote: "Keeps blood flowing without stressing the cardiovascular system" },
  { day: "Monday", type: "Upper Body Strength", emoji: "💪", focus: "Push & Pull", description: "Bench press, rows, shoulder press, pull-ups, tricep/bicep work. 45-60 min.", heartNote: "Resistance training improves resting heart rate over time" },
  { day: "Tuesday", type: "Cardio — Run", emoji: "🏃", focus: "Steady State / Zone 2", description: "30-45 min run at conversational pace. Keep heart rate 130-150 bpm.", heartNote: "Zone 2 cardio builds aerobic base and strengthens the heart" },
  { day: "Wednesday", type: "Lower Body Strength", emoji: "🦵", focus: "Legs & Core", description: "Squats, deadlifts, lunges, leg press, calf raises, core work. 45-60 min.", heartNote: "Large muscle groups increase calorie burn and metabolic health" },
  { day: "Thursday", type: "Cardio — Run", emoji: "🏃", focus: "Intervals / Tempo", description: "Warm up 10 min, then alternating fast/slow intervals for 20-30 min. Cool down.", heartNote: "HIIT intervals strengthen cardiac output and VO2max" },
  { day: "Friday", type: "Upper Body Strength", emoji: "💪", focus: "Push & Pull (Volume)", description: "Similar to Monday with different exercises or rep ranges. 45-60 min.", heartNote: "Consistent resistance training lowers blood pressure long-term" },
  { day: "Saturday", type: "Cardio — Long Run", emoji: "🏃‍♂️", focus: "Endurance", description: "45-75 min easy-to-moderate run. Build distance gradually.", heartNote: "Long steady runs maximize cardiovascular adaptation" },
];

const intensityColors: Record<string, string> = {
  low: "bg-green-500/20 text-green-400 border-green-500/30",
  moderate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  high: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<DayPlan[]>(DEFAULT_SCHEDULE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const { data: garminData } = useGarminData();
  const today = new Date().getDay(); // 0 = Sunday

  // Load saved plan from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("weeklyPlan");
    const savedDate = localStorage.getItem("weeklyPlanDate");
    if (saved) {
      try {
        setSchedule(JSON.parse(saved));
        setLastGenerated(savedDate);
      } catch {}
    }
  }, []);

  async function generateNewPlan() {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastWeekActivities: garminData?.workouts || [],
        }),
      });

      const data = await res.json();
      if (data.plan && data.plan.length === 7) {
        setSchedule(data.plan);
        const now = new Date().toLocaleDateString();
        setLastGenerated(now);
        localStorage.setItem("weeklyPlan", JSON.stringify(data.plan));
        localStorage.setItem("weeklyPlanDate", now);
      }
    } catch {
      // Keep existing schedule on error
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Weekly Plan</h1>
          <p className="text-xs text-text-secondary mt-1">
            {lastGenerated ? `Generated ${lastGenerated}` : "Default plan — tap Generate for personalized"}
          </p>
        </div>
        <button
          onClick={generateNewPlan}
          disabled={isGenerating}
          className="text-xs font-medium text-accent bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/20 disabled:opacity-40 transition-all hover:bg-accent/20"
        >
          {isGenerating ? "⟳ Generating..." : "✨ Generate"}
        </button>
      </div>

      <div className="space-y-3">
        {schedule.map((item, i) => {
          const isToday = i === today;
          return (
            <div
              key={item.day}
              className={`gradient-card rounded-2xl p-4 transition-all ${
                isToday ? "glow-orange-strong border border-accent/40" : "border border-transparent"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.emoji}</span>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? "text-accent" : "text-text-secondary"}`}>
                      {item.day} {isToday && "— TODAY"}
                    </span>
                    {item.intensity && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${intensityColors[item.intensity] || ""}`}>
                        {item.intensity}
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-bold mt-1 text-white">{item.type}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{item.focus}</p>
                  <p className="text-sm text-white/80 mt-2 leading-relaxed">{item.description}</p>
                  <p className="text-xs text-green-400/70 mt-2 italic">❤️ {item.heartNote}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
