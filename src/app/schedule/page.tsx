"use client";

import { useState, useEffect } from "react";
import { useGarminData } from "@/contexts/GarminDataContext";

interface DayPlan {
  day: string;
  type: string;
  emoji: string;
  focus: string;
  exercises?: string[];
  description?: string;
  duration?: string;
  heartNote: string;
  intensity?: string;
}

const DEFAULT_SCHEDULE: DayPlan[] = [
  { day: "Sunday", type: "Active Recovery", emoji: "🧘", focus: "Mobility & Flexibility", duration: "30 min", exercises: ["Foam roll quads & hamstrings: 2 min each", "Pigeon stretch: 3×45 sec hold each side", "Cat-cow: 2×15 reps", "World's greatest stretch: 3×5 each side", "Easy walk: 20 min @ casual pace", "Deep breathing: 5 min box breathing (4-4-4-4)"], heartNote: "Active recovery promotes blood flow and reduces resting heart rate" },
  { day: "Monday", type: "Upper Body Push", emoji: "💪", focus: "Chest, Shoulders, Triceps", duration: "55 min", intensity: "high", exercises: ["Warm-up: 5 min rowing machine, moderate pace", "Barbell Bench Press: 4×8 @ moderate-heavy", "Incline Dumbbell Press: 3×10", "Overhead Press: 4×8", "Cable Lateral Raises: 3×12", "Tricep Rope Pushdowns: 3×12", "Dips: 3×10 (bodyweight or assisted)", "Cool-down: 3 min chest/shoulder stretch"], heartNote: "Compound pushing movements elevate heart rate and build functional strength" },
  { day: "Tuesday", type: "Zone 2 Run", emoji: "🏃", focus: "Aerobic Base Building", duration: "40 min", intensity: "moderate", exercises: ["Warm-up: 5 min brisk walk", "Run: 3.5 miles @ 9:00-9:30/mi pace", "Target HR: 130-145 bpm (conversational)", "Terrain: flat route preferred", "Cool-down: 5 min walk + calf stretches"], heartNote: "Zone 2 running maximizes mitochondrial density and aerobic capacity" },
  { day: "Wednesday", type: "Lower Body", emoji: "🦵", focus: "Legs & Core", duration: "60 min", intensity: "high", exercises: ["Warm-up: 5 min bike + bodyweight squats", "Barbell Back Squat: 4×6 @ heavy", "Romanian Deadlift: 3×10 @ moderate", "Walking Lunges: 3×12 each leg", "Leg Press: 3×12", "Calf Raises: 4×15", "Plank: 3×45 sec", "Hanging Leg Raises: 3×10", "Cool-down: quad & hip flexor stretch 2 min each"], heartNote: "Training large muscle groups maximizes caloric expenditure and cardiovascular demand" },
  { day: "Thursday", type: "Tempo Run + Intervals", emoji: "🏃", focus: "Speed & VO2max", duration: "35 min", intensity: "high", exercises: ["Warm-up: 10 min easy jog @ 10:00/mi", "Tempo block: 10 min @ 7:45-8:00/mi (comfortably hard)", "Recovery jog: 3 min easy", "Intervals: 4×400m @ 7:00/mi pace, 90 sec rest between", "Cool-down: 5 min easy jog + walk", "Target peak HR: 165-175 bpm"], heartNote: "Tempo runs and intervals increase stroke volume and cardiac output" },
  { day: "Friday", type: "Upper Body Pull", emoji: "💪", focus: "Back, Biceps, Rear Delts", duration: "55 min", intensity: "high", exercises: ["Warm-up: 5 min rowing machine", "Pull-Ups: 4×8 (add weight if needed)", "Barbell Bent-Over Row: 4×8", "Seated Cable Row: 3×10", "Face Pulls: 3×15", "Dumbbell Bicep Curls: 3×12", "Hammer Curls: 3×10", "Rear Delt Flyes: 3×12", "Cool-down: lat & bicep stretch"], heartNote: "Balanced pulling volume prevents postural issues and supports cardiovascular exercise form" },
  { day: "Saturday", type: "Long Run", emoji: "🏃‍♂️", focus: "Endurance Building", duration: "55-65 min", intensity: "moderate", exercises: ["Warm-up: 5 min easy walking", "Run: 5.5-6 miles @ 9:15-9:45/mi pace", "Keep HR below 155 bpm", "Include 2 short walk breaks (1 min) if needed", "Negative split: run last mile slightly faster", "Cool-down: 5 min walk + full lower body stretch"], heartNote: "Long runs at moderate effort build endurance and train the heart to work efficiently" },
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
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const { data: garminData } = useGarminData();
  const today = new Date().getDay(); // 0 = Sunday

  // Auto-expand today
  useEffect(() => {
    setExpandedDay(today);
  }, [today]);

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
            {lastGenerated ? `AI-generated ${lastGenerated}` : "Default plan — tap Generate to personalize"}
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
          const isExpanded = expandedDay === i;

          return (
            <div
              key={item.day}
              onClick={() => setExpandedDay(isExpanded ? null : i)}
              className={`gradient-card rounded-2xl p-4 transition-all cursor-pointer ${
                isToday ? "glow-orange-strong border border-accent/40" : "border border-white/5 hover:border-white/10"
              }`}
            >
              {/* Header - always visible */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.emoji}</span>
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? "text-accent" : "text-text-secondary"}`}>
                      {item.day} {isToday && "— TODAY"}
                    </span>
                    <p className="text-sm font-bold text-white">{item.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.duration && <span className="text-xs text-text-secondary">{item.duration}</span>}
                  {item.intensity && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${intensityColors[item.intensity] || ""}`}>
                      {item.intensity}
                    </span>
                  )}
                  <span className="text-text-secondary text-xs">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="mt-4 space-y-3">
                  {item.exercises && item.exercises.length > 0 && (
                    <div className="space-y-1.5">
                      {item.exercises.map((exercise, j) => (
                        <div key={j} className="flex items-start gap-2 bg-black/30 rounded-lg px-3 py-2">
                          <span className="text-accent text-xs mt-0.5">•</span>
                          <span className="text-sm text-white/90">{exercise}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.description && !item.exercises && (
                    <p className="text-sm text-white/80">{item.description}</p>
                  )}
                  <p className="text-xs text-green-400/70 italic">❤️ {item.heartNote}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
